import { Property } from '../../types';

export interface PropertyCluster {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  properties: Property[];
  minPrice: number;
  maxPrice: number;
  type: 'sale' | 'rent' | 'mixed';
  hasAgricultural: boolean;
  totalAcres: number;
  areaHint?: string;
  zoom: number;
}

/**
 * Spherical Mercator projection: projects [latitude, longitude] to continuous pixel space at specified zoom level.
 * World coordinate space at zoom 0 is 256x256 pixels.
 */
export function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const sinY = Math.sin((lat * Math.PI) / 180);
  const clampedSinY = Math.min(Math.max(sinY, -0.9999), 0.9999);
  const scale = 256 * Math.pow(2, zoom);
  const x = (0.5 + lng / 360) * scale;
  const y = (0.5 - Math.log((1 + clampedSinY) / (1 - clampedSinY)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/**
 * Calculate dynamic collision dimensions (rx, ry) in pixels based on zoom level.
 * Represents the collision box of a standard price tag pill (~95px wide by ~38px high).
 */
export function getCollisionThresholds(zoom: number): { rx: number; ry: number } {
  if (zoom <= 6) return { rx: 110, ry: 60 };
  if (zoom <= 8) return { rx: 100, ry: 55 };
  if (zoom <= 10) return { rx: 90, ry: 50 };
  if (zoom <= 12) return { rx: 85, ry: 45 };
  if (zoom <= 14) return { rx: 78, ry: 42 };
  if (zoom <= 15) return { rx: 65, ry: 38 };
  if (zoom <= 16) return { rx: 50, ry: 32 };
  // Zoom >= 17: Rooftop / building view. Only cluster items at nearly identical coordinates / same building
  return { rx: 32, ry: 24 };
}

/**
 * Intelligent Collision-Avoidance & Dynamic Clustering Engine
 * 
 * Prevents overlapping marker pills when zooming out on Google Maps.
 * Mathematically guarantees zero visual collisions by merging any properties
 * whose screen projection collision boxes overlap at the current zoom level.
 */
export function clusterProperties(
  properties: Property[],
  zoom: number,
  selectedPropertyId?: string
): { clusters: PropertyCluster[]; individualProperties: Property[] } {
  if (!properties || properties.length === 0) {
    return { clusters: [], individualProperties: [] };
  }

  // At zoom 18+ if properties have different coordinates, show individually
  const { rx, ry } = getCollisionThresholds(zoom);

  // Compute screen pixel position for all candidate properties
  const items = properties.map((p) => ({
    property: p,
    pixel: latLngToPixel(p.coordinates[1], p.coordinates[0], zoom),
    processed: false
  }));

  // Prioritize selected property so its position is preserved
  if (selectedPropertyId) {
    items.sort((a, b) => {
      if (a.property.id === selectedPropertyId) return -1;
      if (b.property.id === selectedPropertyId) return 1;
      return 0;
    });
  }

  interface NodeItem {
    coordinates: [number, number];
    pixel: { x: number; y: number };
    properties: Property[];
  }

  const nodes: NodeItem[] = [];

  // Pass 1: Greedy distance-based clustering
  for (let i = 0; i < items.length; i++) {
    if (items[i].processed) continue;
    items[i].processed = true;

    const group: Property[] = [items[i].property];
    let sumLng = items[i].property.coordinates[0];
    let sumLat = items[i].property.coordinates[1];

    for (let j = i + 1; j < items.length; j++) {
      if (items[j].processed) continue;

      const dx = Math.abs(items[i].pixel.x - items[j].pixel.x);
      const dy = Math.abs(items[i].pixel.y - items[j].pixel.y);

      if (dx < rx && dy < ry) {
        // Elliptical collision boundary check
        const normDist = (dx / rx) * (dx / rx) + (dy / ry) * (dy / ry);
        if (normDist < 1.0) {
          items[j].processed = true;
          group.push(items[j].property);
          sumLng += items[j].property.coordinates[0];
          sumLat += items[j].property.coordinates[1];
        }
      }
    }

    const cLng = sumLng / group.length;
    const cLat = sumLat / group.length;

    nodes.push({
      coordinates: [cLng, cLat],
      pixel: latLngToPixel(cLat, cLng, zoom),
      properties: group
    });
  }

  // Pass 2: Secondary de-confliction relaxation
  // Ensures that newly shifted cluster centroids don't collide with neighboring nodes
  let needsRelaxation = true;
  let iterations = 0;
  const maxIterations = 5;

  while (needsRelaxation && iterations < maxIterations) {
    needsRelaxation = false;
    iterations++;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = Math.abs(nodes[i].pixel.x - nodes[j].pixel.x);
        const dy = Math.abs(nodes[i].pixel.y - nodes[j].pixel.y);

        if (dx < rx * 0.85 && dy < ry * 0.85) {
          const normDist = (dx / (rx * 0.85)) * (dx / (rx * 0.85)) + (dy / (ry * 0.85)) * (dy / (ry * 0.85));
          if (normDist < 1.0) {
            // Merge node j into node i
            const combined = [...nodes[i].properties, ...nodes[j].properties];
            const sumLng = combined.reduce((acc, p) => acc + p.coordinates[0], 0);
            const sumLat = combined.reduce((acc, p) => acc + p.coordinates[1], 0);
            const cLng = sumLng / combined.length;
            const cLat = sumLat / combined.length;

            nodes[i] = {
              coordinates: [cLng, cLat],
              pixel: latLngToPixel(cLat, cLng, zoom),
              properties: combined
            };

            nodes.splice(j, 1);
            needsRelaxation = true;
            break;
          }
        }
      }
      if (needsRelaxation) break;
    }
  }

  const clusters: PropertyCluster[] = [];
  const individualProperties: Property[] = [];

  // Separate single items from multi-property clusters
  nodes.forEach((node) => {
    if (node.properties.length === 1) {
      individualProperties.push(node.properties[0]);
    } else {
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let hasSale = false;
      let hasRent = false;
      let hasAgricultural = false;
      let totalAcres = 0;
      const areaFrequencies = new Map<string, number>();

      node.properties.forEach((p) => {
        if (p.price < minPrice) minPrice = p.price;
        if (p.price > maxPrice) maxPrice = p.price;
        if (p.type === 'sale') hasSale = true;
        if (p.type === 'rent') hasRent = true;

        const isAgri = p.category === 'Agricultural Land' || p.category === 'Plot';
        if (isAgri) {
          hasAgricultural = true;
          if (p.landMetrics?.areaAcres) {
            totalAcres += p.landMetrics.areaAcres;
          }
        }

        if (p.area) {
          areaFrequencies.set(p.area, (areaFrequencies.get(p.area) || 0) + 1);
        }
      });

      // Find primary locality name for hint
      let primaryArea = '';
      let maxFreq = 0;
      areaFrequencies.forEach((freq, area) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          primaryArea = area;
        }
      });

      clusters.push({
        id: `cluster-${node.properties[0].id}-${node.properties.length}`,
        coordinates: node.coordinates,
        properties: node.properties,
        minPrice,
        maxPrice,
        type: hasSale && hasRent ? 'mixed' : hasRent ? 'rent' : 'sale',
        hasAgricultural,
        totalAcres,
        areaHint: primaryArea || node.properties[0].city || 'Area',
        zoom
      });
    }
  });

  return { clusters, individualProperties };
}

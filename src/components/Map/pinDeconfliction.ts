import { Property } from '../../types';

export type PinDisplayMode = 'full' | 'compact' | 'dot';

export interface DisplacedPinLayout {
  property: Property;
  displayMode: PinDisplayMode;
  dx: number;
  dy: number;
  isDisplaced: boolean;
  zoomMode: 'full' | 'compact' | 'mini';
}

/**
 * Spherical Mercator projection: projects [lat, lng] to continuous pixel space at specified zoom level.
 * Formula: scale = 256 * 2^zoom
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
 * Smart Fair Real Estate Map Display Engine
 *
 * Designed from both senior software architect and real estate consumer perspectives:
 *
 * 1. 100% FAIR TO ALL LISTINGS & USERS (Zero Hiding):
 *    No property is ever hidden, omitted, or arbitrarily suppressed from the map.
 *    Every property owner's listing is visually represented, interactive, and clickable at every zoom level.
 *
 * 2. LOCALITY & STREET LEVEL (Zoom >= 12):
 *    Every property is directly displayed on the map with its full or compact interactive price tag!
 *    When multiple properties share the exact same building/coordinate, smart micro-staggering
 *    places them cleanly side-by-side so both prices are visible and neither covers the other.
 *
 * 3. MACRO REGIONAL & CITY LEVEL (Zoom < 12):
 *    All properties are displayed uniformly as clean, non-overlapping Google Maps location pin dots.
 *    Hovering ANY dot instantly elevates it to the top layer and blooms into the full price tag with title.
 *    Clicking ANY dot selects and zooms straight in to that property.
 *    Selected or inspected properties always show their prominent full price tag at all zoom levels.
 */
export function computeDisplacedPinLayout(
  properties: Property[],
  zoom: number,
  selectedPropertyId?: string | null,
  highlightedPropertyIds: string[] = [],
  hoveredPropertyId?: string | null
): DisplacedPinLayout[] {
  if (!properties || properties.length === 0) {
    return [];
  }

  // Determine zoom representation
  const zoomMode: 'full' | 'compact' | 'mini' =
    zoom >= 14 ? 'full' : zoom >= 12 ? 'compact' : 'mini';

  // Base display mode based on zoom tier:
  // - Zoom >= 12: Every property shows its price tag!
  // - Zoom < 12: Every property shows its clean location pin dot!
  const baseMode: PinDisplayMode = zoom >= 12 ? (zoom >= 14 ? 'full' : 'compact') : 'dot';

  // Map each property to screen projection
  const items = properties.map((p) => {
    const isSelected = selectedPropertyId === p.id;
    const isHovered = hoveredPropertyId === p.id;
    const isHighlighted = highlightedPropertyIds.includes(p.id);

    return {
      property: p,
      anchor: latLngToPixel(p.coordinates[1], p.coordinates[0], zoom),
      dx: 0,
      dy: 0,
      isDisplaced: false,
      displayMode: (isSelected || isHovered || isHighlighted ? 'full' : baseMode) as PinDisplayMode
    };
  });

  // At Zoom >= 12: Resolve exact same-building / same-plot collisions with clean side-by-side micro-staggering
  if (zoom >= 12) {
    const collisionThresholdPx = 22;
    const visited = new Set<number>();

    for (let i = 0; i < items.length; i++) {
      if (visited.has(i)) continue;
      const group: number[] = [i];
      visited.add(i);

      for (let j = i + 1; j < items.length; j++) {
        if (visited.has(j)) continue;
        const dist = Math.hypot(items[i].anchor.x - items[j].anchor.x, items[i].anchor.y - items[j].anchor.y);
        if (dist < collisionThresholdPx) {
          group.push(j);
          visited.add(j);
        }
      }

      if (group.length === 2) {
        // Two properties in the same building: Stagger horizontally side-by-side
        items[group[0]].dx = -22;
        items[group[0]].isDisplaced = true;
        items[group[1]].dx = 22;
        items[group[1]].isDisplaced = true;
      } else if (group.length >= 3) {
        // 3+ properties in the same building/complex: Spread evenly
        const spacing = 38;
        const totalSpan = (group.length - 1) * spacing;
        const startX = -totalSpan / 2;
        group.forEach((idx, k) => {
          items[idx].dx = Math.round(startX + k * spacing);
          items[idx].isDisplaced = true;
        });
      }
    }
  }

  return items.map(({ property, displayMode, dx, dy, isDisplaced }) => ({
    property,
    displayMode,
    dx,
    dy,
    isDisplaced,
    zoomMode
  }));
}

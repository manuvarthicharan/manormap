import { Property } from '../../types';

export type PinDisplayMode = 'full' | 'compact' | 'dot' | 'hidden';

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
 * Google Maps POI & Place Tag Strategy (Density Grid & Zoom Level of Detail):
 *
 * 1. Geographic Anchoring:
 *    Every property marker is strictly anchored at its exact real-world coordinate [lng, lat].
 *    Markers NEVER displace or shift away to avoid overlap, preventing spiderwebs of displaced lines.
 *
 * 2. Zoom-Based Level of Detail (LOD) & Density Culling:
 *    - Zoom >= 16 (Street/Parcel view): All properties show their full interactive price tag directly on the parcel/building.
 *    - Zoom 13 - 15.5 (Locality/Neighborhood view): Non-colliding properties show full price tags.
 *      Dense neighbors render as clean Google Maps-style micro-pin dots that expand to full tags on hover.
 *    - Zoom 10 - 12.5 (City view): Coarser density grid. Highest-priority property in each cell shows a compact tag;
 *      others render as subtle micro-pin dots.
 *    - Zoom < 10 (Regional/Country overview): Only selected/highlighted or top featured properties show tags;
 *      others smoothly fade out to keep the map clean and responsive.
 *
 * 3. Priority Hierarchy:
 *    Selected property > Hovered property > Highlighted properties > Verified / Custom added properties > Price.
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

  // Determine base zoom representation
  const zoomMode: 'full' | 'compact' | 'mini' =
    zoom >= 14 ? 'full' : zoom >= 11 ? 'compact' : 'mini';

  // Calculate pixel anchors and priority scores
  const scoredItems = properties.map((p, originalIndex) => {
    const isSelected = selectedPropertyId === p.id;
    const isHovered = hoveredPropertyId === p.id;
    const isHighlighted = highlightedPropertyIds.includes(p.id);
    const isCustom = p.id.startsWith('custom-prop-');

    let priority = 10;
    if (isSelected) priority += 1000000;
    if (isHovered) priority += 500000;
    if (isHighlighted) priority += 200000;
    if (isCustom) priority += 10000;
    if (p.verified) priority += 2000;
    if (p.isFeatured) priority += 1000;
    // Lower index tie-breaker
    priority += (properties.length - originalIndex) * 0.01;

    return {
      property: p,
      anchor: latLngToPixel(p.coordinates[1], p.coordinates[0], zoom),
      priority,
      isSelected,
      isHovered,
      isHighlighted,
      displayMode: 'full' as PinDisplayMode
    };
  });

  // Sort descending by priority so most important properties claim their label box first
  const sorted = [...scoredItems].sort((a, b) => b.priority - a.priority);

  // Collision box dimensions in screen pixels based on zoom level
  const boxW = zoom >= 15 ? 60 : zoom >= 13 ? 68 : zoom >= 11 ? 76 : 84;
  const boxH = zoom >= 15 ? 26 : zoom >= 13 ? 28 : zoom >= 11 ? 32 : 36;

  // Spatial occupancy tracking
  const placedFullBoxes: { x1: number; y1: number; x2: number; y2: number }[] = [];

  sorted.forEach((item) => {
    // Overrides: selected, hovered, or highlighted ALWAYS show full pill
    if (item.isSelected || item.isHovered || item.isHighlighted) {
      item.displayMode = 'full';
      placedFullBoxes.push({
        x1: item.anchor.x - boxW * 0.5,
        y1: item.anchor.y - boxH,
        x2: item.anchor.x + boxW * 0.5,
        y2: item.anchor.y
      });
      return;
    }

    // Zoom < 10: Far zoomed out (State/Country overview) -> fade out secondary markers
    if (zoom < 10) {
      // In very far zoom out, only top 1-2 featured per region show, rest are hidden
      if (placedFullBoxes.length < 3 && item.priority > 1000) {
        item.displayMode = 'compact';
        placedFullBoxes.push({
          x1: item.anchor.x - boxW * 0.5,
          y1: item.anchor.y - boxH,
          x2: item.anchor.x + boxW * 0.5,
          y2: item.anchor.y
        });
      } else {
        item.displayMode = 'hidden';
      }
      return;
    }

    // Zoom >= 16: Close street/parcel view -> show all full labels
    if (zoom >= 16) {
      item.displayMode = 'full';
      return;
    }

    // Zoom 10 - 15.5: Check for collision with already placed full labels
    const currentBox = {
      x1: item.anchor.x - boxW * 0.5,
      y1: item.anchor.y - boxH,
      x2: item.anchor.x + boxW * 0.5,
      y2: item.anchor.y
    };

    let hasCollision = false;
    for (const placed of placedFullBoxes) {
      const overlapX = Math.max(0, Math.min(currentBox.x2, placed.x2) - Math.max(currentBox.x1, placed.x1));
      const overlapY = Math.max(0, Math.min(currentBox.y2, placed.y2) - Math.max(currentBox.y1, placed.y1));
      if (overlapX > 4 && overlapY > 4) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) {
      // Free space: Render full/compact tag
      item.displayMode = zoom >= 13 ? 'full' : 'compact';
      placedFullBoxes.push(currentBox);
    } else {
      // Dense / overlapping area: Render Google Maps-style micro-dot at exact coordinates!
      // When user zooms in closer or hovers, it seamlessly elevates into a full label.
      item.displayMode = zoom < 11.5 ? 'hidden' : 'dot';
    }
  });

  // Map back to result layout matching property order
  const resultMap = new Map<string, PinDisplayMode>();
  sorted.forEach((item) => {
    resultMap.set(item.property.id, item.displayMode);
  });

  return properties.map((p) => {
    const displayMode = resultMap.get(p.id) || 'full';
    return {
      property: p,
      displayMode,
      dx: 0,
      dy: 0,
      isDisplaced: false,
      zoomMode
    };
  });
}

import { Property } from '../../types';

export interface DisplacedPinLayout {
  property: Property;
  dx: number;
  dy: number;
  isDisplaced: boolean;
  zoomMode: 'full' | 'compact' | 'mini';
}

/**
 * Spherical Mercator projection: projects [lat, lng] to continuous pixel space at specified zoom level.
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
 * Intelligent Pin Collision-Avoidance & Staggering Layout Engine
 * 
 * Instead of hiding properties inside cluster number bubbles or allowing them
 * to overlap and obscure each other, this engine keeps EVERY listing directly
 * visible on the map.
 * 
 * If pins collide in screen space when zooming out, it staggers them into clean,
 * collision-free offsets with leader connector lines pointing to their exact
 * coordinates on the ground.
 */
export function computeDisplacedPinLayout(
  properties: Property[],
  zoom: number,
  selectedPropertyId?: string
): DisplacedPinLayout[] {
  if (!properties || properties.length === 0) {
    return [];
  }

  // Adaptive label dimensions based on zoom level
  const zoomMode: 'full' | 'compact' | 'mini' =
    zoom >= 14 ? 'full' : zoom >= 11 ? 'compact' : 'mini';

  const W = zoom >= 14 ? 96 : zoom >= 11 ? 78 : 62;
  const H = zoom >= 14 ? 36 : zoom >= 11 ? 30 : 25;

  const items = properties.map((p) => ({
    property: p,
    anchor: latLngToPixel(p.coordinates[1], p.coordinates[0], zoom),
    dx: 0,
    dy: 0,
    isDisplaced: false,
    zoomMode
  }));

  // Prioritize selected property so it stays prominent
  if (selectedPropertyId) {
    items.sort((a, b) => {
      if (a.property.id === selectedPropertyId) return -1;
      if (b.property.id === selectedPropertyId) return 1;
      return 0;
    });
  }

  // Find collision groups (connected components in 2D screen space)
  const visited = new Set<number>();
  const groups: number[][] = [];

  for (let i = 0; i < items.length; i++) {
    if (visited.has(i)) continue;
    const group: number[] = [i];
    visited.add(i);

    const queue: number[] = [i];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (let j = 0; j < items.length; j++) {
        if (!visited.has(j)) {
          const dx = Math.abs(items[curr].anchor.x - items[j].anchor.x);
          const dy = Math.abs(items[curr].anchor.y - items[j].anchor.y);
          if (dx < W * 0.95 && dy < H * 0.95) {
            visited.add(j);
            group.push(j);
            queue.push(j);
          }
        }
      }
    }
    groups.push(group);
  }

  // Compute collision-free offsets for colliding groups
  groups.forEach((groupIndices) => {
    const N = groupIndices.length;
    if (N === 1) {
      // Single property with plenty of space: stays directly on its coordinate
      return;
    }

    // Centroid of the collision cluster
    let sumX = 0;
    let sumY = 0;
    groupIndices.forEach((idx) => {
      sumX += items[idx].anchor.x;
      sumY += items[idx].anchor.y;
    });
    const cx = sumX / N;
    const cy = sumY / N;

    if (N === 2) {
      // 2 Colliding Items: Stagger diagonally so both labels are completely legible
      const idx0 = groupIndices[0];
      const idx1 = groupIndices[1];
      const shiftX = Math.round(W * 0.52);
      const shiftY = Math.round(H * 0.45);

      items[idx0].dx = Math.round(cx - items[idx0].anchor.x - shiftX);
      items[idx0].dy = Math.round(cy - items[idx0].anchor.y - shiftY);
      items[idx0].isDisplaced = true;

      items[idx1].dx = Math.round(cx - items[idx1].anchor.x + shiftX);
      items[idx1].dy = Math.round(cy - items[idx1].anchor.y + shiftY);
      items[idx1].isDisplaced = true;
    } else if (N === 3) {
      // 3 Colliding Items: Clean triangular stagger (1 top, 2 bottom)
      const topIdx = groupIndices[0];
      const blIdx = groupIndices[1];
      const brIdx = groupIndices[2];

      items[topIdx].dx = Math.round(cx - items[topIdx].anchor.x);
      items[topIdx].dy = Math.round(cy - items[topIdx].anchor.y - H * 1.1);
      items[topIdx].isDisplaced = true;

      items[blIdx].dx = Math.round(cx - items[blIdx].anchor.x - W * 0.52);
      items[blIdx].dy = Math.round(cy - items[blIdx].anchor.y + H * 0.65);
      items[blIdx].isDisplaced = true;

      items[brIdx].dx = Math.round(cx - items[brIdx].anchor.x + W * 0.52);
      items[brIdx].dy = Math.round(cy - items[brIdx].anchor.y + H * 0.65);
      items[brIdx].isDisplaced = true;
    } else if (N === 4) {
      // 4 Colliding Items: 4-quadrant layout
      const offsets = [
        { x: -W * 0.52, y: -H * 0.75 },
        { x: W * 0.52, y: -H * 0.75 },
        { x: -W * 0.52, y: H * 0.75 },
        { x: W * 0.52, y: H * 0.75 }
      ];
      groupIndices.forEach((idx, i) => {
        items[idx].dx = Math.round(cx - items[idx].anchor.x + offsets[i].x);
        items[idx].dy = Math.round(cy - items[idx].anchor.y + offsets[i].y);
        items[idx].isDisplaced = true;
      });
    } else {
      // 5+ Colliding Items: Multi-angle radial / elliptical constellation fan
      const Rx = Math.max(W * 0.75, 46 + (N - 4) * 6);
      const Ry = Math.max(H * 0.95, 34 + (N - 4) * 4);
      groupIndices.forEach((idx, i) => {
        const angle = (2 * Math.PI * i) / N - Math.PI / 2;
        items[idx].dx = Math.round(cx - items[idx].anchor.x + Rx * Math.cos(angle));
        items[idx].dy = Math.round(cy - items[idx].anchor.y + Ry * Math.sin(angle));
        items[idx].isDisplaced = true;
      });
    }
  });

  return items.map(({ property, dx, dy, isDisplaced, zoomMode }) => ({
    property,
    dx,
    dy,
    isDisplaced,
    zoomMode
  }));
}

import { Property } from '../../types';
import { formatIndianCurrency } from '../../services/propertyService';

export interface PropertyCluster {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  properties: Property[];
  minPrice: number;
  maxPrice: number;
  type: 'sale' | 'rent' | 'mixed';
}

export class ClusterOverlayMarker {
  private overlay: google.maps.OverlayView;
  private container: HTMLDivElement | null = null;
  public cluster: PropertyCluster;
  private onClick: (cluster: PropertyCluster) => void;

  constructor(
    cluster: PropertyCluster,
    map: google.maps.Map,
    onClick: (cluster: PropertyCluster) => void
  ) {
    this.cluster = cluster;
    this.onClick = onClick;

    const overlay = new google.maps.OverlayView();

    overlay.onAdd = () => {
      const div = document.createElement('div');
      div.className = 'prop-cluster-marker';
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.zIndex = '120';
      div.style.pointerEvents = 'auto';
      div.style.visibility = 'hidden';

      const count = cluster.properties.length;
      const minP = formatIndianCurrency(cluster.minPrice, cluster.type === 'rent' ? 'rent' : 'sale');
      const maxP = formatIndianCurrency(cluster.maxPrice, cluster.type === 'rent' ? 'rent' : 'sale');
      const priceText = minP === maxP ? minP : `${minP} – ${maxP}`;

      div.innerHTML = `
        <div class="flex items-center gap-1.5 bg-slate-900/95 hover:bg-blue-600 text-white pl-2 pr-2.5 py-1.5 rounded-full shadow-lg border border-white/20 transition-all hover:scale-105 active:scale-95">
          <span class="w-5 h-5 rounded-full bg-blue-500 text-[11px] font-black flex items-center justify-center text-white shadow-inner">${count}</span>
          <span class="text-xs font-bold tracking-tight">${priceText}</span>
        </div>
      `;

      const handleTrigger = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClick(this.cluster);
      };

      div.addEventListener('click', handleTrigger);
      div.addEventListener('touchend', handleTrigger);
      div.addEventListener('mousedown', (e) => e.stopPropagation());
      div.addEventListener('dblclick', (e) => e.stopPropagation());

      this.container = div;

      const panes = overlay.getPanes();
      if (panes && panes.overlayMouseTarget) {
        panes.overlayMouseTarget.appendChild(div);
      }
    };

    overlay.draw = () => {
      if (!this.container) return;
      const projection = overlay.getProjection();
      if (!projection) return;

      const [lng, lat] = this.cluster.coordinates;
      const latLng = new google.maps.LatLng(lat, lng);
      const pixel = projection.fromLatLngToDivPixel(latLng);

      if (pixel) {
        this.container.style.left = `${Math.round(pixel.x)}px`;
        this.container.style.top = `${Math.round(pixel.y)}px`;
        this.container.style.visibility = 'visible';
      }
    };

    overlay.onRemove = () => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }
    };

    overlay.setMap(map);
    this.overlay = overlay;
  }

  public remove() {
    this.overlay.setMap(null);
  }
}


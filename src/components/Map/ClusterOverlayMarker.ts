import { PropertyCluster } from './mapClustering';
import { formatIndianCurrency } from '../../services/propertyService';

export type { PropertyCluster };

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
      div.className = 'prop-cluster-marker group';
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.zIndex = '110';
      div.style.pointerEvents = 'auto';
      div.style.visibility = 'hidden';

      const count = cluster.properties.length;
      const minP = formatIndianCurrency(cluster.minPrice, cluster.type === 'rent' ? 'rent' : 'sale');
      const maxP = formatIndianCurrency(cluster.maxPrice, cluster.type === 'rent' ? 'rent' : 'sale');
      const priceText = minP === maxP ? minP : `${minP} – ${maxP}`;

      const isAgriMajority = cluster.hasAgricultural && cluster.properties.filter(
        (p) => p.category === 'Agricultural Land' || p.category === 'Plot'
      ).length >= Math.ceil(count / 2);

      const isLowZoom = cluster.zoom <= 10;

      // Construct category summary breakdown
      const typeCounts = new Map<string, number>();
      cluster.properties.forEach((p) => {
        const cat = p.category || (p.type === 'rent' ? 'Rental' : 'Property');
        typeCounts.set(cat, (typeCounts.get(cat) || 0) + 1);
      });
      const breakdownText = Array.from(typeCounts.entries())
        .map(([cat, n]) => `${n} ${cat}${n > 1 && !cat.endsWith('s') ? 's' : ''}`)
        .slice(0, 2)
        .join(', ');

      if (isLowZoom) {
        // Ultra-compact circular cluster bubble for national/regional zoomed out view
        div.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-9 h-9 rounded-full bg-white text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.35)] border-2 ${
              isAgriMajority ? 'border-emerald-600 text-emerald-900' : 'border-blue-600 text-blue-900'
            } font-black text-xs flex items-center justify-center transition-transform duration-200 group-hover:scale-110 active:scale-95">
              ${count}
            </div>

            <!-- Light Themed Tooltip on Hover -->
            <div class="cluster-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-white rounded-xl shadow-2xl border border-slate-200 text-left pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span class="text-xs font-black text-slate-900">${count} Properties</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isAgriMajority ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                }">${cluster.areaHint || 'Area'}</span>
              </div>
              <div class="mt-1.5 text-xs font-black text-blue-700">${priceText}</div>
              <div class="mt-0.5 text-[10px] text-slate-600 font-semibold">${breakdownText}</div>
              <div class="mt-1 text-[9px] text-slate-400 font-bold">Click to zoom in</div>
            </div>
          </div>
        `;
      } else {
        // Crisp interactive pill with badge + price range for neighborhood and locality view
        const labelText = isAgriMajority
          ? `🌾 ${count} Lands • ${priceText}`
          : priceText;

        div.innerHTML = `
          <div class="relative flex items-center">
            <div class="flex items-center gap-1.5 bg-white text-slate-900 pl-1.5 pr-3 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.35)] border border-slate-200 group-hover:border-blue-500 group-hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)] transition-all duration-200 group-hover:scale-105 active:scale-95">
              <span class="w-5 h-5 rounded-full ${
                isAgriMajority ? 'bg-emerald-600' : 'bg-blue-600'
              } text-[11px] font-black flex items-center justify-center text-white shadow-inner flex-shrink-0">
                ${count}
              </span>
              <span class="text-xs font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                ${labelText}
              </span>
            </div>

            <!-- Light Themed Tooltip on Hover -->
            <div class="cluster-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-white rounded-xl shadow-2xl border border-slate-200 text-left pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span class="text-xs font-black text-slate-900">${count} Properties in ${cluster.areaHint || 'Area'}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isAgriMajority ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                }">${isAgriMajority ? '🌾 Land Zone' : 'Cluster'}</span>
              </div>
              <div class="mt-1.5 text-xs font-black text-blue-700">${priceText}</div>
              <div class="mt-0.5 text-[10px] text-slate-600 font-semibold">${breakdownText}</div>
              <div class="mt-1 text-[9px] text-slate-400 font-bold">Click to expand cluster</div>
            </div>
          </div>
        `;
      }

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

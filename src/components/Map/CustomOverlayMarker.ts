import { Property } from '../../types';

export class CustomOverlayMarker {
  private overlay: google.maps.OverlayView;
  private container: HTMLDivElement | null = null;
  public property: Property;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private onClick: (property: Property) => void;

  constructor(
    property: Property,
    map: google.maps.Map,
    isSelected: boolean,
    onClick: (property: Property) => void
  ) {
    this.property = property;
    this.isSelected = isSelected;
    this.onClick = onClick;

    const overlay = new google.maps.OverlayView();

    overlay.onAdd = () => {
      const div = document.createElement('div');
      div.className = `prop-marker ${this.isSelected ? 'selected' : ''}`;
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.zIndex = this.isSelected ? '140' : '20';
      div.style.pointerEvents = 'auto';
      div.style.visibility = 'hidden'; // Hidden until first draw computes pixel
      div.setAttribute('data-property-id', this.property.id);

      const pill = document.createElement('div');
      const isAgri = this.property.category === 'Agricultural Land' || this.property.category === 'Plot';
      pill.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''}`;

      // Restrained palette: terracotta for land/active, warm charcoal for sale, muted stone for rent
      const dotColor = isAgri ? '#8b3a24' : (this.property.type === 'sale' ? '#1c1917' : '#78716c');
      const acresDisplay = (isAgri && this.property.landMetrics?.areaAcres)
        ? `<span class="agri-tag font-mono text-[10px] text-[#8b3a24] bg-[#fbf2ed] px-1 py-0.2 rounded-xs mr-1 border border-[#ecd5c8]">${this.property.landMetrics.areaAcres.toFixed(1)} ac</span>`
        : (isAgri ? '<span class="font-mono text-[10px] text-[#8b3a24] mr-1">plot</span>' : `<span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background-color: ${dotColor};"></span>`);

      pill.innerHTML = `
        ${acresDisplay}
        <span class="price-text font-medium text-xs tracking-tight">${this.property.priceDisplay}</span>
      `;

      const tip = document.createElement('div');
      tip.className = 'marker-tip';

      div.appendChild(pill);
      div.appendChild(tip);

      // Click & Touch Handlers with Event Stop
      const handleTrigger = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClick(this.property);
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

      // coordinates are [longitude, latitude] in GeoJSON standard
      const [lng, lat] = this.property.coordinates;
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

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    if (this.container) {
      if (selected) {
        this.container.classList.add('selected');
        this.container.style.zIndex = '150';
      } else {
        this.container.classList.remove('selected');
        this.container.style.zIndex = this.isHovered ? '130' : '20';
      }
    }
  }

  public setHighlighted(highlighted: boolean) {
    if (this.container) {
      if (highlighted) {
        this.container.classList.add('highlighted');
        this.container.style.zIndex = '160';
      } else {
        this.container.classList.remove('highlighted');
        this.container.style.zIndex = this.isSelected ? '150' : this.isHovered ? '130' : '20';
      }
    }
  }

  public setHovered(hovered: boolean) {
    this.isHovered = hovered;
    if (this.container) {
      if (hovered) {
        this.container.classList.add('hovered');
        this.container.style.zIndex = '130';
      } else {
        this.container.classList.remove('hovered');
        this.container.style.zIndex = this.isSelected ? '150' : '20';
      }
    }
  }

  public forceRedraw() {
    if (this.overlay) {
      this.overlay.draw();
    }
  }

  public remove() {
    this.overlay.setMap(null);
  }
}

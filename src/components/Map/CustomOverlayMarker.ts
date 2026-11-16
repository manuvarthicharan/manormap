import { Property } from '../../types';

export class CustomOverlayMarker {
  private overlay: google.maps.OverlayView;
  private container: HTMLDivElement | null = null;
  private anchorDot: HTMLDivElement | null = null;
  private svgLine: SVGSVGElement | null = null;
  private lineElement: SVGLineElement | null = null;
  private pillWrapper: HTMLDivElement | null = null;
  private pill: HTMLDivElement | null = null;
  private tip: HTMLDivElement | null = null;

  public property: Property;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private isHighlighted: boolean = false;
  private onClick: (property: Property) => void;

  private dx: number = 0;
  private dy: number = 0;
  private isDisplaced: boolean = false;
  private zoomMode: 'full' | 'compact' | 'mini' = 'full';

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
      const isAgri =
        this.property.category === 'Agricultural Land' || this.property.category === 'Plot';
      const themeColor = isAgri ? '#059669' : '#2563eb';

      // Outer wrapper placed at exact ground coordinates
      const div = document.createElement('div');
      div.className = 'prop-marker-wrapper';
      div.style.position = 'absolute';
      div.style.pointerEvents = 'none';
      div.style.zIndex = this.isSelected ? '180' : '20';
      div.style.visibility = 'hidden';
      div.setAttribute('data-property-id', this.property.id);

      // 1. Ground Anchor Dot (visible when displaced)
      const dot = document.createElement('div');
      dot.className = 'pin-anchor-dot';
      dot.style.position = 'absolute';
      dot.style.left = '0px';
      dot.style.top = '0px';
      dot.style.transform = 'translate(-50%, -50%)';
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.borderRadius = '9999px';
      dot.style.backgroundColor = themeColor;
      dot.style.border = '2px solid #ffffff';
      dot.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';
      dot.style.display = 'none';
      div.appendChild(dot);
      this.anchorDot = dot;

      // 2. Leader Connector Stem SVG (visible when displaced)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'pin-leader-stem');
      svg.style.position = 'absolute';
      svg.style.overflow = 'visible';
      svg.style.left = '0px';
      svg.style.top = '0px';
      svg.style.pointerEvents = 'none';
      svg.style.display = 'none';

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', '0');
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '2,2');
      line.setAttribute('opacity', '0.85');
      svg.appendChild(line);
      div.appendChild(svg);
      this.svgLine = svg;
      this.lineElement = line;

      // 3. Interactive Price Pill
      const pillWrap = document.createElement('div');
      pillWrap.className = `prop-marker ${this.isSelected ? 'selected' : ''}`;
      pillWrap.style.position = 'absolute';
      pillWrap.style.cursor = 'pointer';
      pillWrap.style.pointerEvents = 'auto';
      pillWrap.style.transform = 'translate(-50%, -100%)';
      pillWrap.style.left = '0px';
      pillWrap.style.top = '0px';
      pillWrap.style.transition = 'transform 0.2s ease, left 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

      const pillEl = document.createElement('div');
      pillEl.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''}`;
      pillWrap.appendChild(pillEl);
      this.pill = pillEl;

      const tipEl = document.createElement('div');
      tipEl.className = 'marker-tip';
      pillWrap.appendChild(tipEl);
      this.tip = tipEl;

      div.appendChild(pillWrap);
      this.pillWrapper = pillWrap;

      // Render initial pill text
      this.renderPillContent();
      this.applyLayout();

      // Click & Touch Handlers
      const handleTrigger = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClick(this.property);
      };

      pillWrap.addEventListener('click', handleTrigger);
      pillWrap.addEventListener('touchend', handleTrigger);
      pillWrap.addEventListener('mousedown', (e) => e.stopPropagation());
      pillWrap.addEventListener('dblclick', (e) => e.stopPropagation());

      // Hover Handlers
      pillWrap.addEventListener('mouseenter', () => this.setHovered(true));
      pillWrap.addEventListener('mouseleave', () => this.setHovered(false));

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

  /**
   * Sets dynamic offset & zoom representation calculated by the de-confliction engine
   */
  public setLayoutOffset(
    dx: number,
    dy: number,
    isDisplaced: boolean,
    zoomMode: 'full' | 'compact' | 'mini'
  ) {
    this.dx = dx;
    this.dy = dy;
    this.isDisplaced = isDisplaced;
    this.zoomMode = zoomMode;
    this.renderPillContent();
    this.applyLayout();
  }

  private renderPillContent() {
    if (!this.pill) return;

    const isAgri =
      this.property.category === 'Agricultural Land' || this.property.category === 'Plot';
    const dotColor = isAgri
      ? '#10b981'
      : this.property.type === 'sale'
      ? '#2563eb'
      : '#059669';

    if (this.zoomMode === 'full') {
      const acresDisplay =
        isAgri && this.property.landMetrics?.areaAcres
          ? `<span class="agri-tag font-extrabold text-[10px] text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md mr-1 border border-emerald-300/60">🌾 ${this.property.landMetrics.areaAcres.toFixed(1)} Ac</span>`
          : isAgri
          ? '<span class="mr-1 text-[11px]">🌾</span>'
          : `<span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${dotColor};"></span>`;

      this.pill.innerHTML = `
        ${acresDisplay}
        <span class="price-text font-bold text-xs tracking-tight">${this.property.priceDisplay}</span>
      `;
      this.pill.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''} px-2.5 py-1`;
    } else if (this.zoomMode === 'compact') {
      const tagDisplay = isAgri
        ? '<span class="mr-1 text-[10px]">🌾</span>'
        : `<span class="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-0.5" style="background-color: ${dotColor};"></span>`;

      this.pill.innerHTML = `
        ${tagDisplay}
        <span class="price-text font-bold text-[11.5px] tracking-tight">${this.property.priceDisplay}</span>
      `;
      this.pill.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''} px-2 py-0.5 text-xs`;
    } else {
      // Mini pill mode for zoomed-out view
      const tagDisplay = isAgri
        ? '<span class="mr-0.5 text-[9px]">🌾</span>'
        : '';

      this.pill.innerHTML = `
        ${tagDisplay}
        <span class="price-text font-extrabold text-[10.5px] tracking-tight">${this.property.priceDisplay}</span>
      `;
      this.pill.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''} px-1.5 py-0.5 text-[11px]`;
    }
  }

  private applyLayout() {
    if (!this.pillWrapper) return;

    this.pillWrapper.classList.toggle('displaced', this.isDisplaced);

    if (this.isDisplaced) {
      if (this.anchorDot) this.anchorDot.style.display = 'block';
      if (this.svgLine) this.svgLine.style.display = 'block';
      if (this.lineElement) {
        this.lineElement.setAttribute('x2', String(this.dx));
        this.lineElement.setAttribute('y2', String(this.dy));
      }
      this.pillWrapper.style.left = `${this.dx}px`;
      this.pillWrapper.style.top = `${this.dy}px`;
      if (this.tip) this.tip.style.display = 'none';
    } else {
      if (this.anchorDot) this.anchorDot.style.display = 'none';
      if (this.svgLine) this.svgLine.style.display = 'none';
      this.pillWrapper.style.left = '0px';
      this.pillWrapper.style.top = '0px';
      if (this.tip) this.tip.style.display = 'block';
    }
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    if (this.container && this.pillWrapper) {
      if (selected) {
        this.pillWrapper.classList.add('selected');
        this.container.style.zIndex = '220';
        if (this.lineElement) {
          this.lineElement.setAttribute('stroke', '#2563eb');
          this.lineElement.setAttribute('stroke-width', '2');
          this.lineElement.removeAttribute('stroke-dasharray');
          this.lineElement.setAttribute('opacity', '1');
        }
      } else {
        this.pillWrapper.classList.remove('selected');
        this.container.style.zIndex = this.isHighlighted ? '190' : this.isHovered ? '200' : '20';
        if (this.lineElement && !this.isHovered) {
          this.lineElement.setAttribute('stroke', '#94a3b8');
          this.lineElement.setAttribute('stroke-width', '1.5');
          this.lineElement.setAttribute('stroke-dasharray', '2,2');
          this.lineElement.setAttribute('opacity', '0.85');
        }
      }
    }
  }

  public setHighlighted(highlighted: boolean) {
    this.isHighlighted = highlighted;
    if (this.container && this.pillWrapper) {
      if (highlighted) {
        this.pillWrapper.classList.add('highlighted');
        this.container.style.zIndex = '210';
      } else {
        this.pillWrapper.classList.remove('highlighted');
        this.container.style.zIndex = this.isSelected ? '220' : this.isHovered ? '200' : '20';
      }
    }
  }

  public setHovered(hovered: boolean) {
    this.isHovered = hovered;
    if (this.container && this.pillWrapper) {
      if (hovered) {
        this.pillWrapper.classList.add('hovered');
        this.container.style.zIndex = '200';
        if (this.lineElement) {
          this.lineElement.setAttribute('stroke', '#2563eb');
          this.lineElement.setAttribute('stroke-width', '2');
          this.lineElement.removeAttribute('stroke-dasharray');
          this.lineElement.setAttribute('opacity', '1');
        }
      } else {
        this.pillWrapper.classList.remove('hovered');
        this.container.style.zIndex = this.isSelected ? '220' : this.isHighlighted ? '210' : '20';
        if (this.lineElement && !this.isSelected) {
          this.lineElement.setAttribute('stroke', '#94a3b8');
          this.lineElement.setAttribute('stroke-width', '1.5');
          this.lineElement.setAttribute('stroke-dasharray', '2,2');
          this.lineElement.setAttribute('opacity', '0.85');
        }
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

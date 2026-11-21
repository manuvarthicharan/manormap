import { Property } from '../../types';
import { PinDisplayMode } from './pinDeconfliction';
import { razorpayService } from '../../services/razorpayService';

export class CustomOverlayMarker {
  private overlay: google.maps.OverlayView;
  private container: HTMLDivElement | null = null;
  private pillWrapper: HTMLDivElement | null = null;
  private pill: HTMLDivElement | null = null;
  private tip: HTMLDivElement | null = null;

  public property: Property;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private isHighlighted: boolean = false;
  private displayMode: PinDisplayMode = 'full';
  private dx: number = 0;
  private dy: number = 0;
  private zoomMode: 'full' | 'compact' | 'mini' = 'full';
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
      // Outer wrapper placed at exact ground coordinates
      const div = document.createElement('div');
      div.className = 'prop-marker-wrapper';
      div.style.position = 'absolute';
      div.style.pointerEvents = 'none';
      div.style.overflow = 'visible';
      div.style.zIndex = this.isSelected ? '220' : '20';
      div.style.visibility = 'hidden';
      div.style.transition = 'opacity 0.25s ease-out, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      div.setAttribute('data-property-id', this.property.id);

      // Interactive Price Pill / Dot Wrapper
      const pillWrap = document.createElement('div');
      pillWrap.className = `prop-marker ${this.isSelected ? 'selected' : ''}`;
      pillWrap.style.position = 'absolute';
      pillWrap.style.cursor = 'pointer';
      pillWrap.style.pointerEvents = 'auto';
      pillWrap.style.left = `${this.dx}px`;
      pillWrap.style.top = `${this.dy}px`;
      pillWrap.style.transform = 'translate(-50%, -100%)';
      pillWrap.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, left 0.2s ease, top 0.2s ease';

      const pillEl = document.createElement('div');
      pillWrap.appendChild(pillEl);
      this.pill = pillEl;

      const tipEl = document.createElement('div');
      tipEl.className = 'marker-tip';
      pillWrap.appendChild(tipEl);
      this.tip = tipEl;

      div.appendChild(pillWrap);
      this.pillWrapper = pillWrap;

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

      // Hover Handlers (Instant expansion of micro-dots into full tags)
      pillWrap.addEventListener('mouseenter', () => this.setHovered(true));
      pillWrap.addEventListener('mouseleave', () => this.setHovered(false));

      this.container = div;

      // Render initial pill text & layout
      this.renderPillContent();

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
   * Sets display mode and micro-stagger offset
   */
  public setLayout(
    displayMode: PinDisplayMode,
    dx: number = 0,
    dy: number = 0,
    zoomMode: 'full' | 'compact' | 'mini' = 'full'
  ) {
    this.displayMode = displayMode;
    this.dx = dx;
    this.dy = dy;
    this.zoomMode = zoomMode;
    this.renderPillContent();
  }

  /**
   * Updates display mode
   */
  public setDisplayMode(mode: PinDisplayMode, zoomMode: 'full' | 'compact' | 'mini' = 'full') {
    this.displayMode = mode;
    this.zoomMode = zoomMode;
    this.renderPillContent();
  }

  /**
   * Backwards-compatible layout offset method
   */
  public setLayoutOffset(
    dx: number,
    dy: number,
    _isDisplaced: boolean,
    zoomMode: 'full' | 'compact' | 'mini' = 'full'
  ) {
    this.dx = dx;
    this.dy = dy;
    this.zoomMode = zoomMode;
    this.renderPillContent();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    if (this.container && this.pillWrapper) {
      if (selected) {
        this.pillWrapper.classList.add('selected');
        this.container.style.zIndex = '220';
      } else {
        this.pillWrapper.classList.remove('selected');
        this.container.style.zIndex = this.isHighlighted ? '190' : this.isHovered ? '200' : '20';
      }
      this.renderPillContent();
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
      this.renderPillContent();
    }
  }

  public setHovered(hovered: boolean) {
    this.isHovered = hovered;
    if (this.container && this.pillWrapper) {
      if (hovered) {
        this.pillWrapper.classList.add('hovered');
        this.container.style.zIndex = '300';
      } else {
        this.pillWrapper.classList.remove('hovered');
        this.container.style.zIndex = this.isSelected ? '220' : this.isHighlighted ? '210' : '20';
      }
      this.renderPillContent();
    }
  }

  private renderPillContent() {
    if (!this.pill || !this.container || !this.pillWrapper) return;

    // Apply micro-offset if staggering
    this.pillWrapper.style.left = `${this.dx}px`;
    this.pillWrapper.style.top = `${this.dy}px`;

    const isSpotlight = razorpayService.isPropertyBoosted(this.property.id);
    const isFeatured = !!(this.property.isFeatured || isSpotlight);

    if (isFeatured) {
      this.pillWrapper.classList.add('featured-pin');
      this.pill.classList.add('spotlight-pulse');
    } else {
      this.pillWrapper.classList.remove('featured-pin');
      this.pill.classList.remove('spotlight-pulse');
    }

    const isAgri =
      this.property.category === 'Agricultural Land' || this.property.category === 'Plot';
    const dotColor = isFeatured
      ? '#f59e0b'
      : isAgri
      ? '#10b981'
      : this.property.type === 'sale'
      ? '#2563eb'
      : '#059669';

    // Must show as full pill if selected, hovered, highlighted, or featured/spotlight boosted
    const forceFull = this.isSelected || this.isHovered || this.isHighlighted;

    // 1. MICRO-DOT STATE (Clean, non-overlapping location dot when zoomed out)
    if (this.displayMode === 'dot' && !forceFull) {
      this.container.style.opacity = '0.95';
      this.container.style.pointerEvents = 'auto';
      this.container.style.transform = 'scale(1)';
      if (isFeatured) {
        this.container.style.zIndex = '150';
      }

      this.pillWrapper.style.transform = 'translate(-50%, -50%)';
      this.pillWrapper.setAttribute('title', `${isFeatured ? '⭐ Featured: ' : ''}${this.property.title} • ${this.property.priceDisplay}`);
      if (this.tip) this.tip.style.display = 'none';

      this.pill.innerHTML = '';
      this.pill.className = 'marker-dot';
      this.pill.style.width = isFeatured ? '13px' : '11px';
      this.pill.style.height = isFeatured ? '13px' : '11px';
      this.pill.style.borderRadius = '9999px';
      this.pill.style.backgroundColor = dotColor;
      this.pill.style.border = isFeatured ? '2.5px solid #ffffff' : '2px solid #ffffff';
      this.pill.style.boxShadow = isFeatured
        ? '0 0 14px rgba(245, 158, 11, 0.95), 0 2px 6px rgba(0,0,0,0.45)'
        : '0 1.5px 5px rgba(0,0,0,0.35)';
      this.pill.style.cursor = 'pointer';
      this.pill.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
      return;
    }

    // 2. FULL / COMPACT PILL STATE (Locality view or hovered/selected)
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    this.container.style.transform = 'scale(1)';

    this.pillWrapper.style.transform = this.isHovered
      ? 'translate(-50%, -108%) scale(1.08)'
      : this.isSelected
      ? 'translate(-50%, -112%) scale(1.12)'
      : 'translate(-50%, -100%)';

    this.pillWrapper.setAttribute('title', `${isFeatured ? '⭐ Featured: ' : ''}${this.property.title} • ${this.property.priceDisplay}`);

    if (this.tip) this.tip.style.display = 'block';

    const isCompact = this.displayMode === 'compact' && !forceFull;

    const spotlightBadge = isFeatured
      ? '<span class="font-black text-[9.5px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded-sm mr-1 border border-amber-500 shadow-2xs">⭐ FEATURED</span>'
      : '';

    if (!isCompact && this.zoomMode === 'full') {
      const acresDisplay =
        isAgri && this.property.landMetrics?.areaAcres
          ? `<span class="agri-tag font-extrabold text-[10px] text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md mr-1 border border-emerald-300/60">🌾 ${this.property.landMetrics.areaAcres.toFixed(1)} Ac</span>`
          : isAgri
          ? '<span class="mr-1 text-[11px]">🌾</span>'
          : `<span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${dotColor};"></span>`;

      this.pill.innerHTML = `
        ${spotlightBadge}
        ${acresDisplay}
        <span class="price-text font-black text-xs tracking-tight text-slate-900">${this.property.priceDisplay}</span>
      `;
      this.pill.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''} px-2.5 py-1`;
    } else {
      // Compact pill mode
      const tagDisplay = isAgri
        ? '<span class="mr-1 text-[10px]">🌾</span>'
        : `<span class="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-0.5" style="background-color: ${dotColor};"></span>`;

      this.pill.innerHTML = `
        ${spotlightBadge}
        ${tagDisplay}
        <span class="price-text font-black text-[11.5px] tracking-tight text-slate-900">${this.property.priceDisplay}</span>
      `;
      this.pill.className = `marker-pill ${this.property.type} ${isAgri ? 'agri-pill' : ''} px-2 py-0.5 text-xs`;
    }

    // Reset explicit dot inline styles
    this.pill.style.width = '';
    this.pill.style.height = '';
    this.pill.style.borderRadius = '';
    this.pill.style.backgroundColor = '';

    if (isFeatured) {
      this.pill.style.border = '2px solid #f59e0b';
      this.pill.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.75), 0 3px 8px rgba(0, 0, 0, 0.2)';
      this.container.style.zIndex = this.isSelected ? '260' : '160';
    } else {
      this.pill.style.border = '';
      this.pill.style.boxShadow = '';
    }
  }

  public forceRedraw() {
    this.renderPillContent();
    if (this.overlay) {
      this.overlay.draw();
    }
  }

  public remove() {
    this.overlay.setMap(null);
  }
}

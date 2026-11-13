// Type definitions for Google Maps JavaScript API
declare namespace google {
  export namespace maps {
    export class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
      setZoom(zoom: number): void;
      getZoom(): number;
      getBounds(): LatLngBounds | undefined;
      fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      setMapTypeId(mapTypeId: MapTypeId | string): void;
      getMapTypeId(): MapTypeId | string;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    export interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      mapTypeId?: MapTypeId | string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
      gestureHandling?: string;
      styles?: MapTypeStyle[];
      backgroundColor?: string;
    }

    export interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers: any[];
    }

    export enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    export class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
    }

    export interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    export class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
      contains(latLng: LatLng | LatLngLiteral): boolean;
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
    }

    export interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    export interface Padding {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }

    export interface MapsEventListener {
      remove(): void;
    }

    export namespace event {
      export function addListener(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      export function addListenerOnce(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      export function removeListener(listener: MapsEventListener): void;
      export function clearListeners(instance: any, eventName: string): void;
      export function trigger(instance: any, eventName: string, ...args: any[]): void;
    }

    export class OverlayView {
      setMap(map: Map | null): void;
      getMap(): Map | null;
      getPanes(): MapPanes;
      getProjection(): MapCanvasProjection;
      onAdd(): void;
      onRemove(): void;
      draw(): void;
    }

    export interface MapPanes {
      floatPane: HTMLElement;
      mapPane: HTMLElement;
      markerLayer: HTMLElement;
      overlayLayer: HTMLElement;
      overlayMouseTarget: HTMLElement;
    }

    export interface MapCanvasProjection {
      fromLatLngToDivPixel(latLng: LatLng | LatLngLiteral): Point;
      fromLatLngToContainerPixel(latLng: LatLng | LatLngLiteral): Point;
      fromDivPixelToLatLng(pixel: Point, noWrap?: boolean): LatLng;
      fromContainerPixelToLatLng(pixel: Point, noWrap?: boolean): LatLng;
      getWorldWidth(): number;
    }

    export class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    export class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng | null;
      setPosition(latLng: LatLng | LatLngLiteral | null): void;
      setTitle(title: string): void;
      setIcon(icon: string | Icon | Symbol): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    export interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      label?: any;
      icon?: string | Icon | Symbol;
      visible?: boolean;
      zIndex?: number;
      clickable?: boolean;
    }

    export enum SymbolPath {
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4,
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2
    }

    export interface Icon {
      url: string;
      size?: any;
      origin?: any;
      anchor?: any;
      scaledSize?: any;
    }

    export interface Symbol {
      path: any;
      fillColor?: string;
      fillOpacity?: number;
      scale?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    export class Circle {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setCenter(center: LatLng | LatLngLiteral): void;
      setRadius(radius: number): void;
      getCenter(): LatLng;
      getRadius(): number;
      setOptions(opts?: any): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    export class Rectangle {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
      getBounds(): LatLngBounds | undefined;
      setOptions(opts?: any): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    export class Polygon {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setPaths(paths: any): void;
      getPaths(): any;
      getPath(): any;
      setOptions(opts?: any): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    export interface PolygonOptions {
      [key: string]: any;
    }

    export interface RectangleOptions {
      [key: string]: any;
    }

    export class Polyline {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setPath(path: any): void;
      getPath(): any;
      setOptions(opts?: any): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    export namespace drawing {
      export class DrawingManager {
        constructor(opts?: any);
        setMap(map: Map | null): void;
        setDrawingMode(mode: any): void;
        getDrawingMode(): any;
        setOptions(opts?: any): void;
      }
      export enum OverlayType {
        MARKER = 'marker',
        POLYGON = 'polygon',
        POLYLINE = 'polyline',
        RECTANGLE = 'rectangle',
        CIRCLE = 'circle'
      }
    }

    export namespace visualization {
      export class HeatmapLayer {
        constructor(opts?: any);
        setMap(map: Map | null): void;
        setData(data: any): void;
      }
    }
  }
}

interface Window {
  google: typeof google;
  initGoogleMaps?: () => void;
  gm_authFailure?: () => void;
}


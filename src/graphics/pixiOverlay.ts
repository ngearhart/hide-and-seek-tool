/**
 * Huge shoutout to @beig for this
 * https://github.com/manubb/Leaflet.PixiOverlay/issues/99#issuecomment-2839224957
 */

import {
  Bounds,
  Browser,
  DomUtil,
  LatLng,
  latLng,
  Layer,
  Map,
  Point,
  type LatLngTuple,
  type LeafletEventHandlerFn,
  type ZoomAnimEvent,
} from 'leaflet';
import {
  autoDetectRenderer,
  Container,
  isWebGLSupported,
  type Renderer,
} from 'pixi.js';

type AfterDrawCallback = (callback: CallbackUtils, event?: unknown) => void;

declare module 'leaflet' {
  interface Map {
    _getNewPixelOrigin(center: LatLng, zoom: number): Point;
  }

  interface Point {
    _round(): Point;
  }
}

export interface CallbackUtils {
  renderer: Renderer;
  map: Map;
  container: Container;
  getScale: () => number;
  layerPointToLatLng: (point: Point) => LatLng;
  latLngToLayerPoint: (latLng: LatLng | LatLngTuple) => Point;
}

interface PixiOverlayOptions {
  padding?: number;
  forceCanvas?: boolean;
  doubleBuffering?: boolean;
  resolution?: number;
  projectionZoom?: (map: Map) => number;
  destroyInteractionManager?: boolean;
  autoPreventDefault?: boolean;
  preserveDrawingBuffer?: boolean;
  clearBeforeRender?: boolean;
  shouldRedrawOnMove?: (event: Event) => boolean;
}

interface RendererOptions {
  resolution: number;
  antialias: boolean;
  forceCanvas: boolean;
  preserveDrawingBuffer: boolean;
  clearBeforeRender: boolean;
  backgroundAlpha: number;
}

export class PixiOverlay extends Layer {
  private readonly doubleBuffering: boolean;
  private readonly pixiContainer: Container;
  private drawCallback: AfterDrawCallback | undefined;
  private rendererOptions: RendererOptions;
  private renderer!: Renderer;
  private auxRenderer!: Renderer;
  private container!: HTMLElement;
  private initialZoom: number = 0;
  private wgsInitialShift: Point = new Point(0, 0);
  private wgsOrigin: LatLng = latLng([0, 0]);
  private zoom: number = 0;
  private center: LatLng = latLng([0, 0]);
  private roundFn = Point.prototype._round;
  declare _map: Map;

  pixiOptions: Required<PixiOverlayOptions> = {
    padding: 0.1,
    forceCanvas: false,
    doubleBuffering: false,
    resolution: Browser.retina ? 2 : 1,
    projectionZoom: (map: Map) => {
      if (map.getMaxZoom() === Infinity) return map.getMinZoom() + 8;
      return (map.getMaxZoom() + map.getMinZoom()) / 2;
    },
    destroyInteractionManager: false,
    autoPreventDefault: true,
    preserveDrawingBuffer: false,
    clearBeforeRender: true,
    shouldRedrawOnMove: () => false,
  };

  constructor(pixiContainer: Container, options?: PixiOverlayOptions) {
    super();
    this.pixiOptions = { ...this.pixiOptions, ...options };
    this.pixiContainer = pixiContainer;

    this.rendererOptions = {
      resolution: this.pixiOptions.resolution,
      antialias: true,
      forceCanvas: this.pixiOptions.forceCanvas,
      preserveDrawingBuffer: this.pixiOptions.preserveDrawingBuffer,
      clearBeforeRender: this.pixiOptions.clearBeforeRender,
      backgroundAlpha: 0,
    };

    this.doubleBuffering =
      isWebGLSupported() &&
      !this.pixiOptions.forceCanvas &&
      this.pixiOptions.doubleBuffering;
  }

  afterDrawCallback(callback: AfterDrawCallback): void {
    this.drawCallback = callback;
  }

  destroy(): void {
    this.onRemove();
  }

  override onAdd(map: Map): this {
    this._map = map;

    this.container = DomUtil.create('div', 'leaflet-pixi-overlay');
    this.container.style.position = 'absolute';

    const rendererPromise = autoDetectRenderer(this.rendererOptions).then(
      (renderer) => {
        // set event system
        this.renderer = renderer;
        this.container.appendChild(
          this.renderer.view.canvas as HTMLCanvasElement,
        );
      },
    );

    if (map.options.zoomAnimation) {
      DomUtil.addClass(this.container, 'leaflet-zoom-animated');
    }

    let auxRendererPromise = Promise.resolve();
    if (this.doubleBuffering) {
      auxRendererPromise = autoDetectRenderer(this.rendererOptions).then(
        (renderer) => {
          // set event system
          this.auxRenderer = renderer;
          this.container.appendChild(
            this.auxRenderer.view.canvas as HTMLCanvasElement,
          );
        },
      );
    }

    Promise.all([rendererPromise, auxRendererPromise]).then(() => {
      map.getPanes().overlayPane.appendChild(this.container);
      this.initialZoom = this.pixiOptions.projectionZoom(map);
      this.wgsInitialShift = map.project(this.wgsOrigin, this.initialZoom);
      this.update();
    });
    return this;
  }

  override onRemove(): this {
    this.renderer.destroy();
    this.auxRenderer?.destroy();
    DomUtil.remove(this.container);
    return this;
  }

  override getEvents(): { [p: string]: LeafletEventHandlerFn } {
    const events: { [p: string]: LeafletEventHandlerFn } = {
      zoom: this.onZoom,
      move: this.onMove,
      moveend: this.update,
    };

    if (this._map.options.zoomAnimation) {
      events['zoomanim'] = this.onAnimZoom as LeafletEventHandlerFn;
      // delete events['zoom'];
    }

    return events;
  }

  private onZoom(): void {
    this.updateTransform(this._map.getCenter(), this._map.getZoom());
  }

  private onAnimZoom(event: ZoomAnimEvent): void {
    this.updateTransform(event.center, event.zoom);
  }

  private onMove(): void {}

  private updateTransform(center: LatLng, zoom: number): void {
    const scale = this._map.getZoomScale(zoom, this.zoom);
    const viewHalf = this._map
      .getSize()
      .multiplyBy(0.5 + this.pixiOptions.padding);
    const currentCenterPoint = this._map.project(this.center, zoom);
    const topLeftOffset = viewHalf
      .multiplyBy(-scale)
      .add(currentCenterPoint)
      .subtract(this._map._getNewPixelOrigin(center, zoom));

    if (Browser.any3d) {
      DomUtil.setTransform(this.container, topLeftOffset, scale);
    } else {
      DomUtil.setPosition(this.container, topLeftOffset);
    }
  }

  private update(): void {
    const padding = this.pixiOptions.padding;
    const mapSize = this._map.getSize();
    const min = this._map
      .containerPointToLayerPoint(mapSize.multiplyBy(-padding))
      .round();
    const bounds = new Bounds(
      min,
      min.add(mapSize.multiplyBy(1 + padding * 2)).round(),
    );
    this.center = this._map.getCenter();
    this.zoom = this._map.getZoom();

    if (this.doubleBuffering) {
      const currentRenderer = this.renderer;
      this.renderer = this.auxRenderer;
      this.auxRenderer = currentRenderer;
    }

    const container = this.container;
    const size = bounds.getSize();

    if (
      this.renderer.screen.x !== size.x ||
      this.renderer.screen.y !== size.y
    ) {
      // if ('gl' in this.renderer) {
      //   this.renderer.resolution = this.pixiOptions.resolution;
      // }
      this.renderer.resize(size.x, size.y);
    }

    this.redraw(bounds.min!);
    DomUtil.setPosition(container, bounds.min!);
  }

  private redraw(offset: Point): void {
    this.disableRounding();
    const scale = this._map.getZoomScale(this.zoom, this.initialZoom);
    const shift = this._map
      .latLngToLayerPoint(this.wgsOrigin)
      .subtract(this.wgsInitialShift.multiplyBy(scale))
      .subtract(offset);
    this.pixiContainer.scale.set(scale);
    this.pixiContainer.position.set(shift.x, shift.y);
    this.triggerUpdate();
    this.enableRounding();
  }

  private disableRounding(): void {
    Point.prototype._round = this.noRound;
  }

  private enableRounding(): void {
    Point.prototype._round = this.roundFn;
  }

  private noRound = function (this: Point): Point {
    return this;
  };

  private triggerUpdate(): void {
    if (this.drawCallback) {
      this.drawCallback({
        renderer: this.renderer!,
        map: this._map,
        container: this.pixiContainer,
        getScale: () =>
          this._map.getZoomScale(this._map.getZoom(), this.initialZoom),
        layerPointToLatLng: (point) => {
          return this._map.unproject(point, this.initialZoom);
        },
        latLngToLayerPoint: (latLng) => {
          return this._map.project(latLng, this.initialZoom);
        },
      });
    }
  }
}

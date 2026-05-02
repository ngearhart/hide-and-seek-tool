import type { GameRecord } from '@/utils';
import L, { Layer } from 'leaflet';
import Radar from './radar';
import type { DrawableElement } from './base';
import Boundary from './boundary';
import { Voronoi } from 'd3';
import VoronoiShape from './voronoi';
import { useStore } from '@/stores/app';
import { generateVolonoi } from '@/regions/regions';
import { AlphaFilter, Container } from 'pixi.js';
import { PixiOverlay, type CallbackUtils } from './pixiOverlay';
import Polygon from './polygon';

class _PixiManager {
    private rootContainer: Container;

    private overlay: PixiOverlay;
    private elements: DrawableElement[];
    private opacity: number;

    private firstDraw: boolean;

    constructor() {
        const store = useStore();
        this.opacity = store.$state.overlayOpacity;

        this.rootContainer = new Container();
        this.rootContainer.filters = [ new AlphaFilter({
            alpha: this.opacity
        }) ];

        this.elements = [];
        this.overlay = new PixiOverlay(this.rootContainer, { padding: 0.5 });
        this.overlay.afterDrawCallback((utils) => this.setup(utils));
        this.firstDraw = true;
    }

    /**
     * Refresh all overlays forcefully even if the map doesn't redraw
     */
    private rebuild() {
        const store = useStore();
        this.opacity = store.$state.overlayOpacity;
        this.overlay.remove();
        this.rootContainer = new Container();
        this.rootContainer.filters = [ new AlphaFilter({
            alpha: this.opacity
        }) ];

        this.elements = [];
        this.overlay = new PixiOverlay(this.rootContainer, { padding: 0.5 });
        this.overlay.afterDrawCallback((utils) => this.setup(utils));
        this.firstDraw = true;
    }

    private setup(utils: CallbackUtils) {
        const zoom = utils.map.getZoom();
        const container = utils.container;
        const renderer = utils.renderer;
        if (this.firstDraw) {
            this.elements.forEach(element => element.createWithMap(utils));
        }

        this.elements.forEach(element => element.draw(utils));
        this.firstDraw = false;
        renderer.render(container);
    }

    getLayer(): Layer {
        return this.overlay;
    }

    update(game: GameRecord, rebuild: boolean=true) {
        if (rebuild) {
            this.rebuild();
        }
        this.rootContainer.removeChildren();
        this.elements = [
            ...Radar.fromGame(game),
            ...Boundary.fromGame(game),
            ...Polygon.fromGame(game),
        ];
        this.elements.forEach(element => element.setupContainer(this.rootContainer));
        this.firstDraw = true;
    }
}

export const PixiManager = new _PixiManager();

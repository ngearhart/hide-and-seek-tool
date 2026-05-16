import type { GameRecord } from '@/utils';
import L, { Layer } from 'leaflet';
import Radar from './radar';
import type { DrawableElement } from './base';
import Boundary from './boundary';
import { useStore } from '@/stores/app';
import { AlphaFilter, Container } from 'pixi.js';
import { PixiOverlay, type CallbackUtils } from './pixiOverlay';
import Polygon from './polygon';
import VoronoiShape from './voronoi';
import HidingCirclesElement from './hidingCircles';

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
        this.overlay = new PixiOverlay(this.rootContainer, { padding: 0.5, resolution: 1 });
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
        this.overlay = new PixiOverlay(this.rootContainer, { padding: 0.5, resolution: 1 });
        this.overlay.afterDrawCallback((utils) => this.setup(utils));
        this.firstDraw = true;
    }

    private setup(utils: CallbackUtils) {
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
        const store = useStore();
        if (rebuild) {
            this.rebuild();
        }
        this.rootContainer.removeChildren();
        // Clean up graphics objects from memory
        this.elements.forEach(element => element.destroy());
        this.elements = [
            ...Radar.fromGame(game),
            ...Boundary.fromGame(game),
            ...Polygon.fromGame(game),
            ...VoronoiShape.fromGame(game),
            ...HidingCirclesElement.fromStore(store.$state)
        ];
        this.elements.forEach(element => element.setupContainer(this.rootContainer));
        this.firstDraw = true;
    }
}

export const PixiManager = new _PixiManager();

import type { GameRecord } from '@/utils';
import L, { Layer } from 'leaflet';
import 'leaflet-pixi-overlay';
import Radar from './radar';
import type { DrawableElement, PixiUtils } from './base';
import Boundary from './boundary';
import { Voronoi } from 'd3';
import VoronoiShape from './voronoi';
import { useStore } from '@/stores/app';
import { generateVolonoi } from '@/regions/regions';
import { AlphaFilter, Container } from 'pixi.js';

class _PixiOverlay {
    private rootContainer: Container;

    private overlay: Layer;
    private elements: DrawableElement[];
    private opacity: number;

    private firstDraw: boolean;

    constructor() {
        const store = useStore();
        this.opacity = store.$state.overlayOpacity;

        this.rootContainer = new Container();
        this.rootContainer.filters = [ new AlphaFilter(this.opacity) ];

        this.elements = [];
        this.overlay = L.pixiOverlay((utils: PixiUtils) => this.setup(utils), this.rootContainer);
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
        this.rootContainer.filters = [ new AlphaFilter(this.opacity) ];

        this.elements = [];
        this.overlay = L.pixiOverlay((utils: PixiUtils) => this.setup(utils), this.rootContainer);
        this.firstDraw = true;
    }

    private setup(utils: PixiUtils) {
        const zoom = utils.getMap().getZoom();
        const container = utils.getContainer();
        const renderer = utils.getRenderer();
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
        const radarElements = Radar.fromGame(game);
        // radarElements.reverse();
        this.elements = [
            ...radarElements,
            ...Boundary.fromGame(game),
        ];
        this.elements.forEach(element => element.setupContainer(this.rootContainer));
        this.firstDraw = true;
    }
}

export const PixiOverlay = new _PixiOverlay();

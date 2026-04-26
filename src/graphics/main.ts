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
import { Container } from 'pixi.js';

class _PixiOverlay {
    private rootContainer: Container;

    private overlay: Layer;
    private elements: DrawableElement[];

    private firstDraw: boolean;
    private prevZoom: number;

    constructor() {
        this.rootContainer = new Container();
        // rootContainer.filters = [ new PIXI.AlphaFilter(0.5) ];

        this.elements = [];
        this.overlay = L.pixiOverlay((utils: PixiUtils) => this.setup(utils), this.rootContainer);
        this.firstDraw = true;
        this.prevZoom = -1;
    }

    /**
     * Refresh all overlays forcefully even if the map doesn't redraw
     */
    private rebuild() {
        this.overlay.remove();
        this.rootContainer = new Container();

        this.elements = [];
        this.overlay = L.pixiOverlay((utils: PixiUtils) => this.setup(utils), this.rootContainer);
        this.firstDraw = true;
        this.prevZoom = -1;
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
        this.prevZoom = zoom;
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
        ];
        this.elements.forEach(element => element.setupContainer(this.rootContainer));
        this.firstDraw = true;
    }
}

export const PixiOverlay = new _PixiOverlay();

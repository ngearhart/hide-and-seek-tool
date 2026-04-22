import type { GameRecord } from '@/utils';
import L from 'leaflet';
import 'leaflet-pixi-overlay';
import * as PIXI from 'pixi.js';
import Radar from './radar';
import type { DrawableElement, PixiUtils } from './base';

const pixiOverlay = ((elements: DrawableElement[]) => {
    const rootContainer = new PIXI.Container();
    rootContainer.filters = [ new PIXI.AlphaFilter(0.5) ];

    let firstDraw = true;
    let prevZoom: any;

    elements.forEach(element => element.setupContainer(rootContainer));

    return L.pixiOverlay((utils: PixiUtils) => {
        const zoom = utils.getMap().getZoom();
        const container = utils.getContainer();
        const renderer = utils.getRenderer();

        if (firstDraw) {
            elements.forEach(element => element.createWithMap(utils));
        }

        if (firstDraw || prevZoom !== zoom) {
            elements.forEach(element => element.draw(utils));
        }

        firstDraw = false;
        prevZoom = zoom;
        renderer.render(container);
    }, rootContainer);
});


export default function addPixiOverlay(map: L.Map, game: GameRecord) {
    pixiOverlay([
        ...Radar.fromGame(game),
    ]).addTo(map);
}

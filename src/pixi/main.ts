import L from 'leaflet';
import 'leaflet-pixi-overlay';
import * as PIXI from 'pixi.js';

type PixiUtils = {
    latLngToLayerPoint: (latLng: L.LatLng, zoom?: number) => L.Point,
    layerPointToLatLng: (point: L.Point, zoom?: number) => L.LatLng,
    getScale: (zoom?: number) => number,
    getRenderer: () => PIXI.Renderer,
    getContainer: () => PIXI.Container,
    getMap: () => any,
}

const BG_RECT_OVERLAY_DISTANCE = 10;


const pixiOverlay = (async () => {
    const markerTexture = await PIXI.Assets.load('marker-icon.png');
    const markerLatLng = [38.88170636729728, -77.06345198030564];
    const circle2LatLng = [38.87799467461421, -77.07643204864102];
    const marker = new PIXI.Sprite(markerTexture);
    marker.anchor.set(0.5, 1);

    const pixiContainer = new PIXI.Container();
    const poison = new PIXI.Container();

    let firstDraw = true;
    let prevZoom: any;

    let projectedCenter: any;
    let projectedCenter2: any;
    let projectedBgCorner: any;
    let projectedBgCorner2: any;
    let circleRadius = 85;
    const circle = new PIXI.Graphics();
    const subtract = new PIXI.Graphics();
    circle.filters = [new PIXI.AlphaFilter(0.5)]
    subtract.blendMode = PIXI.BLEND_MODES.DST_OUT;
    pixiContainer.addChild(marker, circle, subtract);

    poison.filters = [ new PIXI.AlphaFilter(0.0)];
    pixiContainer.addChild(poison);

    return L.pixiOverlay((utils: PixiUtils) => {
        const zoom = utils.getMap().getZoom();
        const container = utils.getContainer();
        const renderer = utils.getRenderer();
        // renderer.background.color = 0x000000;
        // renderer.background.alpha = 0.5;
        const project = utils.latLngToLayerPoint;
        const scale = utils.getScale();

        if (firstDraw) {
            const markerCoords = project(markerLatLng);
            marker.x = markerCoords.x;
            marker.y = markerCoords.y;

            projectedCenter = project(markerLatLng);
            projectedCenter2 = project(circle2LatLng);
            projectedBgCorner = project(new L.LatLng(markerLatLng[0] - BG_RECT_OVERLAY_DISTANCE, markerLatLng[1] + BG_RECT_OVERLAY_DISTANCE));
            projectedBgCorner2 = project(new L.LatLng(markerLatLng[0] + BG_RECT_OVERLAY_DISTANCE, markerLatLng[1] - BG_RECT_OVERLAY_DISTANCE));
            circleRadius = circleRadius / scale;
        }

        if (firstDraw || prevZoom !== zoom) {
            marker.scale.set(1 / scale);

            circle.clear();
            // circle.lineStyle(3 / scale, 0xff0000, 1);projectedCenter
            circle.beginFill(0xff0033, 1);
            // circle.x = projectedCenter.x;
            // circle.y = projectedCenter.y;
            circle.drawCircle(projectedCenter.x, projectedCenter.y, circleRadius);
            circle.drawCircle(projectedCenter2.x, projectedCenter2.y, circleRadius);
            circle.drawRect(projectedBgCorner.x, projectedBgCorner.y, projectedBgCorner2.x - projectedBgCorner.x, projectedBgCorner2.y - projectedBgCorner.y);
            circle.endFill();

            subtract.clear();
            subtract.beginFill(0x000000, 1);
            subtract.drawCircle(projectedCenter.x, projectedCenter.y, circleRadius * 0.5);
            subtract.endFill();
        }

        firstDraw = false;
        prevZoom = zoom;
        renderer.render(container);
    }, pixiContainer);
});


export default function addPixiOverlay(map: L.Map) {
    pixiOverlay().then(pixi => pixi.addTo(map));
}

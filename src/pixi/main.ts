import L from 'leaflet';
import 'leaflet-pixi-overlay';
import * as PIXI from 'pixi.js';

type PixiUtils = {
    latLngToLayerPoint: (latLng: L.LatLng, zoom?: number) => L.Point,
    layerPointToLatLng: (point: L.Point, zoom?: number) => L.LatLng,
    getScale: (zoom?: number) => number,
    
				// layerPointToLatLng: function (point, zoom) {
				// 	zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
				// 	var projectedPoint = L.point(point);
				// 	return map.unproject(projectedPoint, zoom);
				// },
				// getScale: function (zoom) {
				// 	if (zoom === undefined) return map.getZoomScale(map.getZoom(), _layer._initialZoom);
				// 	else return map.getZoomScale(zoom, _layer._initialZoom);
				// },
				// getRenderer: function () {
				// 	return _layer._renderer;
				// },
				// getContainer: function () {
				// 	return _layer._pixiContainer;
				// },
				// getMap: function () {
				// 	return _layer._map;
				// }
}

const doubleBuffering = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const pixiOverlay = (L as any).pixiOverlay((utils: PIXI.util) => {
    if (frame) {
        cancelAnimationFrame(frame);
        frame = null;
    }
    const zoom = utils.getMap().getZoom();
    const container = utils.getContainer();
    const renderer = utils.getRenderer();
    const project = utils.latLngToLayerPoint;
    const scale = utils.getScale();

    if (firstDraw) {
        const getRenderer = utils.getRenderer;
        const boundary = new PIXI.EventBoundary(container);
        utils.getMap().on('click', (e) => {
            // not really nice but much better than before
            // good starting point for improvements
            const interaction = utils.getRenderer().events;
            const pointerEvent = e.originalEvent;
            const pixiPoint = new PIXI.Point();
            // get global click position in pixiPoint:
            interaction.mapPositionToPoint(pixiPoint, pointerEvent.clientX, pointerEvent.clientY);
            // get what is below the click if any:
            const target = boundary.hitTest(pixiPoint.x, pixiPoint.y);
            if (target && target.popup) {
                target.popup.openOn(map);
            }
        });
        const markerCoords = project(markerLatLng);
        marker.x = markerCoords.x;
        marker.y = markerCoords.y;
        marker.anchor.set(0.5, 1);
        marker.scale.set(1 / scale);
        marker.currentScale = 1 / scale;

        projectedPolygon = polygonLatLngs.map((coords) => project(coords));

        projectedCenter = project(circleCenter);
        circleRadius = circleRadius / scale;
    }
    if (firstDraw || prevZoom !== zoom) {
        marker.currentScale = marker.scale.x;
        marker.targetScale = 1 / scale;

        triangle.clear();
        triangle.lineStyle(3 / scale, 0x3388ff, 1);
        triangle.beginFill(0x3388ff, 0.2);
        triangle.x = projectedPolygon[0].x;
        triangle.y = projectedPolygon[0].y;
        projectedPolygon.forEach((coords, index) => {
            if (index == 0) triangle.moveTo(0, 0);
            else triangle.lineTo(coords.x - triangle.x, coords.y - triangle.y);
        });
        triangle.endFill();

        circle.clear();
        circle.lineStyle(3 / scale, 0xff0000, 1);
        circle.beginFill(0xff0033, 0.5);
        circle.x = projectedCenter.x;
        circle.y = projectedCenter.y;
        circle.drawCircle(0, 0, circleRadius);
        circle.endFill();
    }

    const duration = 100;
    let start;
    const animate = (timestamp) => {
        if (start === null) start = timestamp;
        const progress = timestamp - start;
        let lambda = progress / duration;
        if (lambda > 1) lambda = 1;
        lambda = lambda * (0.4 + lambda * (2.2 + lambda * -1.6));
        marker.scale.set(marker.currentScale + lambda * (marker.targetScale - marker.currentScale));
        renderer.render(container);
        if (progress < duration) {
            frame = requestAnimationFrame(animate);
        }
    };

    if (!firstDraw && prevZoom !== zoom) {
        start = null;
        frame = requestAnimationFrame(animate);
    }

    firstDraw = false;
    prevZoom = zoom;
    renderer.render(container);
}, new PIXI.Container(), {
    doubleBuffering: doubleBuffering,
    autoPreventDefault: false
});


export default function addPixiOverlay(map: L.Map) {
    pixiOverlay.addTo(map);
}

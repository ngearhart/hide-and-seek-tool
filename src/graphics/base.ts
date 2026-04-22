import type { Container, Renderer } from "pixi.js";

export abstract class DrawableElement {
    abstract setupContainer(container: Container): undefined;
    abstract createWithMap(utils: PixiUtils): undefined;
    abstract draw(utils: PixiUtils): undefined;
}

export type PixiUtils = {
    latLngToLayerPoint: (latLng: L.LatLng | L.LatLngTuple, zoom?: number) => L.Point,
    layerPointToLatLng: (point: L.Point, zoom?: number) => L.LatLng,
    getScale: (zoom?: number) => number,
    getRenderer: () => Renderer,
    getContainer: () => Container,
    getMap: () => any,
}

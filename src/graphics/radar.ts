import type { Container, Renderer } from "pixi.js";
import { DrawableElement } from "./main";

class Radar extends DrawableElement {

    origin: L.LatLng;
    size: number;
    isHit: boolean;

    constructor(origin: L.LatLng, size: number, isHit: boolean) {
        super();
        this.origin = origin;
        this.size = size;
        this.isHit = isHit;
    }

    setup(container: Container): undefined {
        throw new Error("Method not implemented.");
    }
    create(utils: { latLngToLayerPoint: (latLng: L.LatLng, zoom?: number) => L.Point; layerPointToLatLng: (point: L.Point, zoom?: number) => L.LatLng; getScale: (zoom?: number) => number; getRenderer: () => Renderer; getContainer: () => Container; getMap: () => any; }): undefined {
        throw new Error("Method not implemented.");
    }
    draw(): undefined {
        throw new Error("Method not implemented.");
    }

}
import { Container, Graphics } from "pixi.js";
import { DrawableElement } from "./base";
import { rotatePoint, type GameRecord } from "@/utils";
import { LatLng, type LatLngTuple } from "leaflet";
import type { CallbackUtils } from "./pixiOverlay";

export default class Boundary extends DrawableElement {
    origin: L.LatLng;
    directionDegrees: number;

    private trianglePoints: L.Point[];
    private rectanglePoints: L.Point[];
    private graphics: Graphics;

    constructor(origin: L.LatLng, directionDegrees: number) {
        super();
        this.origin = origin;
        this.directionDegrees = directionDegrees;
        this.graphics = new Graphics();
        this.trianglePoints = [];
        this.rectanglePoints = [];
    }

    setupContainer(container: Container): undefined {
        container.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        // So sorry for this garbage implementation
        if ((this.directionDegrees - 45) % 90 === 0) {
            const a = this.directionDegrees;
            let delta = 0.2;
            let x = this.origin.lat;
            let y = this.origin.lng;
            let midPoint = [x, y];
            let offsetPointEast = [x, y + delta];
            let offsetPointNorth = [x + delta, y];
            let offsetPointWest = [x, y - delta];
            let offsetPointSouth = [x - delta, y];
            this.trianglePoints = [
                rotatePoint(offsetPointEast, midPoint, a),
                rotatePoint(offsetPointNorth, midPoint, a),
                rotatePoint(offsetPointSouth, midPoint, a),
            ].map(corner => utils.latLngToLayerPoint(corner));
        } else if (this.directionDegrees === 0) {
            this.rectanglePoints = [
                [this.origin.lat - 1, this.origin.lng],
                [this.origin.lat + 1, this.origin.lng + 1],
            ].map(corner => utils.latLngToLayerPoint(corner as LatLngTuple));
        } else if (this.directionDegrees === 90) {
            this.rectanglePoints = [
                [this.origin.lat, this.origin.lng - 1],
                [this.origin.lat + 1, this.origin.lng + 1],
            ].map(corner => utils.latLngToLayerPoint(corner as LatLngTuple));
        } else if (this.directionDegrees === 180) {
            this.rectanglePoints = [
                [this.origin.lat - 1, this.origin.lng],
                [this.origin.lat + 1, this.origin.lng - 1],
            ].map(corner => utils.latLngToLayerPoint(corner as LatLngTuple));
        } else if (this.directionDegrees === 270) {
            this.rectanglePoints = [
                [this.origin.lat, this.origin.lng + 1],
                [this.origin.lat - 1, this.origin.lng - 1],
            ].map(corner => utils.latLngToLayerPoint(corner as LatLngTuple));
        }
    }

    // 6.178
    draw(utils: CallbackUtils): undefined {
        if ((this.directionDegrees - 45) % 90 === 0) {
            
        } else {
            this.graphics.rect(
                Math.min(this.rectanglePoints[0].x, this.rectanglePoints[1].x),
                Math.min(this.rectanglePoints[0].y, this.rectanglePoints[1].y),
                Math.abs(this.rectanglePoints[1].x - this.rectanglePoints[0].x), 
                Math.abs(this.rectanglePoints[1].y - this.rectanglePoints[0].y)
            ).fill(0x000000);
        }
    }

    static fromGame(game: GameRecord): Boundary[] {
        return game.boundaryLineEntries?.map(boundaryLineEntry =>
            new Boundary(new LatLng(boundaryLineEntry.lat, boundaryLineEntry.long), boundaryLineEntry.degrees)
        ) ?? [];
    }
}

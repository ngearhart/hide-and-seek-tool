import { Container, Graphics } from "pixi.js";
import { DrawableElement } from "./base";
import { rotatePoint, type GameRecord } from "@/utils";
import { LatLng, Point, type LatLngTuple } from "leaflet";
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
        let t = utils.latLngToLayerPoint(this.origin);
        this.graphics.position.x = t.x;
        this.graphics.position.y = t.y;
        this.graphics.rotation = Math.PI / 180 * this.directionDegrees;
    }

    // 6.178
    draw(utils: CallbackUtils): undefined {
        this.graphics.clear().rect(
            0, -500, 1000, 1000
        ).fill(0x000000);
    }

    static fromGame(game: GameRecord): Boundary[] {
        return game.boundaryLineEntries?.map(boundaryLineEntry =>
            new Boundary(new LatLng(boundaryLineEntry.lat, boundaryLineEntry.long), boundaryLineEntry.degrees)
        ) ?? [];
    }
}

import { AlphaFilter, Container, Graphics, type PointData, type Renderer } from "pixi.js";
import type { GameRecord } from "@/utils";
import { DrawableElement } from "./base";
import { LatLng } from "leaflet";
import type { CallbackUtils } from "./pixiOverlay";

const COLOR = 0x000000;


export default class Polygon extends DrawableElement {

    points: L.LatLng[];

    private graphics: Graphics;
    private convertedPoints: PointData[];

    constructor(points: L.LatLng[]) {
        super();
        this.points = points;
        this.graphics = new Graphics();
        this.convertedPoints = [];
    }

    setupContainer(container: Container): undefined {
        container.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.convertedPoints = this.points
            .map(point => utils.latLngToLayerPoint(point))
            .map(point => ({ x: point.x, y: point.y }));
    }

    draw(utils: CallbackUtils): undefined {
        this.graphics.clear().poly(this.convertedPoints).fill(COLOR);
    }

    static fromGame(game: GameRecord): Polygon[] {
        return game.polygonEntries?.map(polygonEntry => 
            new Polygon(polygonEntry.points)
        ) ?? [];
    }
}

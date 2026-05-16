import { AlphaFilter, Container, Graphics, type Renderer } from "pixi.js";
import type { GameRecord } from "@/utils";
import { DrawableElement } from "./base";
import { LatLng } from "leaflet";
import type { CallbackUtils } from "./pixiOverlay";

const RADAR_COLOR = 0x000000;
const HIT_RADIUS = 10000;

/**
 * Use to convert units / map scale into miles
 * 
 * Found by trial and error using 2 points and measuring their distance, then tuning visually.
 */
const SCALE_TO_MILES_ADJUSTED = 27.05;
const METERS_TO_MILES = 1609.344;

export default class Radar extends DrawableElement {

    origin: L.LatLng;
    sizeMeters: number;
    isHit: boolean;

    private point?: L.Point;
    private radius?: number;

    private graphics: Graphics;

    constructor(origin: L.LatLng, sizeMeters: number, isHit: boolean) {
        super();
        this.origin = origin;
        this.sizeMeters = sizeMeters;
        this.isHit = isHit;
        this.graphics = new Graphics();
    }

    setupContainer(container: Container): undefined {
        container.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.point = utils.latLngToLayerPoint(this.origin);
        this.radius = this.sizeMeters * SCALE_TO_MILES_ADJUSTED / METERS_TO_MILES;
    }

    draw(utils: CallbackUtils): undefined {
        if (!this.isHit) {
            this.graphics.clear()
                .circle(this.point!.x, this.point!.y, this.radius!).fill(RADAR_COLOR);
        } else {
            this.graphics.clear()
                .circle(this.point!.x, this.point!.y, HIT_RADIUS).fill(RADAR_COLOR)
                .circle(this.point!.x, this.point!.y, this.radius!).cut();
        }
    }

    destroy(): undefined {
        this.graphics.destroy();
    }

    static fromGame(game: GameRecord): Radar[] {
        return game.radarEntries?.map(radarEntry => 
            new Radar(new LatLng(radarEntry.lat, radarEntry.long), radarEntry.meters, radarEntry.hit)
        ) ?? [];
    }
}

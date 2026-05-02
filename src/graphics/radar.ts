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

    private constructiveGraphics: Graphics;
    private destructiveGraphics: Graphics;

    private container: Container;

    constructor(origin: L.LatLng, sizeMeters: number, isHit: boolean) {
        super();
        this.origin = origin;
        this.sizeMeters = sizeMeters;
        this.isHit = isHit;
        this.constructiveGraphics = new Graphics();
        this.destructiveGraphics = new Graphics();
        // this.destructiveGraphics.blendMode = BLEND_MODES.XOR;
        // this.destructiveGraphics.blendMode = BLEND_MODES.SRC_OUT;
        this.container = new Container();
        // this.constructiveGraphics.mask = this.destructiveGraphics;
    }

    setupContainer(container: Container): undefined {
        container.addChild(this.container);
        this.container.addChild(this.constructiveGraphics);
        if (this.isHit) {
            this.container.addChild(this.destructiveGraphics);
        }
    }


    createWithMap(utils: CallbackUtils): undefined {
        this.point = utils.latLngToLayerPoint(this.origin); //, utils.getMap().getZoom());
        this.radius = this.sizeMeters * SCALE_TO_MILES_ADJUSTED / METERS_TO_MILES;
    }

    // 6.178
    draw(utils: CallbackUtils): undefined {
        console.log('radar -- ' + this.radius)
        if (!this.isHit) {
            this.constructiveGraphics.clear()
                .circle(this.point!.x, this.point!.y, this.radius!).fill(RADAR_COLOR);
        } else {
            // Draw outer circle
            this.constructiveGraphics.clear()
                .circle(this.point!.x, this.point!.y, HIT_RADIUS).fill(RADAR_COLOR)
                .circle(this.point!.x, this.point!.y, this.radius!).cut();
        }
    }

    static fromGame(game: GameRecord): Radar[] {
        return game.radarEntries?.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).map(radarEntry => 
            new Radar(new LatLng(radarEntry.lat, radarEntry.long), radarEntry.meters, radarEntry.hit)
        ) ?? [];
    }
}

import { AlphaFilter, BLEND_MODES, Container, Graphics, type Renderer } from "pixi.js";
import type { GameRecord } from "@/utils";
import { DrawableElement, type PixiUtils } from "./base";
import { LatLng } from "leaflet";

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

    constructiveGraphics: Graphics;
    destructiveGraphics: Graphics;

    constructor(origin: L.LatLng, sizeMeters: number, isHit: boolean) {
        super();
        this.origin = origin;
        this.sizeMeters = sizeMeters;
        this.isHit = isHit;
        this.constructiveGraphics = new Graphics();
        this.destructiveGraphics = new Graphics();
        this.destructiveGraphics.blendMode = BLEND_MODES.DST_OUT;
    }

    setupContainer(container: Container): undefined {
        container.addChild(this.constructiveGraphics);
        if (this.isHit) {
            container.addChild(this.destructiveGraphics);
        }
    }


    createWithMap(utils: PixiUtils): undefined {
        this.point = utils.latLngToLayerPoint(this.origin); //, utils.getMap().getZoom());
        this.radius = this.sizeMeters * SCALE_TO_MILES_ADJUSTED / METERS_TO_MILES;
    }

    // 6.178
    draw(utils: PixiUtils): undefined {
        if (!this.isHit) {
            this.constructiveGraphics.clear();
            this.constructiveGraphics.beginFill(RADAR_COLOR, 1);
            this.constructiveGraphics.drawCircle(this.point!.x, this.point!.y, this.radius!);
            this.constructiveGraphics.endFill();
        } else {
            // Draw outer circle
            this.constructiveGraphics.clear();
            this.constructiveGraphics.beginFill(RADAR_COLOR, 1);
            this.constructiveGraphics.drawCircle(this.point!.x, this.point!.y, HIT_RADIUS);
            this.constructiveGraphics.endFill();
            this.destructiveGraphics.clear();
            this.destructiveGraphics.beginFill(RADAR_COLOR, 1);
            this.destructiveGraphics.drawCircle(this.point!.x, this.point!.y, this.radius!);
            this.destructiveGraphics.endFill();
        }
    }

    static fromGame(game: GameRecord): Radar[] {
        return game.radarEntries?.map(radarEntry => 
            new Radar(new LatLng(radarEntry.lat, radarEntry.long), radarEntry.meters, radarEntry.hit)
        ) ?? [];
    }
}

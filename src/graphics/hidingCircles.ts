import { AlphaFilter, Container, Graphics, type Renderer } from "pixi.js";
import type { GameRecord } from "@/utils";
import { DrawableElement, type ContainerPool } from "./base";
import { LatLng } from "leaflet";
import type { CallbackUtils } from "./pixiOverlay";
import { flipCoords, type Region } from "@/regions/regions";
import type { State } from "@/stores/app";
import type { Point } from "geojson";

const OUTLINE_COLOR = 0xFF0000;

/**
 * Use to convert units / map scale into miles
 * 
 * Found by trial and error using 2 points and measuring their distance, then tuning visually.
 */
const SCALE_TO_MILES_ADJUSTED = 27.05;
const METERS_TO_MILES = 1609.344;

export default class HidingCirclesElement extends DrawableElement {
    region: Region;

    private radius: number;
    private center?: L.Point;
    private points: L.Point[];
    private graphics: Graphics;

    constructor(region: Region) {
        super();
        this.region = region;
        this.graphics = new Graphics();
        this.points = [];
        this.radius = region.hidingRadiusMiles * SCALE_TO_MILES_ADJUSTED;
    }

    setupContainer(containers: ContainerPool): undefined {
        containers.root.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.center = utils.latLngToLayerPoint(this.region.center);
        this.points = this.region.features.filter(feat => feat.properties.Type === "station")
            .map(feat => flipCoords((feat.geometry as Point).coordinates))
            .map(coords => utils.latLngToLayerPoint(coords));
    }

    draw(utils: CallbackUtils): undefined {
        this.graphics.clear()
        //     .circle(this.center!.x, this.center!.y, HIT_RADIUS).fill(RADAR_COLOR);
        // this.points.forEach(point =>
        //     this.graphics.circle(point.x, point.y, this.radius!).cut());
        this.points.forEach(point =>
            this.graphics.circle(point.x, point.y, this.radius!).stroke({ width: 3 / utils.getScale(), color: OUTLINE_COLOR}));
    }

    destroy(): undefined {
        this.graphics.destroy();
    }

    static fromRegion(state: State, region: Region): HidingCirclesElement[] {
        if (state.enableHidingSpotOverlay) {
            return [new HidingCirclesElement(region)];
        }
        return [];
    }
}

import { Graphics, type Container } from "pixi.js";
import { DrawableElement, type ContainerPool } from "./base";
import type { FeatureType } from "@/regions/features";

import { Delaunay, Voronoi } from 'd3';
import { flipCoords, generateVoronoi, getRegionFeatures, type Region } from "@/regions/regions";
import type { CallbackUtils } from "./pixiOverlay";
import type { GameRecord } from "@/utils";
import { useStore } from "@/stores/app";
import { LatLng, type Point } from "leaflet";
import type { MultiPoint } from "geojson";

const HIT_RADIUS = 10000;

export default class DistrictBoundary extends DrawableElement {

    districtBoundary: L.LatLng[];
    isHit: boolean;

    private graphics: Graphics;
    private points: Point[];

    constructor(isHit: boolean, districtBoundary: L.LatLng[]) {
        super();
        this.graphics = new Graphics();
        this.isHit = isHit;
        this.districtBoundary = districtBoundary;
        this.points = [];
    }

    setupContainer(containers: ContainerPool): undefined {
        containers.excludedArea.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.points = this.districtBoundary.map(point => utils.latLngToLayerPoint(point));
    }

    draw(utils: CallbackUtils): undefined {
        if (this.isHit) {
            this.graphics.clear()
                .circle(this.points[0].x, this.points[0].y, HIT_RADIUS).fill(0x00000)
                .poly(this.points.flat()).cut();
        } else {
            this.graphics.clear().poly(this.points.flat()).fill(0x000000);
        }
    }
    
    destroy(): undefined {
        this.graphics.destroy();
    }
    
    static fromGame(game: GameRecord, region: Region): DistrictBoundary[] {
        return game.districtBoundaries?.map(entry => {
            const polygon = region.features.find(feat => feat.properties.Type === "district" && feat.properties.Name === entry.name);
            if (!polygon) {
                throw 'Game has district boundary entered that cannot be found in region data - ' + entry.name;
            }
            return new DistrictBoundary(entry.wasHit, (polygon.geometry as MultiPoint).coordinates.flatMap(entry => new LatLng(entry[1], entry[0])));
        }) ?? [];
    }
}
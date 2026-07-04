import { Graphics, type Container } from "pixi.js";
import { DrawableElement, type ContainerPool } from "./base";
import type { FeatureType } from "@/regions/features";

import { Delaunay, Voronoi } from 'd3';
import { flipCoords, generateVoronoi, getPolygonsFromDistrict, getRegionFeatures, type Region } from "@/regions/regions";
import type { CallbackUtils } from "./pixiOverlay";
import type { GameRecord } from "@/utils";
import { useStore } from "@/stores/app";
import { LatLng, type Point } from "leaflet";
import type { MultiPoint, MultiPolygon } from "geojson";

const HIT_RADIUS = 10000;

export default class DistrictBoundary extends DrawableElement {

    polygons: L.LatLng[][];
    isHit: boolean;

    private graphics: Graphics;
    private internalPolys: Point[][];

    constructor(isHit: boolean, polygons: L.LatLng[][]) {
        super();
        this.graphics = new Graphics();
        this.isHit = isHit;
        this.polygons = polygons;
        this.internalPolys = [];
    }

    setupContainer(containers: ContainerPool): undefined {
        containers.excludedArea.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.internalPolys = this.polygons.map(poly => poly.map(point => utils.latLngToLayerPoint(point)));
    }

    draw(utils: CallbackUtils): undefined {
        if (this.isHit) {
            this.graphics.clear()
                .circle(this.internalPolys[0][0].x, this.internalPolys[0][0].y, HIT_RADIUS).fill(0x00000);
            this.internalPolys.forEach(poly => {
                this.graphics.poly(poly.flat()).cut();
            });
        } else {
            this.graphics.clear();
                        this.internalPolys.forEach(poly => {
                this.graphics.poly(poly.flat()).fill(0x000000);
            });
        }
    }
    
    destroy(): undefined {
        this.graphics.destroy();
    }
    
    static fromGame(game: GameRecord, region: Region): DistrictBoundary[] {
        return game.districtBoundaries?.map(entry => {
            const district = region.features.find(feat => feat.properties.Type === "district" && feat.properties.Name === entry.name);
            if (!district) {
                throw 'Game has district boundary entered that cannot be found in region data - ' + entry.name;
            }
            return new DistrictBoundary(entry.wasHit, getPolygonsFromDistrict(district.geometry as MultiPolygon));
        }) ?? [];
    }
}
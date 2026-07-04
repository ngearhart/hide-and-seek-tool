import { Graphics, type Container } from "pixi.js";
import { DrawableElement, type ContainerPool } from "./base";
import type { FeatureType } from "@/regions/features";

import { Delaunay, Voronoi } from 'd3';
import { flipCoords, generateVoronoi, getPolygonsFromDistrict, getRegionFeatures, type Region } from "@/regions/regions";
import type { CallbackUtils } from "./pixiOverlay";
import type { GameRecord } from "@/utils";
import { useStore, type State } from "@/stores/app";
import { LatLng, type Point } from "leaflet";
import type { MultiPoint, MultiPolygon } from "geojson";

const HIT_RADIUS = 10000;

export default class DistrictOutline extends DrawableElement {

    polygons: L.LatLng[][];

    private graphics: Graphics;
    private internalPolys: Point[][];

    constructor(polygons: L.LatLng[][]) {
        super();
        this.graphics = new Graphics();
        this.polygons = polygons;
        this.internalPolys = [];
    }

    setupContainer(containers: ContainerPool): undefined {
        containers.root.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.internalPolys = this.polygons.map(poly => poly.map(point => utils.latLngToLayerPoint(point)));
    }

    draw(utils: CallbackUtils): undefined {
        this.graphics.clear();
        this.internalPolys.forEach(poly => {
            this.graphics.poly(poly.flat()).stroke({ width: 3 / utils.getScale(), color: 0x000000 });
        });
    }

    destroy(): undefined {
        this.graphics.destroy();
    }

    static fromRegion(state: State, region: Region): DistrictOutline[] {
        return state.enableDistrictOverlays.map((enabled, level) => {
            if (!enabled) {
                return null;
            }
            const district = region.features.filter(feat => feat.properties.Type === "district" && feat.properties.Level === level);
            if (!district) {
                throw 'Game has district outline entered that cannot be found in region data - level=' + level;
            }
            return district.map(item => new DistrictOutline(getPolygonsFromDistrict(item.geometry as MultiPolygon)));
        }).filter(item => !!item).flat();
    }
}
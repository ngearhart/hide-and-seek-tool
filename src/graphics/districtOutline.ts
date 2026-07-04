import { BitmapText, Graphics, HTMLText, type Container } from "pixi.js";
import { DrawableElement, type ContainerPool } from "./base";
import type { FeatureType } from "@/regions/features";

import { Delaunay, Voronoi } from 'd3';
import { flipCoords, generateVoronoi, getCentroid, getLargestPolygon, getPolygonsFromDistrict, getRegionFeatures, type Region } from "@/regions/regions";
import type { CallbackUtils } from "./pixiOverlay";
import type { GameRecord } from "@/utils";
import { useStore, type State } from "@/stores/app";
import { LatLng, type Point } from "leaflet";
import type { MultiPoint, MultiPolygon } from "geojson";

// Thanks to https://rgblind.com/color-blind-palette
const OUTLINE_COLORS = [
    0x2563EB,
    0x10B981,
    0xF59E0B,
    0xEF4444,
    0x8B5CF6,
    0xC7E304,
    0x8F4DC7,
    0x738339,
    0xDE4AFB,
    0x0FCBCB,
    0xF46FBF,
];

export default class DistrictOutline extends DrawableElement {

    color: number;
    polygons: L.LatLng[][];

    private graphics: Graphics;
    private internalPolys: Point[][];
    private text: BitmapText;
    private avgPoint: L.LatLng;

    constructor(polygons: L.LatLng[][], name: string, color: number) {
        super();
        this.graphics = new Graphics();
        this.polygons = polygons;
        this.internalPolys = [];
        this.text = new BitmapText({
            text: name,
            style: {
                fontFamily: 'roboto',
                fontSize: 1,
                fill: '#000000',
                align: "center",

            },
        });
        this.avgPoint = getCentroid(getLargestPolygon(polygons));
        this.color = color;
    }

    setupContainer(containers: ContainerPool): undefined {
        containers.root.addChild(this.graphics);
        containers.root.addChild(this.text);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.internalPolys = this.polygons.map(poly => poly.map(point => utils.latLngToLayerPoint(point)));
        this.text.position = utils.latLngToLayerPoint(this.avgPoint);
    }

    draw(utils: CallbackUtils): undefined {
        this.graphics.clear();
        this.internalPolys.forEach(poly => {
            this.graphics.poly(poly.flat()).stroke({ width: 3 / utils.getScale(), color: this.color, alignment: 1 });
        });
        this.text.style.fontSize = 15 / utils.getScale();
        this.graphics.rect(
            this.text.x,
            this.text.y,
            this.text.width,
            this.text.height).fill({ color: 0xFFFFFF }).stroke({ width: 2 / utils.getScale(), color: this.color, alignment: 0 });
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
            return district.map((item, index) => new DistrictOutline(getPolygonsFromDistrict(item.geometry as MultiPolygon),
                `Admin District\nLevel ${item.properties.Level}: ${item.properties.Name}`, OUTLINE_COLORS[index % OUTLINE_COLORS.length]));
        }).filter(item => !!item).flat();
    }
}
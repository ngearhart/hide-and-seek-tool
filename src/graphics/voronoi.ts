import { Graphics, type Container } from "pixi.js";
import { DrawableElement } from "./base";
import type { FeatureType } from "@/regions/features";

import { Delaunay, Voronoi } from 'd3';
import { flipCoords, type Region } from "@/regions/regions";
import type { CallbackUtils } from "./pixiOverlay";

export default class VoronoiShape extends DrawableElement {

    voronoi: Voronoi<Delaunay.Point>;
    index: number;
    region: Region

    private graphics: Graphics;
    private vertices: Delaunay.Point[];

    constructor(voronoi: Voronoi<Delaunay.Point>, index: number, region: Region) {
        super();
        this.voronoi = voronoi;
        this.index = index;
        this.graphics = new Graphics();

        this.vertices = region.features.filter(feature => feature.properties.Type === "library").map(feature => flipCoords(feature.geometry.coordinates) as Delaunay.Point);
        this.region = region;
    }

    setupContainer(container: Container): undefined {
        container.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        const points1 = 
                this.vertices.map(point => utils.latLngToLayerPoint(point)).map(point => [point.x, point.y]).flat();
        const points = 
            Float64Array.from(points1
            );
        const delaunay = new Delaunay(points);
        const topCorner = utils.latLngToLayerPoint(flipCoords(this.region.bounds[0]));
        const bottomCorner = utils.latLngToLayerPoint(flipCoords(this.region.bounds[1]));
        this.voronoi = delaunay.voronoi([topCorner.x, topCorner.y, bottomCorner.x, bottomCorner.y]);
    }

    draw(utils: CallbackUtils): undefined {
        this.graphics.clear();
        // this.graphics.beginFill(0xFFFFFF, 1);
        // this.vertices.map(point => utils.latLngToLayerPoint(point)).forEach(point => this.graphics.drawCircle(point.x, point.y, 10));
        // this.graphics.endFill();
        // this.graphics.beginFill(0x000000, 1);
        this.graphics.lineStyle(4 / utils.getScale(), 0x000000, 1);
        // const points = this.voronoi.cellPolygon(this.index);
        // this.graphics.drawPolygon(points.map(point => [point[0], point[1]]).flat());
        Array.from(this.voronoi.cellPolygons()).forEach(polygon => {
            this.graphics.drawPolygon(polygon.map(point => [point[0], point[1]]).flat());
        })
        this.graphics.endFill();
    }
}
import { Graphics, type Container } from "pixi.js";
import { DrawableElement, type ContainerPool } from "./base";
import type { FeatureType } from "@/regions/features";

import { Delaunay, Voronoi } from 'd3';
import { flipCoords, generateVoronoi, getRegionFeatures, type Region } from "@/regions/regions";
import type { CallbackUtils } from "./pixiOverlay";
import type { GameRecord } from "@/utils";
import { useStore } from "@/stores/app";
import type { Point } from "leaflet";

const HIT_RADIUS = 10000;

export default class VoronoiShape extends DrawableElement {

    voronoi: Voronoi<Delaunay.Point>;
    index: number;
    isHit: boolean;

    private graphics: Graphics;
    private points: Point[];

    constructor(voronoi: Voronoi<Delaunay.Point>, index: number, isHit: boolean) {
        super();
        this.voronoi = voronoi;
        this.index = index;
        this.graphics = new Graphics();
        this.isHit = isHit;
        this.points = [];
    }

    setupContainer(containers: ContainerPool): undefined {
        containers.excludedArea.addChild(this.graphics);
    }

    createWithMap(utils: CallbackUtils): undefined {
        this.points = this.voronoi.cellPolygon(this.index).map(point => utils.latLngToLayerPoint(point));
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
    
    static fromGame(game: GameRecord, region: Region): VoronoiShape[] {
        const store = useStore();
        const voronoiGenerator = generateVoronoi(region);
        return game.cellEntries?.map(cell => new VoronoiShape(
            voronoiGenerator[cell.markerType]!,
            getRegionFeatures(region, cell.markerType).findIndex(marker => marker.properties.Name === cell.markerName),
            cell.wasHit
        )) ?? [];
    }
}
import type { Container } from "pixi.js";
import type { CallbackUtils } from "./pixiOverlay";


export type ContainerPool = {
    root: Container,
    excludedArea: Container,
}

export abstract class DrawableElement {
    abstract setupContainer(containers: ContainerPool): undefined;
    abstract createWithMap(utils: CallbackUtils): undefined;
    abstract draw(utils: CallbackUtils): undefined;
    abstract destroy(): undefined;
}

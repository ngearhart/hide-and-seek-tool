import type { Container } from "pixi.js";
import type { CallbackUtils } from "./pixiOverlay";

export abstract class DrawableElement {
    abstract setupContainer(container: Container): undefined;
    abstract createWithMap(utils: CallbackUtils): undefined;
    abstract draw(utils: CallbackUtils): undefined;
    abstract destroy(): undefined;
}

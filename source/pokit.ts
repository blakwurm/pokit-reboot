import { Jewls } from "./jewls.js";
import { ECS } from "./ecs.js";
import { ModLoader } from "./modloader.js";
import { CartManifest } from "./cartloader.js";

interface Time {
  prev: number;
  delta: number;
  pending: number;
  interval: number;
}
export interface IRenderedObject {
  x?: number,
  y?: number,
  z?: number,
  height?: number,
  width?: number,
  depth?: number,
  scaleX?: number,
  scaleY?: number,
  [any: string]: any
}
export interface CullingFunction{
  (entities: IRenderedObject[], cam: IRenderedObject):Set<IRenderedObject>|IRenderedObject[]
}
export interface Renderer {
  render(cullFunc?: CullingFunction): void;
}
export interface StartOpts {
  fps?: number;
  renderer?: Renderer;
  cullFunc?: CullingFunction;
}
export interface Vector {
  x: number,
  y: number
}
export interface Identity {
  id: string;
  parent?: Identity;
  position: Vector;
  scale: Vector;
  rotation: number;
}
export interface IJsonSerializableObject {
	[index: string] : IJsonTypes,
	[index: number] : IJsonTypes
}

export type IJsonPrimitives = string | number | boolean | null
export type IJsonTypes = IJsonPrimitives | Array<IJsonPrimitives> | IJsonSerializableObject


export class PokitOS {
  cart?: CartManifest;
  cartPath?: string;
  time?: Time;
  fps: number;
  ecs: ECS;
  renderer: Renderer;
  modules: ModLoader;
  cullFunc?: CullingFunction;

  constructor(opts?: StartOpts) {
    opts = opts || {};
    this.fps = opts.fps || 30;
    this.ecs = new ECS();
    this.renderer = opts.renderer || new Jewls();
    this.modules = new ModLoader();
    this.cullFunc = opts.cullFunc;
  }

  async start() {
    this.time = await this.getTime();
    await this.modules.callEvent("awake");
    this.requestFrame();
    await this.tick();
  }

  async makeTime(): Promise<Time> {
    return {
      prev: performance.now(),
      delta: 0,
      pending: 0,
      interval: 1000/this.fps
    };
  }

  async getTime() {
    let t = this.time || await this.makeTime();
    t.delta = performance.now() - t.prev;
    t.pending += t.delta;
    t.prev = performance.now();
    return t;
  }

  async requestFrame() {
    requestAnimationFrame(async ()=>{
      await this.modules.callEvent("preRender");
      this.renderer.render(this.cullFunc);
      await this.modules.callEvent("postRender");
      this.requestFrame();
    });
  }

  async tick() {
    this.time = await this.getTime();
    while(this.time.pending >= this.time.interval) {
      await this.modules.callEvent("preUpdate");
      await this.ecs.callEvent("update");
      this.time.pending -= this.time.interval;
      await this.modules.callEvent("postUpdate");
    }
    setTimeout(()=>this.tick(), 0);
  }
}
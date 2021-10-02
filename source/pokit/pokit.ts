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
export interface StartOpts {
  tps?: number;
  canvas?: HTMLCanvasElement;
}
export interface Vector {
  x: number,
  y: number
}
export interface Identity {
  id: string;
  parent?: Identity | string;
  persistent?: boolean;
  bounds: Vector;
  position: Vector;
  z: number;
  depth: number;
  scale: Vector;
  rotation: number;
  globalPosition: Vector;
  globalScale: Vector;
  globalRotation: number;
}
export interface IdentityProps {
  id?: string;
  parent?: Identity | string;
  persistent?: boolean;
  bounds?: Vector;
  position?: Vector;
  z?: number;
  depth?: number;
  scale?: Vector;
  rotation?: number;
  globalPosition?: Vector;
  globalScale?: Vector;
  globalRotation?: number;
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
  tps: number;
  ecs: ECS;
  modules: ModLoader;
  canvas: HTMLCanvasElement;
  dirty: boolean;

  constructor(opts?: StartOpts) {
    opts = opts || {};
    this.tps = opts.tps || 30;
    this.ecs = new ECS();
    this.modules = new ModLoader();
    this.canvas = opts?.canvas || document.getElementById("gamescreen") as HTMLCanvasElement;
    this.dirty = false;
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
      interval: 1000/this.tps
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
      if(this.dirty) {
        await this.modules.callEvent("preRender");
        await this.modules.callEvent("render");
        await this.modules.callEvent("postRender");
        this.dirty = false;
      }
      this.requestFrame();
    });
  }

  async tick() {
    this.time = await this.getTime();
    while(this.time.pending >= this.time.interval) {
      await this.modules.callEvent("input");
      await this.modules.callEvent("preUpdate");
      await this.ecs.callEvent("update");
      this.time.pending -= this.time.interval;
      await this.modules.callEvent("postUpdate");
    }
    this.dirty = true;
    setTimeout(()=>this.tick(), 0);
  }
}
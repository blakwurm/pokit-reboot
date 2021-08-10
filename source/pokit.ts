import { Jewls } from "./jewls";

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
}

export class PokitOS {
  
  time?: Time;
  fps: number;
  ecs: ECS;
  renderer: Renderer;

  constructor(opts?: StartOpts) {
    opts = opts || {};
    this.fps = opts.fps || 60;
    this.ecs = new ECS();
    this.renderer = opts.renderer || new Jewls();
  }

  async start() {
    this.time = await this.getTime();
    this.requestFrame();
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
    return t;
  }

  async requestFrame() {
    let that = this;
    requestAnimationFrame(()=> this.tick(that));
  }

  async tick(engine: PokitOS) {
    engine.time = await this.getTime();
    while(engine.time!.pending >= engine.time!.interval) {
      engine.ecs.update();
      engine.time!.pending -= engine.time!.interval;
    }
    engine.renderer.render();
  }
}
import { Identity, Vector } from "./pokit.js";
import { Scene } from "./scene.js";
import { deepMerge, deepMergeNoConcat, uuid } from "./utils.js";

const VectorZero = {
  x: 0,
  y: 0
}

const VectorOne = {
  x: 1,
  y: 1
}

const defaultParent = {
  id: "",
  bounds: {x: 32, y: 32},
  position: VectorZero,
  scale: VectorOne,
  rotation: 0
}

export class Entity extends Map<string, any> implements Identity {
  private scene: Scene;

  id: string;
  parent?: Identity | undefined;
  bounds: Vector;
  position: Vector;
  scale: Vector;
  rotation: number;

  constructor(ident: Identity, scene: Scene) {
    super();

    this.scene = scene;
    this.id = uuid();
    this.parent  = defaultParent;
    this.bounds = {x: 32, y: 32};
    this.position = VectorZero;
    this.scale = VectorOne;
    this.rotation = 0;

    let i = deepMerge(this, ident);
    Object.assign(this, i);

    super.set("identity", this);
  }

  public set(component: string, opts: any) {
    let data = deepMergeNoConcat({}, this.scene.ecs.components.get(component), opts);

    super.set(component, data);
    this.scene.subscribeEntity(component, this);
    
    return this;
  }

  public delete(component: string) {
    return super.delete(component);
  }
}
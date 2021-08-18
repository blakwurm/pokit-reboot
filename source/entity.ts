import { Identity, Vector } from "./pokit.js";
import { Scene } from "./scene.js";
import { deepMerge, deepMergeNoConcat } from "./utils.js";

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
  position: VectorZero,
  scale: VectorOne,
  rotation: 0
}

function genId(){
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}

export class Entity extends Map<string, any> implements Identity {
  private scene: Scene;

  id: string;
  parent?: Identity | undefined;
  position: Vector;
  scale: Vector;
  rotation: number;

  constructor(ident: Identity, scene: Scene) {
    super();

    this.scene = scene;
    this.id = genId();
    this.parent  = defaultParent;
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
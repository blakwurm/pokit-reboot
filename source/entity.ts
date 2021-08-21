import { Identity, Vector } from "./pokit.js";
import { Scene } from "./scene.js";
import { deepMerge, deepMergeNoConcat, rotateVector, uuid, vectorDivide, vectorEqual, vectorMultiply, VectorOne, VectorZero } from "./utils.js";

const defaultParent = {
  id: "",
  bounds: {x: 32, y: 32},
  position: VectorZero(),
  scale: VectorOne(),
  rotation: 0,
  globalPosition: VectorZero(),
  globalScale: VectorOne(),
  globalRotation: 0
}

export class Entity extends Map<string, any> implements Identity {
  private scene: Scene;

  id: string;
  parent?: Identity | string;
  bounds: Vector;
  position: Vector;
  scale: Vector;
  rotation: number;
  parentRot: number;
  parentPos: Vector;
  parentScale: Vector;
  cachedPos?: Vector;

  constructor(ident: Identity, scene: Scene) {
    super();

    this.scene = scene;
    this.id = uuid();
    this.parent = defaultParent;
    this.bounds = {x: 32, y: 32};
    this.position = VectorZero();
    this.scale = VectorOne();
    this.rotation = 0;
    this.parentRot = 0;
    this.parentPos = VectorZero();
    this.parentScale = VectorOne();

    let i = deepMerge(this, ident);
    Object.assign(this, i);

    super.set("identity", this);
  }

  public get globalPosition() {
    let parent = this.parent as Identity;

    if(  vectorEqual(parent.globalPosition, this.parentPos)
      && vectorEqual(parent.globalScale, this.parentScale)
      && parent.globalRotation == this.parentRot
      && this.cachedPos ) return this.cachedPos;
      
    let scaledPos = vectorMultiply(this.position, parent.globalScale);

    this.cachedPos = rotateVector(scaledPos, parent.globalRotation);
    this.parentRot = parent.globalRotation;
    Object.assign(this.parentPos, parent.globalPosition);
    Object.assign(this.parentScale, parent.globalScale);
    
    return this.cachedPos;
  }

  public set globalPosition(pos: Vector) {
    let parent = this.parent as Identity;
    this.cachedPos = pos;
    this.position = rotateVector(pos, -parent.globalRotation);
    this.position = vectorDivide(this.position, parent.globalScale);
    this.parentRot = parent.globalRotation;
    Object.assign(this.parentPos, parent.globalPosition);
    Object.assign(this.parentScale, parent.globalScale);
  }

  public get globalScale() {
    return vectorMultiply(this.scale, (<Identity>this.parent).globalScale)
  }

  public set globalScale(scale: Vector) {
    this.scale = vectorDivide(scale, (<Identity>this.parent).globalScale);
  }

  public get globalRotation() {
    return this.rotation + (<Identity>this.parent).globalRotation;
  }

  public set globalRotation(rot: number) {
    this.rotation = rot - (<Identity>this.parent).globalRotation;
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
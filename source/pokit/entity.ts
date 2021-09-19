import { Identity, IdentityProps, Vector } from "./pokit.js";
import { Scene } from "./scene.js";
import { deepMerge, deepMergeNoConcat, rotateVector, uuid, vectorAdd, vectorDivide, vectorEqual, vectorMultiply, VectorOne, vectorSub, VectorZero } from "./utils.js";

export class Entity extends Map<string, any> implements Identity {
  private scene: Scene;

  id: string;
  parent?: Identity | string;
  bounds: Vector;
  position: Vector;
  z:number;
  depth:number;
  scale: Vector;
  rotation: number;
  parentRot: number;
  parentPos: Vector;
  parentScale: Vector;
  lastPos: Vector;

  cachedPos?: Vector;

  constructor(ident: IdentityProps, scene: Scene) {
    super();

    this.scene = scene;
    this.id = uuid();
    this.parent = scene;
    this.bounds = {x: 32, y: 32};
    this.position = VectorZero();
    this.z = 0;
    this.depth = 1;
    this.scale = VectorOne();
    this.rotation = 0;
    this.parentRot = 0;
    this.parentPos = VectorZero();
    this.parentScale = VectorOne();
    this.lastPos = VectorZero();

    let i = deepMerge(this, ident);
    Object.assign(this, i);

    super.set("identity", this);
  }

  public get globalPosition() {
    let parent = this.parent as Identity;

    if(  vectorEqual(parent.globalPosition, this.parentPos)
      && vectorEqual(parent.globalScale, this.parentScale)
      && vectorEqual(this.lastPos, this.position)
      && parent.globalRotation == this.parentRot
      && this.cachedPos ) return this.cachedPos;
      
    let scaledPos = vectorMultiply(this.position, parent.globalScale);

    this.cachedPos = vectorAdd(rotateVector(scaledPos, parent.globalRotation), parent.globalPosition);
    this.parentRot = parent.globalRotation;
    Object.assign(this.parentPos, parent.globalPosition);
    Object.assign(this.parentScale, parent.globalScale);
    Object.assign(this.lastPos, this.position);
    
    return this.cachedPos;
  }

  public set globalPosition(pos: Vector) {
    let parent = this.parent as Identity;
    this.cachedPos = pos;

    this.position = vectorSub(pos, parent.globalPosition);
    this.position = rotateVector(this.position, -parent.globalRotation);
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
    let data = deepMergeNoConcat(this.scene.ecs.components.get(component), opts);

    super.set(component, data);
    this.scene.subscribeEntity(component, this);
    
    return this;
  }

  public delete(component: string) {
    return super.delete(component);
  }

  public destroy() {
    for(let [key,] of this) {
      this.scene.unsubcribeEntity(key, this);
    }
    this.scene.callEventSingle("destroy", this);
    this.scene.entities.delete(this.id);
  }

  public async callEvent(evt: string, ...args: any[]) {
    await this.scene.callEventSingleEntity(evt, this, undefined, ...args)
  }
}
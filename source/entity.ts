import { Identity, Vector } from "./pokit";

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
  rotation: VectorZero
}

export class Entity implements Identity{
  id: string;
  parent: Identity;
  position: Vector;
  scale: Vector;
  rotation: Vector;

  constructor(ident: Identity) {
    this.id = this.genId();
    this.parent = defaultParent;
    this.position = VectorZero;
    this.scale = VectorOne;
    this.rotation = VectorZero;

    Object.assign(this, ident);
  }

  genId() {
    return "";
  }
}
import { Identity, Vector } from "./pokit";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ICollider {
  min: Vector3;
  max: Vector3;
}

export const defaultParent = {
  id: "",
  bounds: {x: 32, y: 32},
  position: VectorZero(),
  z:0,
  depth:1,
  scale: VectorOne(),
  rotation: 0,
  globalPosition: VectorZero(),
  globalScale: VectorOne(),
  globalRotation: 0
}

export function deepMerge(o: any, ...arr: any[]) {
  let ret = Object.assign({}, o);
  for (let obj of arr) {
    for (let [k, v] of Object.entries(obj)) {
      if (typeof ret[k] !== typeof v || typeof v !== "object")
        ret[k] = v;
      else if (Array.isArray(v))
        ret[k] = (<Array<any>>ret[k]).concat(v);
      else
        ret[k] = deepMergeNoConcat(ret[k], v!);
    }
  }
  return ret;
}

export function deepMergeNoConcat(o: any, ...arr: any[]) {
  let ret = Object.assign({}, o);
  for (let obj of arr) {
    for (let [k, v] of Object.entries(obj)) {
      if (typeof ret[k] !== typeof v || typeof v !== "object" || Array.isArray(v))
        ret[k] = v;
      else
        ret[k] = deepMergeNoConcat(ret[k], v!);
    }
  }
  return ret;
}

export function deepClone(o: any): any {
  if(Array.isArray(o)) {
    let r = [];
    for(let v of o) {
      if(typeof v === "object") r.push(deepClone(v));
      else r.push(v);
    }
    return r;
  }
  let r = {} as any;
  for(let [k,v] of Object.entries(o)) {
    if(typeof v === "object") r[k] = deepClone(v);
    else r[k] = v;
  }
  return r;
}

export function uuid() {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

export function rotateVector(vec: Vector, theta: number): Vector {
  let t = deg2rad(theta);
  let x = Math.cos(t) * vec.x - Math.sin(t) * vec.y;
  let y = Math.sin(t) * vec.x + Math.cos(t) * vec.y;
  return {
    x: x,
    y: y
  }
}

export function vectorEqual(vec1: Vector, vec2: Vector) {
  return vec1.x === vec2.x && vec1.y === vec2.y;
}

export function vectorMultiply(vec1: Vector, vec2: Vector): Vector {
  return {
    x: vec1.x * vec2.x,
    y: vec1.y * vec2.y
  }
}

export function vectorDivide(vec1: Vector, vec2: Vector): Vector {
  return {
    x: vec1.x / vec2.x,
    y: vec1.y / vec2.y
  }
}

export function vectorAdd(vec1: Vector, vec2: Vector): Vector {
  return {
    x: vec1.x + vec2.x,
    y: vec1.y + vec2.y
  }
}

export function vectorSub(vec1: Vector, vec2: Vector): Vector {
  return {
    x: vec1.x - vec2.x,
    y: vec1.y - vec2.y
  }
}

export function vectorSign(vec: Vector): Vector {
  return {
    x: Math.sign(vec.x),
    y: Math.sign(vec.y)
  }
}

export function vectorAbs(vec: Vector): Vector {
  return {
    x: Math.abs(vec.x),
    y: Math.abs(vec.y)
  }
}

export function bringToZero(num: number, step: number) {
  let sign = Math.sign(num);
  let r = num - (sign * step);
  return Math.sign(r) === sign? r : 0;
}

export function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(num, max));
}

export function vectorClamp(vec: Vector, min: Vector, max: Vector): Vector {
  return {
    x: clamp(vec.x, min.x, max.x),
    y: clamp(vec.y, min.y, max.y)
  }
}

export function vectorDist(vec1: Vector, vec2: Vector) {
  return Math.sqrt(
    Math.pow(vec1.x-vec2.x, 2) +
    Math.pow(vec1.y-vec2.y, 2)
    )
}

export function VectorOne(): Vector {
  return {
    x: 1,
    y: 1
  }
}

export function VectorNeg(): Vector {
  return {
    x: -1,
    y: -1
  }
}

export function VectorZero(): Vector {
  return {
    x: 0,
    y: 0
  }
}

export function VectorNorth() {
  return {
    x:0,
    y:-1
  }
}

export function VectorEast() {
  return {
    x:1,
    y:0
  }
}

export function VectorSouth() {
  return {
    x:0,
    y:1
  }
}

export function VectorWest() {
  return {
    x:-1,
    y:0
  }
}

export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function rad2deg(rad: number) {
  return rad * (180 / Math.PI);
}

interface TileSource {
  hflip: boolean;
  vflip: boolean;
  ninety: boolean;
  oneEighty: boolean;
  index: number;
}

let hflip = 1 << 31;
let vflip = 1 << 30;
let ninety = 1 << 29;
let oneEighty = 1 << 28;

export function expandTileNum(i: number): TileSource {
  return {
    hflip: (i & hflip) == hflip,
    vflip: (i & vflip) == vflip,
    ninety: (i & ninety) == ninety,
    oneEighty: (i & oneEighty) == oneEighty,
    index: i<<4>>4
  }
}

export function collapseTileSource(source: TileSource) {
  let i = source.index;
  i = source.hflip ? i | hflip : i;
  i = source.vflip ? i | vflip : i;
  i = source.ninety ? i | ninety : i;
  i = source.oneEighty ? i | oneEighty : i;
  
  return i;
}

export function expandGpIndex(i: number) {
  return [i>>28, i<<4>>4];
}

export function collapseGpIndex(gp: number, index: number) {
  return gp << 28 | index;
}

export default class SpatialHashMap {
  map: Map<string, Identity[]>;
  entities: Map<string,string[]>;
  cellsize: number;

  constructor(cellsize: number) {
    this.map = new Map();
    this.entities = new Map();
    this.cellsize = cellsize;
  }

  add(identity: Identity): SpatialHashMap {
    let spatialKeys = this.makeSpatialKey(identity);
    for (let key of spatialKeys) {
      let bucket = this.map.get(key) || [];
      bucket.push(identity);
      this.map.set(key, bucket);
    }
    this.entities.set(identity.id, spatialKeys);
    return this;
  }

  addMany(identities: Identity[]): SpatialHashMap {
    const callback = this.add.bind(this);
    identities.forEach(callback);
    return this;
  }

  findNearby(identity: Identity): Set<Identity> {
    const identities = new Set<Identity>();
    const keys = this.makeSpatialKey(identity);

    for (let key of keys) {
      const v = this.map.get(key);
      if (v) {
        v.forEach(x => identities.add(x));
      }
    }
    return identities;
  }

  clear() {
    this.map.clear();
    this.entities.clear();
  }

  delete(identity: Identity){
    for(let key of this.entities.get(identity.id)!) {
      let arr = this.map.get(key);
      let i = arr!.indexOf(identity);
      arr?.splice(i, 1);
    }
  }

  findColliding(identity: Identity): Identity[] {
		return [...this.findNearby(identity)].filter(e=>e != identity && this.isColliding(this.getCollider(e),this.getCollider(identity)));
	}
	getCollider(identity: Identity):ICollider{
    let bounds = vectorMultiply(identity.bounds, identity.globalScale)
    let pos = identity.globalPosition;
    return {
			min:{
				x:pos.x - (bounds.x/2),
				y:pos.y - (bounds.y/2),
				z:identity.z
			},
			max:{
				x:pos.x + (bounds.x/2),
				y:pos.y + (bounds.y/2),
				z:identity.z + identity.depth
			}
		}
	}
	isColliding(a: ICollider, b: ICollider){
		return !(
				a.max.x <= b.min.x ||
				a.min.x >= b.max.x ||
				a.max.y <= b.min.y ||
				a.min.y >= b.max.y ||
				a.max.z <= b.min.z ||
				a.min.z >= b.max.z );
	}

  // findColliding(identity: Identity): Identity[] {
  //   const set = this.findNearby(identity);
  //   const arr = [...set];

  //   let identityPosition = identity.globalPosition;
  //   let identityBounds = vectorMultiply(identity.bounds, identity.globalScale);

  //   const filter = (i: Identity) => {
  //     let position = i.globalPosition;
  //     let bounds = vectorMultiply(i.bounds, i.globalScale);

  //     return identityPosition.x < position.x + bounds.x &&
  //       identityPosition.x + identityBounds.x > position.x &&
  //       identity.z < i.z + i.depth &&
  //       identity.z + identity.depth > i.z &&
  //       identityPosition.y < position.y + bounds.y && 
  //       identityPosition.y + identityBounds.y > position.y
  //   };
  //   return arr.filter(filter);
  // }

  private makeSpatialKey(identity: Identity): string[] {
    const cs = this.cellsize;
    let { x, y } = identity.globalPosition;
    let { x: width, y: height } = vectorMultiply(identity.bounds, identity.globalScale);
    let { z, depth } = identity;

    let hw = Math.floor((x + (width / 2)) / cs)
    let hh = Math.floor((y + (height / 2)) / cs)
    let hd = Math.floor((z + (depth / 2)) / cs)

    let keys = []
    for (let xi = Math.floor(((x || 1) - (width / 2)) / cs); xi <= hw; xi = xi + 1) {
      for (let yi = Math.floor((((y || 1)) - (height / 2)) / cs); yi <= hh; yi = yi + 1) {
        for (let zi = Math.floor((z - (depth / 2)) / cs); zi <= hd; zi = zi + 1) {
          keys.push(xi + "," + yi + "," + zi);
        }
      }
    }
    return keys;
  }
}
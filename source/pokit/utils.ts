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

export function VectorOne(): Vector {
  return {
    x: 1,
    y: 1
  }
}

export function VectorZero(): Vector {
  return {
    x: 0,
    y: 0
  }
}

export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function rad2deg(rad: number) {
  return rad * (180 / Math.PI);
}

export default class SpatialHashMap {
  map: Map<string, Identity[]>;
  cellsize: number;

  constructor(cellsize: number) {
    this.map = new Map();
    this.cellsize = cellsize;
  }

  add(identity: Identity): SpatialHashMap {
    let spatialKeys = this.makeSpatialKey(identity);
    for (let key of spatialKeys) {
      let bucket = this.map.get(key) || [];
      bucket.push(identity);
      this.map.set(key, bucket);
    }
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
    let { x: width, y: height } = identity.bounds;
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
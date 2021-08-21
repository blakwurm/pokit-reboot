import { Vector } from "./pokit";

export function deepMerge(o: any, ...arr: any[]){
  let ret = Object.assign({},o);
  for(let obj of arr){
      for(let [k,v] of Object.entries(obj)){
          if(typeof ret[k] !== typeof v || typeof v !== "object")
              ret[k] = v;
          else if (Array.isArray(v))
              ret[k] = (<Array<any>>ret[k]).concat(v);
          else
              ret[k] = deepMergeNoConcat(ret[k], v!);
      }
  }
  return ret;
}

export function deepMergeNoConcat(o: any, ...arr: any[]){
  let ret = Object.assign({},o);
  for(let obj of arr){
      for(let [k,v] of Object.entries(obj)){
          if(typeof ret[k] !== typeof v || typeof v !== "object" || Array.isArray(v))
              ret[k] = v;
          else
              ret[k] = deepMergeNoConcat(ret[k], v!);
      }
  }
  return ret;
}

export function uuid(){
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
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
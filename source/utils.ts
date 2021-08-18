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
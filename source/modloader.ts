import { PokitOS } from "./pokit.js";

export default async function loadModules(cartPath: string, modules: string[]) {
  let tasks = modules.map((uri)=>loadSingle(cartPath, uri));
  return new Promise<void>(async (resolve)=>{
    for(let task of tasks) await task;
    resolve();
  });
}

async function loadSingle(cartPath: string, uri: string) {
  let path = getPath(cartPath, uri);
  await import(path);
}

function getPath(cartPath: string, uri: string) {
  if(uri.startsWith("@")) {
    let tokens = uri.substr(1).split(":");
    return resolveModule(tokens[0], tokens[1]);
  }

  return cartPath+"/modules/"+uri+"/main.js";
}

function resolveModule(provider: string, module: string) {
  let path = "";
  switch(provider.toLowerCase()) {
    case "pokit":
      return "./modules/"+module+"/main.js";
  }
  return path;
}

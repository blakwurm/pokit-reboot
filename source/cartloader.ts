import { Identity, IJsonSerializableObject } from "./pokit";

export interface CartManifest {
  author: string;
  name: string;
  defaultScene: string;
  modules: string[];
  scripts: string[];
  entities: { [name:string]: EntityStub };
  scenes: { [name:string]: SceneStub };
  sceneShards: string[];
  entityShards: string[];
}

export interface SceneStub {
  systems: string[];
  entities: { [stub:string]: Identity };
}

export interface EntityStub {
  inherits: string[];
  components: IJsonSerializableObject;
}

export function getCartPath() {
  let url = new URL(window.location.href);
  return url.searchParams.get("cart") || "./js/testcart";
}

export async function loadCart(cartPath: string) {
  let resp = await fetch(cartPath + '/cart.json');
  let manifest = await resp.json() as CartManifest;
  await resolveCart(manifest, cartPath);

  return manifest;
}

async function resolveCart(manifest: CartManifest, cartPath: string) {
  manifest.entities = manifest.entities || {};
  manifest.scenes = manifest.scenes || {};
  manifest.sceneShards = manifest.sceneShards || [];
  manifest.entityShards = manifest.entityShards || [];

  for(let path of manifest.sceneShards) {
    let name = stripExtension(getName(path));
    let resp = await fetch(cartPath + '/scenes/' + path);
    let shard = await resp.json() as SceneStub;
    manifest.scenes[name] = shard;
  }

  for(let path of manifest.entityShards) {
    let name = stripExtension(getName(path));
    let resp = await fetch(cartPath + '/entities/' + path);
    let shard = await resp.json() as EntityStub;
    manifest.entities[name] = shard;
  }

  for(let path of manifest.scripts) {
    await import(cartPath + '/scripts/' + path);
  }
}

function getName(path: string) {
  let split =  path.split('\/');
  return split[split.length -1];
}

function stripExtension(name: string) {
  let split = name.split('.');
  return split.slice(0, split.length -1).join(".");
}
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
  systems?: string[];
  entities: { [stub:string]: Identity[] };
}

export interface EntityStub {
  inherits: string[];
  components: IJsonSerializableObject;
  children?: { [stub:string]: Identity[] };
}

export function getCartPath() {
  let url = new URL(window.location.href);
  return url.searchParams.get("cart") || "/pokit/testcart";
}

export async function loadCart(cartPath: string): Promise<[CartManifest, HTMLImageElement]> {
  let resp = await fetch(cartPath + '/cart.json');
  let manifest = await resp.json() as CartManifest;
  let tilesheet = await loadImage(cartPath + '/sprites.png')
  await resolveCart(manifest, cartPath);

  return [manifest, tilesheet];
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

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
      let i = new Image();
      i.onload = () => resolve(i);
      i.src = url;
  })
}

function getName(path: string) {
  let split =  path.split('\/');
  return split[split.length -1];
}

function stripExtension(name: string) {
  let split = name.split('.');
  return split.slice(0, split.length -1).join(".");
}
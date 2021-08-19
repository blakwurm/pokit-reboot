import { PokitOS } from "./pokit.js";
import { getCartPath, loadCart } from "./cartloader.js";

declare global {
  interface Window { Pokit: PokitOS }
}

export default async function main() {
  let engine = new PokitOS();
  window.Pokit = engine;


  let cartPath = getCartPath();
  let [manifest, tilesheet] = await loadCart(cartPath);
  await engine.modules.loadModules(cartPath, manifest.modules);
  await engine.ecs.loadStubs(manifest);
  engine.cartPath = cartPath;
  engine.cart = manifest;

  await engine.modules.callEvent("cartLoad", manifest, tilesheet);

  let scene;
  if(manifest.defaultScene) {
    scene = await engine.ecs.loadScene(manifest.defaultScene);
  }

  await setup_console_open();
  await engine.start();

  if(scene) engine.ecs.transition(scene);
}

async function setup_console_open() {
  return new Promise( resolve=> {
    (<HTMLButtonElement>document.querySelector('#onbutton')).onclick = 
      async function() {
        document.querySelector('#powercase_right')!.className = 'hidden';
        document.querySelector('#powercase_left')!.className = 'hidden';
        resolve(null);
      }
  } );
}

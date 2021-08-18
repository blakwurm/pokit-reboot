import { PokitOS } from "./pokit.js";
import { getCartPath, loadCart } from "./cartloader.js";

declare global {
  interface Window { Pokit: PokitOS }
}

export default async function main() {
  let engine = new PokitOS();
  window.Pokit = engine;


  let cartPath = getCartPath();
  let manifest = await loadCart(cartPath);
  await engine.modules.loadModules(cartPath, manifest.modules);
  await engine.ecs.loadStubs(manifest);
  engine.cartPath = cartPath;
  engine.cart = manifest;

  if(manifest.defaultScene) {
    engine.ecs.loadScene(manifest.defaultScene);
  }

  await setup_console_open();
  engine.start();
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

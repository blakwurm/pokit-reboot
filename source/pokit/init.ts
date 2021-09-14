import { PokitOS, StartOpts } from "./pokit.js";
import { getCartPath, loadCart } from "./cartloader.js";
import { Scene } from "./scene.js";

declare global {
  interface Window { Pokit: PokitOS }
}

export default async function init(startOpts?: StartOpts, doOwnSetup: boolean = false) {
  let engine = new PokitOS(startOpts);
  window.Pokit = engine;


  let cartPath = getCartPath();
  let [manifest, tilesheet] = await loadCart(cartPath);
  await engine.modules.loadModules(cartPath, manifest.modules);
  await engine.ecs.loadStubs(manifest);
  engine.cartPath = cartPath;
  engine.cart = manifest;

  await engine.modules.callEvent("cartLoad", manifest, tilesheet);

  let scene: Scene;
  if(manifest.defaultScene) {
    scene = await engine.ecs.loadScene(manifest.defaultScene);
  }

  let callback = () => engine.start().then(() => { if (scene) scene.activate() });

  if(doOwnSetup) {
    setup_console_open(callback);
  }

  return [engine, callback];
}

export function setup_console_open(callback: ()=>Promise<void>) {
  (<HTMLButtonElement>document.querySelector('#onbutton')).onclick = 
    async function() {
      document.querySelector('#powercase_right')!.className = 'hidden';
      document.querySelector('#powercase_left')!.className = 'hidden';
      await callback();
    }
}

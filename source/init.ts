import { PokitOS } from "./pokit.js";
import loadModules from "./modloader.js";

declare global {
  interface Window { Pokit: PokitOS }
}

export default async function main() {
  let engine = new PokitOS();
  window.Pokit = engine;

  await loadModules("", []);
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

main();
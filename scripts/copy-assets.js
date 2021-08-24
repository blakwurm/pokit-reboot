#! /usr/bin/env node

let fs = require('fs');
let path = require('path');
let Glob = require('glob');

async function copy(source, glob, dest) {
  return new Promise((resolve) => {
    new Glob(path.join(source,glob), (_,files)=>{
      for(let f of files) {
        if(fs.lstatSync(f).isDirectory())continue;
        let dir = path.dirname(f).substr(source.length);
        dir = path.join(dest, dir);
        fs.mkdirSync(dir, {recursive:true});
        dir = path.join(dir, path.basename(f));
        let o = path.join(f);
        console.log(o, "=>", dir);
        fs.copyFileSync(o, dir);
      }
      resolve();
    });
  });
}

module.exports = copy;

if(process.argv.length > 3) {
  let arr = process.argv;
  let dest = arr.pop();
  let glob = arr.pop();
  let source = arr.pop();

  copy(source, glob, dest);
}
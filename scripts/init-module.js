#! /usr/bin/env node

let copy = require('./copy');

let glob = "**/*";
if(process.argv.length > 1 && process.argv[1] === "nogitignore") glob += "[!.gitignore]";

copy("../templates/module", glob, process.cwd());
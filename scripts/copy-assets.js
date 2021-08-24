#! /usr/bin/env node

let copy = require('./copy');

let arr = process.argv;
let dest = arr.pop();
let glob = arr.pop();
let source = arr.pop();

copy(source, glob, dest);
#!/usr/bin/env node
'use strict';

const { ArgumentParser } = require('..');

var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse examples: arguments'
});
parser.addArgument(
  [ '-f', '--foo' ],
  {
    help: 'foo bar'
  }
);
parser.addArgument(
  [ '-b', '--bar' ],
  {
    help: 'bar foo'
  }
);
parser.addArgument(
  '--baz',
  {
    help: 'baz bar'
  }
);


parser.printHelp();
console.log('-----------');

var args;
args = parser.parseArgs('-f 1 -b2'.split(' '));
console.dir(args);
console.log('-----------');
args = parser.parseArgs('-f=3 --bar=4'.split(' '));
console.dir(args);
console.log('-----------');
args = parser.parseArgs('--foo 5 --bar 6'.split(' '));
console.dir(args);
console.log('-----------');
args = parser.parseArgs('--baz 7 -f 8'.split(' '));
console.dir(args);
console.log('-----------');

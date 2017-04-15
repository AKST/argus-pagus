#!/usr/bin/env node
'use strict';

import { ArgumentParser, HELP_FLAG, VERS_FLAG } from '..';

const version = '0.0.1';

const parser = new ArgumentParser({
  version: true,
  addHelp: true,
  description: 'Argparse examples: help',
  epilog: 'help epilog',
  prog: 'help_example_prog',
  usage: 'Usage %(prog)s <agrs>'
});

const args = parser.parseArgs();

if (args[HELP_FLAG]) {
  parser.printHelp();
  process.exit(0);
}
else if (args[VERS_FLAG]) {
  console.log(`v${version}`);
  process.exit(0);
}

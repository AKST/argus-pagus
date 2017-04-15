0.2.0 / 15-04-2017
------------------

This was the whole point of this fork to begin with, you should be able to write the following to print help or version information.

```javascript
import ArgumentParser, { HELP_FLAG, VERS_FLAG } from '..';

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
```

0.1.0 / 14-04-2017
------------------

- First release.
- Fork of nodeca/argparse, changing
  - mostly internal changes
  - addes default export

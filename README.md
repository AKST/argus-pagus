argus-pagus
========

[![npm version](https://badge.fury.io/js/argus-pagus.svg)](https://badge.fury.io/js/argus-pagus) [![CircleCI](https://circleci.com/gh/AKST/argus-pagus.svg?style=svg)](https://circleci.com/gh/AKST/argus-pagus)

## Install

```bash
# suggested
yarn add argus-pagus

# or by y'ol npm
npm install --save argus-pagus
```


## About

Initially this was a node.js port of [pythons argparse][pyimpl], but it has been forked to make specific changes. The following changes have been made from the [original][original]:

- Focus less on replicating the python API 1:1
- Adding types
- Remove all non development dependencies
    - The only dependency at the moment is sprintf
- Force more responsiblity on to the client calling code
    - If the help argument is provided, this library will simply state the help flag
      was provided in the return value, instead loogging to stdout, and killing the process.
    - Like wise with the version flag
- ES Module default export
- Various internal changes

Unless specfied the with these exception this libraries API is pretty much 1:1 with the forked library, however this could change. For documentation [see here][docs].

[original]: http://github.com/nodeca/argparse
[pyimpl]: http://docs.python.org/dev/library/argparse.html
[docs]: http://nodeca.github.com/argparse/


## Example

```javascript
// test.js
import ArgumentParser, {
  HELP_FLAG,
  VERS_FLAG,
} from 'argus-pagus';

const parser = new ArgumentParser({
  version: true,
  addHelp: true,
  description: 'Argparse example'
});

parser.addArgument([ '-f', '--foo' ], {
  help: 'foo bar'
});

parser.addArgument([ '-b', '--bar' ], {
  help: 'bar foo'
});

parser.addArgument('--baz', {
  help: 'baz bar'
});

const results = parser.parseArgs();

if (results[HELP_FLAG]) {
  parser.printHelp();
  process.exit(0);
}
else if (results[VERS_FLAG]) {
  console.log("your version");
  process.exit(0);
}
```

#### Display help:

```
$ node ./test.js -h
usage: example.js [-h] [-v] [-f FOO] [-b BAR] [--baz BAZ]

Argparse example

Optional arguments:
  -h, --help         Show this help message and exit.
  -v, --version      Show program's version number and exit.
  -f FOO, --foo FOO  foo bar
  -b BAR, --bar BAR  bar foo
  --baz BAZ          baz bar
```

#### Parse arguments:

```
$ node ./test.js -f=3 --bar=4 --baz 5
{ foo: '3', bar: '4', baz: '5' }
```

More [examples](https://github.com/akst/argus-pagus/tree/master/examples).

## ArgumentParser objects

```javascript
new ArgumentParser({parameters hash});
```

Creates a new ArgumentParser object.

**Supported params:**

- `description` - Text to display before the argument help.
- `epilog` - Text to display after the argument help.
- `addHelp` - Add a -h/–help option to the parser. (default: true)
- `argumentDefault` - Set the global default value for arguments. (default: null)
- `parents` - A list of ArgumentParser objects whose arguments should also be included.
- `prefixChars` - The set of characters that prefix optional arguments. (default: ‘-‘)
- `formatterClass` - A class for customizing the help output.
- `prog` - The name of the program (default: `path.basename(process.argv[1])`)
- `usage` - The string describing the program usage (default: generated)
- `conflictHandler` - Usually unnecessary, defines strategy for resolving conflicting optionals.

**Not supportied yet**

- `fromfilePrefixChars` - The set of characters that prefix files from which additional arguments should be read.


Details in [original ArgumentParser guide](http://docs.python.org/dev/library/argparse.html#argumentparser-objects)


### addArgument() method

```javascript
ArgumentParser.addArgument(name or flag or [name] or [flags...], {options})
```

Defines how a single command-line argument should be parsed.

- `name or flag or [name] or [flags...]` - Either a positional name
  (e.g., `'foo'`), a single option (e.g., `'-f'` or `'--foo'`), an array
  of a single positional name (e.g., `['foo']`), or an array of options
  (e.g., `['-f', '--foo']`).

Options:

- `action` - The basic type of action to be taken when this argument is encountered at the command line.
- `nargs` - The number of command-line arguments that should be consumed.
- `constant` - A constant value required by some action and nargs selections.
- `defaultValue` - The value produced if the argument is absent from the command line.
- `type` - The type to which the command-line argument should be converted.
- `choices` - A container of the allowable values for the argument.
- `required` - Whether or not the command-line option may be omitted (optionals only).
- `help` - A brief description of what the argument does.
- `metavar` - A name for the argument in usage messages.
- `dest` - The name of the attribute to be added to the object returned by parseArgs().

Details in [original add_argument guide](http://docs.python.org/dev/library/argparse.html#the-add-argument-method)


### Action (some details)

ArgumentParser objects associate command-line arguments with actions.
These actions can do just about anything with the command-line arguments associated
with them, though most actions simply add an attribute to the object returned by
parseArgs(). The action keyword argument specifies how the command-line arguments
should be handled. The supported actions are:

- `store` - Just stores the argument’s value. This is the default action.
- `storeConst` - Stores value, specified by the const keyword argument.
  (Note that the const keyword argument defaults to the rather unhelpful None.)
  The 'storeConst' action is most commonly used with optional arguments, that
  specify some sort of flag.
- `storeTrue` and `storeFalse` - Stores values True and False
  respectively. These are special cases of 'storeConst'.
- `append` - Stores a list, and appends each argument value to the list.
  This is useful to allow an option to be specified multiple times.
- `appendConst` - Stores a list, and appends value, specified by the
  const keyword argument to the list. (Note, that the const keyword argument defaults
  is None.) The 'appendConst' action is typically used when multiple arguments need
  to store constants to the same list.
- `count` - Counts the number of times a keyword argument occurs. For example,
  used for increasing verbosity levels.

Details in [original action guide](http://docs.python.org/dev/library/argparse.html#action)


### Sub-commands

Many programs split their functionality into a number of sub-commands, for
example, the svn program can invoke sub-commands like `git status`, `git pull`,
and `git commit`. Splitting up functionality this way can be a particularly good
idea when a program performs several different functions which require different
kinds of command-line arguments. `ArgumentParser` supports creation of such
sub-commands with `addSubparsers()` method. The `addSubparsers()` method is
normally called with no arguments and returns an special action object.
This object has a single method `addParser()`, which takes a command name and
any `ArgumentParser` constructor arguments, and returns an `ArgumentParser` object
that can be modified as usual.

#### Example:

> sub_commands.js

```javascript
import ArgumentParser from 'argus-pagus';

const parser = new ArgumentParser({
  version: true,
  addHelp: true,
  description: 'Argparse examples: sub-commands',
});

const subparsers = parser.addSubparsers({
  title: 'subcommands',
  dest: "subcommand_name"
});

const c1 = subparsers.addParser('c1', { addHelp: true });

c1.addArgument([ '-f', '--foo' ], {
  action: 'store',
  help: 'foo3 bar3'
});

const c2 = subparsers.addParser('c2', {
  aliases: ['co'],
  addHelp: true
});

c2.addArgument([ '-b', '--bar' ], {
  action: 'store',
  type: 'int',
  help: 'foo3 bar3'
});

console.dir(parser.parseArgs());
```

Details in [original sub-commands guide](http://docs.python.org/dev/library/argparse.html#sub-commands)

## Fork Author

- [Angus Thomsen](https://github.com/akst)

## Original Authors

- [Eugene Shkuropat](https://github.com/shkuropat)
- [Paul Jacobson](https://github.com/hpaulj)

[others](https://github.com/nodeca/argparse/graphs/contributors)

Released under the MIT license. See
[LICENSE](https://github.com/nodeca/argus-pagus/blob/master/LICENSE) for details.



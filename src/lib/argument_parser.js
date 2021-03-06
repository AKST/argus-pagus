/**
 * class ArgumentParser
 *
 * Object for parsing command line strings into js objects.
 *
 * Inherited from [[ActionContainer]]
 **/
import fs from 'fs'
import { sprintf } from 'sprintf-js'
import { basename } from 'path'
import { format } from 'util'

import Namespace from '@/namespace'
import HelpFormatter from '@/help/formatter'
import ActionContainer from '@/action_container'
import argumentErrorHelper from '@/argument/error'
import { has, arrayUnion, repeat, range } from '@/utils'
import c from '@/const'

type RawNamespace = ?(Namespace | Object)

/**
 * new ArgumentParser (options)
 *
 * Create a new ArgumentParser object.
 *
 * ##### Options:
 * - `prog`  The name of the program (default: path.basename(process.argv[1]))
 * - `usage`  A usage message (default: auto-generated from arguments)
 * - `description`  A description of what the program does
 * - `epilog`  Text following the argument descriptions
 * - `parents`  Parsers whose arguments should be copied into this one
 * - `formatterClass`  HelpFormatter class for printing help messages
 * - `prefixChars`  Characters that prefix optional arguments
 * - `fromfilePrefixChars` Characters that prefix files containing additional arguments
 * - `argumentDefault`  The default value for all arguments
 * - `addHelp`  Add a -h/-help option
 * - `conflictHandler`  Specifies how to handle conflicting argument names
 * - `debug`  Enable debug mode. Argument errors throw exception in
 *   debug mode and process.exit in normal. Used for development and
 *   testing (default: false)
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#argumentparser-objects
 **/
export default class ArgumentParser extends ActionContainer {
  constructor (options = {}) {
    options.description = (options.description || null)
    options.argumentDefault = (options.argumentDefault || null)
    options.prefixChars = (options.prefixChars || '-')
    options.conflictHandler = (options.conflictHandler || 'error')
    super(options)

    options.addHelp = typeof options.addHelp === 'undefined' || !! options.addHelp
    options.parents = options.parents || []
    // default program name
    options.prog = (options.prog || basename(process.argv[1]))
    this.prog = options.prog
    this.usage = options.usage
    this.epilog = options.epilog
    this.version = options.version

    this.debug = (options.debug === true)

    this.formatterClass = (options.formatterClass || HelpFormatter)
    this.fromfilePrefixChars = options.fromfilePrefixChars || null
    this._positionals = this.addArgumentGroup({ title: 'Positional arguments' })
    this._optionals = this.addArgumentGroup({ title: 'Optional arguments' })
    this._subparsers = null

    // register types
    function FUNCTION_IDENTITY (o) {
      return o
    }

    this.register('type', 'auto', FUNCTION_IDENTITY)
    this.register('type', null, FUNCTION_IDENTITY)
    this.register('type', 'int', function (x) {
      const result = parseInt(x, 10)
      if (isNaN(result)) throw new Error(x + ' is not a valid integer.')
      return result
    })

    this.register('type', 'float', function (x) {
      const result = parseFloat(x)
      if (isNaN(result)) throw new Error(x + ' is not a valid float.')
      return result
    })

    this.register('type', 'string', x => '' + x)

    // add help and version arguments if necessary
    const defaultPrefix = (this.prefixChars.indexOf('-') > -1) ? '-' : this.prefixChars[0]
    if (options.addHelp) {
      this.addArgument(
        [ defaultPrefix + 'h', defaultPrefix + defaultPrefix + 'help' ],
        {
          action: 'help',
          defaultValue: c.SUPPRESS,
          help: 'Show this help message and exit.',
        }
      )
    }

    if (typeof this.version !== 'undefined') {
      const version = [defaultPrefix + 'v', defaultPrefix + defaultPrefix + 'version']
      this.addArgument(version, {
        action: 'version',
        version: this.version,
        defaultValue: c.SUPPRESS,
        help: "Show program's version number and exit.",
      })
    }

    // add parent arguments and defaults
    options.parents.forEach(parent => {
      this._addContainerActions(parent)
      if (typeof parent._defaults !== 'undefined') {
        for (const defaultKey of Object.keys(parent._defaults)) {
          this._defaults[defaultKey] = parent._defaults[defaultKey]
        }
      }
    })
  }


  /**
   * @param options - Hash for options.
   */
  addSubparsers (options) {
    if (this._subparsers) {
      this.error('Cannot have multiple subparser arguments.')
    }

    options = options || {}
    options.debug = (this.debug === true)
    options.optionStrings = []
    options.parserClass = (options.parserClass || ArgumentParser)


    if (!! options.title || !! options.description) {
      this._subparsers = this.addArgumentGroup({
        title: (options.title || 'subcommands'),
        description: options.description,
      })

      delete options.title
      delete options.description
    }
    else {
      this._subparsers = this._positionals
    }

    // prog defaults to the usage message of this parser, skipping
    // optional arguments and with no "usage:" prefix
    if (! options.prog) {
      const formatter = this._getFormatter()
      const positionals = this._getPositionalActions()
      const groups = this._mutuallyExclusiveGroups
      formatter.addUsage(this.usage, positionals, groups, '')
      options.prog = formatter.formatHelp().trim()
    }

    // create the parsers action and add it to the positionals list
    const ParsersClass = this._popActionClass(options, 'parsers')
    const action = new ParsersClass(options)
    this._subparsers._addAction(action)

    // return the created parsers action
    return action
  }

  _addAction (action) {
    if (action.isOptional()) {
      this._optionals._addAction(action)
    }
    else {
      this._positionals._addAction(action)
    }
    return action
  }

  _getOptionalActions () {
    return this._actions.filter(function (action) {
      return action.isOptional()
    })
  }

  _getPositionalActions () {
    return this._actions.filter(function (action) {
      return action.isPositional()
    })
  }


  /**
   * Parsed args and throws error if some arguments are not recognized.
   *
   * @param argsIn - The arguments.
   * @param namespace - The namespace.
   */
  parseArgs (argsIn: ?Array<string>, namespace: RawNamespace) {
    const [args, argv] = this.parseKnownArgs(argsIn, namespace)

    if (argv && argv.length > 0) {
      this.error(format('Unrecognized arguments: %s.', argv.join(' ')))
    }
    return args
  }

  /**
   * Parse known arguments and return tuple of result object
   * and unknown args.
   *
   * @param _args - The arguments.
   * @param _namespace - The namespace.
   */
  parseKnownArgs (_args: ?Array<string>, _namespace: RawNamespace) {
    // args default to the system args
    const args = _args || process.argv.slice(2)

    // default Namespace built from parser defaults
    const namespace = _namespace || new Namespace()

    this._actions.forEach(action => {
      if (action.dest !== c.SUPPRESS) {
        if (! has(namespace, action.dest)) {
          if (action.defaultValue !== c.SUPPRESS) {
            let defaultValue = action.defaultValue
            if (typeof action.defaultValue === 'string') {
              defaultValue = this._getValue(action, defaultValue)
            }
            namespace[action.dest] = defaultValue
          }
        }
      }
    })

    Object.keys(this._defaults).forEach((dest) => {
      namespace[dest] = this._defaults[dest]
    })

    // parse the arguments and exit if there are any errors
    try {
      const result = this._parseKnownArgs(args, namespace)
      const namespace2 = result[0]
      let args2 = result[1]


      if (has(namespace2, c._UNRECOGNIZED_ARGS_ATTR)) {
        args2 = arrayUnion(args2, namespace2[c._UNRECOGNIZED_ARGS_ATTR])
        delete namespace2[c._UNRECOGNIZED_ARGS_ATTR]
      }
      return [ namespace2, args2 ]
    }
    catch (e) {
      this.error(e)
    }
  }

  _parseKnownArgs (argStrings, namespace) {
    let extras = []

    // replace arg strings that are file references
    if (this.fromfilePrefixChars !== null) {
      argStrings = this._readArgsFromFiles(argStrings)
    }
    // map all mutually exclusive arguments to the other arguments
    // they can't occur with
    // Python has 'conflicts = action_conflicts.setdefault(mutex_action, [])'
    // though I can't conceive of a way in which an action could be a member
    // of two different mutually exclusive groups.

    function actionHash (action) {
      // some sort of hashable key for this action
      // action itself cannot be a key in actionConflicts
      // I think getName() (join of optionStrings) is unique enough
      return action.getName()
    }

    let conflicts, key
    const actionConflicts = {}

    this._mutuallyExclusiveGroups.forEach(function (mutexGroup) {
      mutexGroup._groupActions.forEach(function (mutexAction, i, groupActions) {
        key = actionHash(mutexAction)
        if (! has(actionConflicts, key)) {
          actionConflicts[key] = []
        }
        conflicts = actionConflicts[key]
        conflicts.push.apply(conflicts, groupActions.slice(0, i))
        conflicts.push.apply(conflicts, groupActions.slice(i + 1))
      })
    })

    // find all option indices, and determine the arg_string_pattern
    // which has an 'O' if there is an option at an index,
    // an 'A' if there is an argument, or a '-' if there is a '--'
    const optionStringIndices = {}
    const argStringPatternParts = []

    argStrings.forEach((argString, argStringIndex) => {
      if (argString === '--') {
        argStringPatternParts.push('-')
        while (argStringIndex < argStrings.length) {
          argStringPatternParts.push('A')
          argStringIndex++
        }
      }
      else {
        // otherwise, add the arg to the arg strings
        // and note the index if it was an option
        let pattern
        const optionTuple = this._parseOptional(argString)
        if (! optionTuple) {
          pattern = 'A'
        }
        else {
          optionStringIndices[argStringIndex] = optionTuple
          pattern = 'O'
        }
        argStringPatternParts.push(pattern)
      }
    })

    const argStringsPattern = argStringPatternParts.join('')
    const seenActions = []
    const seenNonDefaultActions = []

    const takeAction = (action, argumentStrings, optionString) => {
      seenActions.push(action)
      const argumentValues = this._getValues(action, argumentStrings)

      // error if this argument is not allowed with other previously
      // seen arguments, assuming that actions that use the default
      // value don't really count as "present"
      if (argumentValues !== action.defaultValue) {
        seenNonDefaultActions.push(action)
        if (actionConflicts[actionHash(action)]) {
          actionConflicts[actionHash(action)].forEach(function (actionConflict) {
            if (seenNonDefaultActions.indexOf(actionConflict) >= 0) {
              throw argumentErrorHelper(
                action,
                format('Not allowed with argument "%s".', actionConflict.getName())
              )
            }
          })
        }
      }

      if (argumentValues !== c.SUPPRESS) {
        action.call(this, namespace, argumentValues, optionString)
      }
    }

    const consumeOptional = startIndex => {
      // get the optional identified at this index
      const optionTuple = optionStringIndices[startIndex]
      let action = optionTuple[0]
      let optionString = optionTuple[1]
      let explicitArg = optionTuple[2]

      // identify additional optionals in the same arg string
      // (e.g. -xyz is the same as -x -y -z if no args are required)
      const actionTuples = []

      let args, argCount, start, stop

      while (true) {
        if (! action) {
          extras.push(argStrings[startIndex])
          return startIndex + 1
        }
        if (explicitArg) {
          argCount = this._matchArgument(action, 'A')

          // if the action is a single-dash option and takes no
          // arguments, try to parse more single-dash options out
          // of the tail of the option string
          const chars = this.prefixChars
          if (argCount === 0 && chars.indexOf(optionString[1]) < 0) {
            actionTuples.push([ action, [], optionString ])
            optionString = optionString[0] + explicitArg[0]
            const optionalsMap = this._optionStringActions
            const newExplicitArg = explicitArg.slice(1) || null

            if (Object.keys(optionalsMap).indexOf(optionString) >= 0) {
              action = optionalsMap[optionString]
              explicitArg = newExplicitArg
            }
            else {
              throw argumentErrorHelper(action, sprintf('ignored explicit argument %r', explicitArg))
            }
          }
          else if (argCount === 1) {
            // if the action expect exactly one argument, we've
            // successfully matched the option; exit the loop
            stop = startIndex + 1
            args = [ explicitArg ]
            actionTuples.push([ action, args, optionString ])
            break
          }
          else {
            // error if a double-dash option did not use the
            // explicit argument
            throw argumentErrorHelper(action, sprintf('ignored explicit argument %r', explicitArg))
          }
        }
        else {
          // if there is no explicit argument, try to match the
          // optional's string arguments with the following strings
          // if successful, exit the loop

          start = startIndex + 1
          const selectedPatterns = argStringsPattern.substr(start)

          argCount = this._matchArgument(action, selectedPatterns)
          stop = start + argCount
          args = argStrings.slice(start, stop)
          actionTuples.push([ action, args, optionString ])
          break
        }
      }

      // add the Optional to the list and return the index at which
      // the Optional's string args stopped
      if (actionTuples.length < 1) {
        throw new Error('length should be > 0')
      }

      for (const i of range(0, actionTuples.length)) {
        takeAction.apply(this, actionTuples[i])
      }

      return stop
    }

    // the list of Positionals left to be parsed this is modified
    // by consume_positionals()
    let positionals = this._getPositionalActions()

    const consumePositionals = startIndex => {
      // match as many Positionals as possible
      const selectedPattern = argStringsPattern.substr(startIndex)
      const argCounts = this._matchArgumentsPartial(positionals, selectedPattern)

      // slice off the appropriate arg strings for each Positional
      // and add the Positional and its args to the list
      for (const i of range(0, positionals.length)) {
        const action = positionals[i]
        const argCount = argCounts[i]
        if (typeof argCount === 'undefined') {
          continue
        }
        const args = argStrings.slice(startIndex, startIndex + argCount)

        startIndex += argCount
        takeAction(action, args)
      }

      // slice off the Positionals that we just parsed and return the
      // index at which the Positionals' string args stopped
      positionals = positionals.slice(argCounts.length)
      return startIndex
    }

    // consume Positionals and Optionals alternately, until we have
    // passed the last option string
    let startIndex = 0
    let position

    let maxOptionStringIndex = -1

    Object.keys(optionStringIndices).forEach(function (position) {
      maxOptionStringIndex = Math.max(maxOptionStringIndex, parseInt(position, 10))
    })

    let positionalsEndIndex, nextOptionStringIndex

    while (startIndex <= maxOptionStringIndex) {
      // consume any Positionals preceding the next option
      nextOptionStringIndex = null
      for (position in optionStringIndices) {
        if (! optionStringIndices.hasOwnProperty(position)) continue

        position = parseInt(position, 10)
        if (position >= startIndex) {
          if (nextOptionStringIndex !== null) {
            nextOptionStringIndex = Math.min(nextOptionStringIndex, position)
          }
          else {
            nextOptionStringIndex = position
          }
        }
      }

      if (startIndex !== nextOptionStringIndex) {
        positionalsEndIndex = consumePositionals(startIndex)
        // only try to parse the next optional if we didn't consume
        // the option string during the positionals parsing
        if (positionalsEndIndex > startIndex) {
          startIndex = positionalsEndIndex
          continue
        }
        else {
          startIndex = positionalsEndIndex
        }
      }

      // if we consumed all the positionals we could and we're not
      // at the index of an option string, there were extra arguments
      if (! optionStringIndices[startIndex]) {
        const strings = argStrings.slice(startIndex, nextOptionStringIndex)
        extras = extras.concat(strings)
        startIndex = nextOptionStringIndex
      }
      // consume the next optional and any arguments for it
      startIndex = consumeOptional(startIndex)
    }

    // consume any positionals following the last Optional
    const stopIndex = consumePositionals(startIndex)

    // if we didn't consume all the argument strings, there were extras
    extras = extras.concat(argStrings.slice(stopIndex))

    // if we didn't use all the Positional objects, there were too few
    // arg strings supplied.
    if (positionals.length > 0) {
      this.error('too few arguments')
    }

    // make sure all required actions were present
    this._actions.forEach(action => {
      if (action.required) {
        if (seenActions.indexOf(action) < 0) {
          this.error(format('Argument "%s" is required', action.getName()))
        }
      }
    })

    // make sure all required groups have one option present
    let actionUsed = false
    this._mutuallyExclusiveGroups.forEach(group => {
      if (group.required) {
        actionUsed = group._groupActions.some(function (action) {
          return seenNonDefaultActions.indexOf(action) !== -1
        })

        // if no actions were used, report the error
        if (! actionUsed) {
          const names = []
          group._groupActions.forEach(function (action) {
            if (action.help !== c.SUPPRESS) {
              names.push(action.getName())
            }
          })

          const joinedNames = names.join(' ')
          this.error(`one of the arguments ${joinedNames} is required`)
        }
      }
    })

    // return the updated namespace and the extra arguments
    return [ namespace, extras ]
  }

  _readArgsFromFiles (argStrings) {
    // expand arguments referencing files
    const newArgStrings = []
    argStrings.forEach(argString => {
      if (this.fromfilePrefixChars.indexOf(argString[0]) < 0) {
        // for regular arguments, just add them back into the list
        newArgStrings.push(argString)
      }
      else {
        // replace arguments referencing files with the file content
        try {
          const filename = argString.slice(1)
          let argstrs = []
          let content = fs.readFileSync(filename, 'utf8')
          content = content.trim().split('\n')
          content.forEach(argLine => {
            this.convertArgLineToArgs(argLine).forEach(function (arg) {
              argstrs.push(arg)
            })
            argstrs = this._readArgsFromFiles(argstrs)
          })
          newArgStrings.push.apply(newArgStrings, argstrs)
        }
        catch (error) {
          return this.error(error.message)
        }
      }
    })
    return newArgStrings
  }

  convertArgLineToArgs (argLine) {
    return [ argLine ]
  }

  _matchArgument (action, regexpArgStrings) {
    // match the pattern for this action to the arg strings
    const regexpNargs = new RegExp('^' + this._getNargsPattern(action))
    const matches = regexpArgStrings.match(regexpNargs)
    let message

    // throw an exception if we weren't able to find a match
    if (! matches) {
      switch (action.nargs) {
        case undefined:
        case null:
          message = 'Expected one argument.'
          break
        case c.OPTIONAL:
          message = 'Expected at most one argument.'
          break
        case c.ONE_OR_MORE:
          message = 'Expected at least one argument.'
          break
        default:
          message = 'Expected %s argument(s)'
      }

      throw argumentErrorHelper(
        action,
        format(message, action.nargs)
      )
    }
    // return the number of arguments matched
    return matches[1].length
  }

  _matchArgumentsPartial (actions, regexpArgStrings) {
    // progressively shorten the actions list by slicing off the
    // final actions until we find a match
    let result = []
    let actionSlice, pattern, matches

    function getLength (string) {
      return string.length
    }

    for (const i of range(actions.length, 0)) {
      pattern = ''
      actionSlice = actions.slice(0, i)
      for (const j of range(0, actionSlice.length)) {
        pattern += this._getNargsPattern(actionSlice[j])
      }

      pattern = new RegExp('^' + pattern)
      matches = regexpArgStrings.match(pattern)

      if (matches && matches.length > 0) {
        // need only groups
        matches = matches.splice(1)
        result = result.concat(matches.map(getLength))
        break
      }
    }

    // return the list of arg string counts
    return result
  }

  _parseOptional (argString) {
    let action, optionString, argExplicit

    // if it's an empty string, it was meant to be a positional
    if (! argString) return null

    // if it doesn't start with a prefix, it was meant to be positional
    if (this.prefixChars.indexOf(argString[0]) < 0) return null

    // if the option string is present in the parser, return the action
    if (this._optionStringActions[argString]) {
      return [ this._optionStringActions[argString], argString, null ]
    }

    // if it's just a single character, it was meant to be positional
    if (argString.length === 1) {
      return null
    }

    // if the option string before the "=" is present, return the action
    if (argString.indexOf('=') >= 0) {
      optionString = argString.split('=', 1)[0]
      argExplicit = argString.slice(optionString.length + 1)

      if (this._optionStringActions[optionString]) {
        action = this._optionStringActions[optionString]
        return [ action, optionString, argExplicit ]
      }
    }

    // search through all possible prefixes of the option string
    // and all actions in the parser for possible interpretations
    const optionTuples = this._getOptionTuples(argString)

    // if multiple actions match, the option string was ambiguous
    if (optionTuples.length > 1) {
      const optionStrings = optionTuples.map(function (optionTuple) {
        return optionTuple[1]
      })
      this.error(format(
            'Ambiguous option: "%s" could match %s.',
            argString, optionStrings.join(', ')
      ))
    // if exactly one action matched, this segmentation is good,
    // so return the parsed action
    }
    else if (optionTuples.length === 1) {
      return optionTuples[0]
    }

    // if it was not found as an option, but it looks like a negative
    // number, it was meant to be positional
    // unless there are negative-number-like options
    if (argString.match(this._regexpNegativeNumber)) {
      if (! this._hasNegativeNumberOptionals.some(Boolean)) {
        return null
      }
    }
    // if it contains a space, it was meant to be a positional
    if (argString.search(' ') >= 0) {
      return null
    }

    // it was meant to be an optional but there is no such option
    // in this parser (though it might be a valid option in a subparser)
    return [ null, argString, null ]
  }

  _getOptionTuples (optionString) {
    const result = []
    const chars = this.prefixChars
    let optionPrefix
    let argExplicit
    let action
    let actionOptionString

    // option strings starting with two prefix characters are only split at
    // the '='
    if (chars.indexOf(optionString[0]) >= 0 && chars.indexOf(optionString[1]) >= 0) {
      if (optionString.indexOf('=') >= 0) {
        const optionStringSplit = optionString.split('=', 1)

        optionPrefix = optionStringSplit[0]
        argExplicit = optionStringSplit[1]
      }
      else {
        optionPrefix = optionString
        argExplicit = null
      }

      for (actionOptionString in this._optionStringActions) {
        if (actionOptionString.substr(0, optionPrefix.length) === optionPrefix) {
          action = this._optionStringActions[actionOptionString]
          result.push([ action, actionOptionString, argExplicit ])
        }
      }

    // single character options can be concatenated with their arguments
    // but multiple character options always have to have their argument
    // separate
    }
    else if (chars.indexOf(optionString[0]) >= 0 && chars.indexOf(optionString[1]) < 0) {
      optionPrefix = optionString
      argExplicit = null
      const optionPrefixShort = optionString.substr(0, 2)
      const argExplicitShort = optionString.substr(2)

      for (actionOptionString in this._optionStringActions) {
        if (! has(this._optionStringActions, actionOptionString)) continue

        action = this._optionStringActions[actionOptionString]
        if (actionOptionString === optionPrefixShort) {
          result.push([ action, actionOptionString, argExplicitShort ])
        }
        else if (actionOptionString.substr(0, optionPrefix.length) === optionPrefix) {
          result.push([ action, actionOptionString, argExplicit ])
        }
      }

    // shouldn't ever get here
    }
    else {
      throw new Error(format('Unexpected option string: %s.', optionString))
    }
    // return the collected option tuples
    return result
  }

  _getNargsPattern (action) {
    // in all examples below, we have to allow for '--' args
    // which are represented as '-' in the pattern
    let regexpNargs

    switch (action.nargs) {
      // the default (null) is assumed to be a single argument
      case undefined:
      case null:
        regexpNargs = '(-*A-*)'
        break
      // allow zero or more arguments
      case c.OPTIONAL:
        regexpNargs = '(-*A?-*)'
        break
      // allow zero or more arguments
      case c.ZERO_OR_MORE:
        regexpNargs = '(-*[A-]*)'
        break
      // allow one or more arguments
      case c.ONE_OR_MORE:
        regexpNargs = '(-*A[A-]*)'
        break
      // allow any number of options or arguments
      case c.REMAINDER:
        regexpNargs = '([-AO]*)'
        break
      // allow one argument followed by any number of options or arguments
      case c.PARSER:
        regexpNargs = '(-*A[-AO]*)'
        break
      // all others should be integers
      default:
        regexpNargs = '(-*' + repeat('-*A', action.nargs) + '-*)'
    }

    // if this is an optional action, -- is not allowed
    if (action.isOptional()) {
      regexpNargs = regexpNargs.replace(/-\*/g, '')
      regexpNargs = regexpNargs.replace(/-/g, '')
    }

    // return the pattern
    return regexpNargs
  }

  _getValues (action, argStrings) {
    // for everything but PARSER args, strip out '--'
    if (action.nargs !== c.PARSER && action.nargs !== c.REMAINDER) {
      argStrings = argStrings.filter(function (arrayElement) {
        return arrayElement !== '--'
      })
    }

    let value, argString


    if (argStrings.length === 0 && action.nargs === c.OPTIONAL) {
      // optional argument produces a default when not present
      value = (action.isOptional()) ? action.constant : action.defaultValue

      if (typeof (value) === 'string') {
        value = this._getValue(action, value)
        this._checkValue(action, value)
      }
    }
    else if (argStrings.length === 0 &&
             action.nargs === c.ZERO_OR_MORE &&
             action.optionStrings.length === 0) {
      // when nargs='*' on a positional, if there were no command-line
      // args, use the default if it is anything other than None

      value = (action.defaultValue || argStrings)
      this._checkValue(action, value)
    }
    else if (argStrings.length === 1 && (! action.nargs || action.nargs === c.OPTIONAL)) {
      // single argument or optional argument produces a single value
      argString = argStrings[0]
      value = this._getValue(action, argString)
      this._checkValue(action, value)
    }
    else if (action.nargs === c.REMAINDER) {
      // REMAINDER arguments convert all values, checking none
      value = argStrings.map(v => {
        return this._getValue(action, v)
      })
    }
    else if (action.nargs === c.PARSER) {
      // PARSER arguments convert all values, but check only the first
      value = argStrings.map(v => {
        return this._getValue(action, v)
      })
      this._checkValue(action, value[0])
    }
    else {
      // all other types of nargs produce a list
      value = argStrings.map(v => {
        return this._getValue(action, v)
      })
      value.forEach(v => {
        this._checkValue(action, v)
      })
    }

    // return the converted value
    return value
  }

  _getValue (action, argString) {
    const typeFunction = this._registryGet('type', action.type, action.type)
    if (typeof typeFunction !== 'function') {
      const message = format('%s is not callable', typeFunction)
      throw argumentErrorHelper(action, message)
    }

    try {
      // convert the value to the appropriate type
      return typeFunction(argString)
    }
    catch (e) {
      // ArgumentTypeErrors indicate errors
      // If action.type is not a registered string, it is a function
      // Try to deduce its name for inclusion in the error message
      // Failing that, include the error message it raised.
      const name = typeof action.type === 'string'
        ? action.type
        : action.type.name || action.type.displayName || '<function>'
      const msgPrefix = format('Invalid %s value: %s', name, argString)
      const msg = name === '<function>' ? `${msgPrefix}\n${e.message}` : msgPrefix
      throw argumentErrorHelper(action, msg)
    }
  }

  _checkValue (action, value) {
    // converted value must be one of the choices (if specified)
    let choices = action.choices
    if (choices) {
      // choise for argument can by array or string
      if ((typeof choices === 'string' || Array.isArray(choices)) &&
          choices.indexOf(value) !== -1) {
        return
      }
      // choise for subparsers can by only hash
      if (typeof choices === 'object' && ! Array.isArray(choices) && choices[value]) {
        return
      }

      if (typeof choices === 'string') {
        choices = choices.split('').join(', ')
      }
      else if (Array.isArray(choices)) {
        choices = choices.join(', ')
      }
      else {
        choices = Object.keys(choices).join(', ')
      }
      const message = format('Invalid choice: %s (choose from [%s])', value, choices)
      throw argumentErrorHelper(action, message)
    }
  }

  /**
   * TODO.
   */
  formatUsage (): string {
    const formatter = this._getFormatter()
    formatter.addUsage(this.usage, this._actions, this._mutuallyExclusiveGroups)
    return formatter.formatHelp()
  }

  /**
   * TODO.
   */
  formatHelp () {
    const formatter = this._getFormatter()

    // usage
    formatter.addUsage(this.usage, this._actions, this._mutuallyExclusiveGroups)

    // description
    formatter.addText(this.description)

    // positionals, optionals and user-defined groups
    this._actionGroups.forEach(function (actionGroup) {
      formatter.startSection(actionGroup.title)
      formatter.addText(actionGroup.description)
      formatter.addArguments(actionGroup._groupActions)
      formatter.endSection()
    })

    // epilog
    formatter.addText(this.epilog)

    // determine help from format above
    return formatter.formatHelp()
  }

  _getFormatter () {
    const FormatterClass = this.formatterClass
    const formatter = new FormatterClass({ prog: this.prog })
    return formatter
  }

  /**
   * TODO.
   */
  printUsage () {
    this._printMessage(this.formatUsage())
  }

  /**
   * TODO.
   */
  printHelp () {
    this._printMessage(this.formatHelp())
  }

  _printMessage (message, streamIn = null) {
    const stream = ! streamIn ? process.stdout : streamIn
    if (message) stream.write('' + message)
  }

  /**
   * Print message in stderr/stdout and exit program.
   *
   * @param status - The exit status code.
   * @param message - The message in the exit.
   */
  exit (status: number, message: string) {
    if (message) {
      if (status === 0) {
        this._printMessage(message)
      }
      else {
        this._printMessage(message, process.stderr)
      }
    }

    process.exit(status)
  }

  /**
   * Error method Prints a usage message incorporating the message to stderr and
   * exits. If you override this in a subclass, it should not return -- it should
   * either exit or throw an exception.
   *
   * @param err - The error.
   */
  error (err: Error | string) {
    let message
    if (err instanceof Error) {
      if (this.debug === true) {
        throw err
      }
      message = err.message
    }
    else {
      message = err
    }
    const msg = format('%s: error: %s', this.prog, message) + c.EOL

    if (this.debug === true) {
      throw new Error(msg)
    }

    this.printUsage(process.stderr)

    return this.exit(2, msg)
  }
}


/** internal
 * class ActionSubparsers
 *
 * Support the creation of such sub-commands with the addSubparsers()
 *
 * This class inherited from [[Action]]
 **/
import { format } from 'util'

import Action from '@/action/base'
import c from '@/const'
import argumentErrorHelper from '@/argument/error'


/*:nodoc:*
 * new ChoicesPseudoAction(name, help)
 *
 * Create pseudo action for correct help text
 *
 **/
class ChoicesPseudoAction extends Action {
  constructor (name, help) {
    super({
      optionStrings: [],
      dest: name,
      help: help
    })
  }
}

/**
 * new ActionSubparsers(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionSubparsers extends Action {
  constructor (options = {}) {
    const _nameParserMap = {}
    options.dest = options.dest || c.SUPPRESS
    options.nargs = c.PARSER
    options.choices = _nameParserMap
    super(options)

    this.debug = (options.debug === true)

    this._progPrefix = options.prog
    this._parserClass = options.parserClass
    this._nameParserMap = _nameParserMap
    this._choicesActions = []
  }

  /*:nodoc:*
   * ActionSubparsers#addParser(name, options) -> ArgumentParser
   * - name (string): sub-command name
   * - options (object): see [[ArgumentParser.new]]
   *
   *  Note:
   *  addParser supports an additional aliases option,
   *  which allows multiple strings to refer to the same subparser.
   *  This example, like svn, aliases co as a shorthand for checkout
   *
   **/
  addParser (name, options) {
    var parser

    var self = this

    options = options || {}

    options.debug = (this.debug === true)

    // set program from the existing prefix
    if (!options.prog) {
      options.prog = this._progPrefix + ' ' + name
    }

    var aliases = options.aliases || []

    // create a pseudo-action to hold the choice help
    if (!!options.help || typeof options.help === 'string') {
      var help = options.help
      delete options.help

      var choiceAction = new ChoicesPseudoAction(name, help)
      this._choicesActions.push(choiceAction)
    }

    // create the parser and add it to the map
    parser = new this._parserClass(options)
    this._nameParserMap[name] = parser

    // make parser available under aliases also
    aliases.forEach(function (alias) {
      self._nameParserMap[alias] = parser
    })

    return parser
  }

  _getSubactions () {
    return this._choicesActions
  }

  /*:nodoc:*
   * ActionSubparsers#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Call the action. Parse input aguments
   **/
  call (parser, namespace, values) {
    var parserName = values[0]
    var argStrings = values.slice(1)

    // set the parser name if requested
    if (this.dest !== c.SUPPRESS) {
      namespace[this.dest] = parserName
    }

    // select the parser
    if (this._nameParserMap[parserName]) {
      parser = this._nameParserMap[parserName]
    } else {
      throw argumentErrorHelper(format(
        'Unknown parser "%s" (choices: [%s]).',
          parserName,
          Object.keys(this._nameParserMap).join(', ')
      ))
    }

    // parse all the remaining options into the namespace
    parser.parseArgs(argStrings, namespace)
  }
}


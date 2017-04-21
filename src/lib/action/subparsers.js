import { format } from 'util'

import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import Action from '@/action/base'
import c from '@/const'
import argumentErrorHelper from '@/argument/error'


class ChoicesPseudoAction extends Action {
  constructor (name, help) {
    super({
      optionStrings: [],
      dest: name,
      help: help,
    })
  }
}

/**
 * Support the creation of such sub-commands with
 * the `addSubparsers()` method call.
 */
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

  /**
   * AddParser supports an additional aliases option, which
   * allows multiple strings to refer to the same subparser.
   * For example, like how svn, aliases co as a shorthand for
   * checkout.
   *
   * @param name - Name of subparser.
   * @param optionsIn - Configuration of sub parser.
   */
  addParser (name: string, optionsIn: Object) {
    const options = optionsIn || {}
    options.debug = (this.debug === true)

    // set program from the existing prefix
    if (! options.prog) {
      options.prog = this._progPrefix + ' ' + name
    }

    const aliases = options.aliases || []

    // create a pseudo-action to hold the choice help
    if (!! options.help || typeof options.help === 'string') {
      const help = options.help
      delete options.help

      const choiceAction = new ChoicesPseudoAction(name, help)
      this._choicesActions.push(choiceAction)
    }

    // create the parser and add it to the map
    const parser = new this._parserClass(options)
    this._nameParserMap[name] = parser

    // make parser available under aliases also
    aliases.forEach(alias => {
      this._nameParserMap[alias] = parser
    })

    return parser
  }

  _getSubactions () {
    return this._choicesActions
  }

  /**
   * Handles the action, parse input arguments.
   *
   * @access private
   * @param parser - The parser.
   * @param namespace - The namespace the value is attached to.
   * @param values - The command name.
   */
  call (parser: ArgumentParser, namespace: Namespace, values: Array<any>) {
    const parserName = values[0]
    const argStrings = values.slice(1)

    // set the parser name if requested
    if (this.dest !== c.SUPPRESS) {
      namespace[this.dest] = parserName
    }

    // select the parser
    if (! this._nameParserMap[parserName]) {
      throw argumentErrorHelper(format(
        'Unknown parser "%s" (choices: [%s]).',
          parserName,
          Object.keys(this._nameParserMap).join(', ')
      ))
    }

    // parse all the remaining options into the namespace
    this._nameParserMap[parserName].parseArgs(argStrings, namespace)
  }
}


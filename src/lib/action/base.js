import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import c from '@/const'


/**
 * Base class for all actions, Do not call in your code, use
 * this class only for inherits your own action
 *
 * Information about how to convert command line strings to
 * Javascript objects. Action objects are used by an
 * ArgumentParser to represent the information needed to parse
 * a single argument from one or more strings from the command
 * line. The keyword arguments to the Action constructor are
 * also all attributes of Action instances.
 *
 * Defaults already include:
 *
 * - `store`
 * - `storeConstant`
 * - `storeTrue`
 * - `storeFalse`
 * - `append`
 * - `appendConstant`
 * - `count`
 * - `help`
 * - `version`
 */
export default class Action {
  type: any
  metavar: any
  help: string
  required: boolean
  choices: any
  optionStrings: any
  dest: string
  defaultValue: any
  constant: any

  /**
   * Supported args
   *
   * - `N` (an integer) consumes N arguments (and produces a list)
   * - `?`  consumes zero or one arguments
   * - `*` consumes zero or more arguments (and produces a list)
   * - `+` consumes one or more arguments (and produces a list)
   *
   * Note: that the difference between the default and nargs=1 is that with the
   * default, a single value will be produced, while with nargs=1, a list
   * containing a single value will be produced.
   */
  nargs: any

  constructor (options = {}) {
    this.optionStrings = options.optionStrings || []
    this.dest = options.dest
    this.nargs = typeof options.nargs !== 'undefined' ? options.nargs : null
    this.constant = typeof options.constant !== 'undefined' ? options.constant : null
    this.defaultValue = options.defaultValue
    this.type = typeof options.type !== 'undefined' ? options.type : null
    this.choices = typeof options.choices !== 'undefined' ? options.choices : null
    this.required = typeof options.required !== 'undefined' ? options.required : false
    this.help = typeof options.help !== 'undefined' ? options.help : null
    this.metavar = typeof options.metavar !== 'undefined' ? options.metavar : null

    if (! (this.optionStrings instanceof Array)) {
      throw new Error('optionStrings should be an array')
    }
    if (typeof this.required !== 'undefined' && typeof this.required !== 'boolean') {
      throw new Error('required should be a boolean')
    }
  }

  /**
   * Tells action name.
   */
  getName (): ?string {
    if (this.optionStrings.length > 0) {
      return this.optionStrings.join('/')
    }
    else if (this.metavar !== null && this.metavar !== c.SUPPRESS) {
      return this.metavar
    }
    else if (typeof this.dest !== 'undefined' && this.dest !== c.SUPPRESS) {
      return this.dest
    }
    return null
  }

  /**
   * Whether or not the action is optional.
   */
  isOptional (): boolean {
    return ! this.isPositional()
  }

  /**
   * Whether or not the action is positional.
   */
  isPositional (): boolean {
    return (this.optionStrings.length === 0)
  }

  /**
   * Call the action. Should be implemented in inherited classes.
   *
   * @example
   * ActionCount.prototype.call = function (parser, namespace, values, optionString) {
   *   namespace.set(this.dest, (namespace[this.dest] || 0) + 1)
   * }
   *
   * @param parser - Current parser.
   * @param namespace - Namespace for output data.
   * @param values - Parsed values.
   * @param optionString - Input option string(not parsed).
   */
  call (parser: ArgumentParser, namespace: Namespace, values: Array<any>, optionString: Array<string>) {
    // Not Implemented error
    throw new Error('abstract method')
  }
}


/**
 * class Action
 *
 * Base class for all actions
 * Do not call in your code, use this class only for inherits your own action
 *
 * Information about how to convert command line strings to Javascript objects.
 * Action objects are used by an ArgumentParser to represent the information
 * needed to parse a single argument from one or more strings from the command
 * line. The keyword arguments to the Action constructor are also all attributes
 * of Action instances.
 *
 * ##### Allowed keywords:
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
 *
 * Information about action options see [[Action.new]]
 *
 * See also [original guide](http://docs.python.org/dev/library/argparse.html#action)
 *
 **/
import c from '@/const'


/**
 * new Action(options)
 *
 * Base class for all actions. Used only for inherits
 *
 *
 * ##### Options:
 *
 * - `optionStrings`  A list of command-line option strings for the action.
 * - `dest`  Attribute to hold the created object(s)
 * - `nargs`  The number of command-line arguments that should be consumed.
 * By default, one argument will be consumed and a single value will be
 * produced.
 * - `constant`  Default value for an action with no value.
 * - `defaultValue`  The value to be produced if the option is not specified.
 * - `type`  Cast to 'string'|'int'|'float'|'complex'|function (string). If
 * None, 'string'.
 * - `choices`  The choices available.
 * - `required`  True if the action must always be specified at the command
 * line.
 * - `help`  The help describing the argument.
 * - `metavar`  The name to be used for the option's argument with the help
 * string. If None, the 'dest' value will be used as the name.
 *
 * ##### nargs supported values:
 *
 * - `N` (an integer) consumes N arguments (and produces a list)
 * - `?`  consumes zero or one arguments
 * - `*` consumes zero or more arguments (and produces a list)
 * - `+` consumes one or more arguments (and produces a list)
 *
 * Note: that the difference between the default and nargs=1 is that with the
 * default, a single value will be produced, while with nargs=1, a list
 * containing a single value will be produced.
 **/
export default class Action  {
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

    if (!(this.optionStrings instanceof Array)) {
      throw new Error('optionStrings should be an array')
    }
    if (typeof this.required !== 'undefined' && typeof this.required !== 'boolean') {
      throw new Error('required should be a boolean')
    }
  }

  /**
   * Tells action name
   *
   * @returns {string}
   */
  getName () {
    if (this.optionStrings.length > 0) {
      return this.optionStrings.join('/')
    } else if (this.metavar !== null && this.metavar !== c.SUPPRESS) {
      return this.metavar
    } else if (typeof this.dest !== 'undefined' && this.dest !== c.SUPPRESS) {
      return this.dest
    }
    return null
  }

  /**
   * Return true if optional
   *
   * @returns {boolean}
   */
  isOptional () {
    return !this.isPositional()
  }

  /**
   * Return true if positional
   *
   * @returns {boolean}
   */
  isPositional () {
    return (this.optionStrings.length === 0)
  }

  /**
   *
   * Call the action. Should be implemented in inherited classes
   *
   * ##### Example
   *
   *      ActionCount.prototype.call = function (parser, namespace, values, optionString) {
   *        namespace.set(this.dest, (namespace[this.dest] || 0) + 1)
   *      }
   *
   * @param parser {ArgumentParser} - current parser
   * @param namespace {Namespace} = namespace for output data
   * @param values {Array} - parsed values
   * @parsed optionString {Array} - input option string(not parsed)
   */
  call () {
		// Not Implemented error
    throw new Error('abstract method')
  }
}


/*:nodoc:*
 * class ActionAppend
 *
 * This action stores a list, and appends each argument value to the list.
 * This is useful to allow an option to be specified multiple times.
 * This class inherided from [[Action]]
 *
 **/
import Action from '@/action/base'
import c from '@/const'


/*:nodoc:*
 * new ActionAppend(options)
 * - options (object): options hash see [[Action.new]]
 *
 * Note: options.nargs should be optional for constants
 * and more then zero for other
 **/
export default class ActionAppend extends Action {
  constructor (options = {}) {
    super(options)
    if (options.nargs <= 0) {
      throw new Error('nargs for append actions must be > 0; if arg ' +
          'strings are not supplying the value to append, ' +
          'the append const action may be more appropriate')
    }
    if (!!options.constant && options.nargs !== c.OPTIONAL) {
      throw new Error('nargs must be OPTIONAL to supply const')
    }
  }

  /*:nodoc:*
   * ActionAppend#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Call the action. Save result in namespace object
   **/
  call (parser, namespace, values) {
    var items = (namespace[this.dest] || []).slice()
    items.push(values)
    namespace.set(this.dest, items)
  }
}

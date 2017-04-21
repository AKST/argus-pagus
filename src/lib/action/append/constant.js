/*:nodoc:*
 * class ActionAppendConstant
 *
 * This stores a list, and appends the value specified by
 * the const keyword argument to the list.
 * (Note that the const keyword argument defaults to null.)
 * The 'appendConst' action is typically useful when multiple
 * arguments need to store constants to the same list.
 *
 * This class inherited from [[Action]]
 **/

import Action from '@/action/base'


/*:nodoc:*
 * new ActionAppendConstant(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionAppendConstant extends Action {
  constructor (options = {}) {
    if (typeof options.constant === 'undefined') {
      throw new Error('constant option is required for appendAction')
    }
    super(Object.assign(options, { nargs: 0 }))
  }

  /*:nodoc:*
   * ActionAppendConstant#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Call the action. Save result in namespace object
   **/
  call (parser, namespace) {
    var items = [].concat(namespace[this.dest] || [])
    items.push(this.constant)
    namespace.set(this.dest, items)
  }
}

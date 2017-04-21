/*:nodoc:*
 * class ActionStore
 *
 * This action just stores the argument’s value. This is the default action.
 *
 * This class inherited from [[Action]]
 *
 **/
import Action from '@/action/base'
import c from '@/const'


/*:nodoc:*
 * new ActionStore(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionStore extends Action {
  constructor (options = {}) {
    super(options)
    if (options.nargs <= 0) {
      throw new Error('nargs for store actions must be > 0; if you ' +
          'have nothing to store, actions such as store ' +
          'true or store const may be more appropriate')
    }
    if (typeof options.constant !== 'undefined' && options.nargs !== c.OPTIONAL) {
      throw new Error('nargs must be OPTIONAL to supply const')
    }
  }

  /*:nodoc:*
   * ActionStore#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Call the action. Save result in namespace object
   **/
  call (parser, namespace, values) {
    namespace.set(this.dest, values)
  }
}

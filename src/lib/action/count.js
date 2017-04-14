/*:nodoc:*
 * class ActionCount
 *
 * This counts the number of times a keyword argument occurs.
 * For example, this is useful for increasing verbosity levels
 *
 * This class inherided from [[Action]]
 *
 **/
import Action from '@/action/base';


/*:nodoc:*
 * new ActionCount(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionCount extends Action {
  constructor(options = {}) {
    super(Object.assign(options, { nargs: 0 }));
  }

  /*:nodoc:*
   * ActionCount#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Call the action. Save result in namespace object
   **/
  call(parser, namespace) {
    namespace.set(this.dest, (namespace[this.dest] || 0) + 1);
  }
};

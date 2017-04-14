/*:nodoc:*
 * class ActionStoreConstant
 *
 * This action stores the value specified by the const keyword argument.
 * (Note that the const keyword argument defaults to the rather unhelpful null.)
 * The 'store_const' action is most commonly used with optional
 * arguments that specify some sort of flag.
 *
 * This class inherited from [[Action]]
 **/
import Action from '@/action/base';


/*:nodoc:*
 * new ActionStoreConstant(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionStoreConstant extends Action {
  constructor(options = {}) {
    options.nargs = 0;
    if (typeof options.constant === 'undefined') {
      throw new Error('constant option is required for storeAction');
    }
    super(options);
  }

  /*:nodoc:*
   * ActionStoreConstant#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Call the action. Save result in namespace object
   **/
  call(parser, namespace) {
    namespace.set(this.dest, this.constant);
  }
};

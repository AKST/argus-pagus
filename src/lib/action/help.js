/*:nodoc:*
 * class ActionHelp
 *
 * Support action for printing help
 * This class inherided from [[Action]]
 **/
import Action from '@/action/base';
import c from '@/const';


/*:nodoc:*
 * new ActionHelp(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionHelp extends Action {
  constructor(options = {}) {
    if (options.defaultValue !== null) {
      options.defaultValue = options.defaultValue;
    } else {
      options.defaultValue = c.SUPPRESS;
    }
    options.dest = (options.dest !== null ? options.dest : c.SUPPRESS);
    options.nargs = 0;
    super(options);
  }

  /*:nodoc:*
   * ActionHelp#call(parser, namespace, values, optionString)
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Print help and exit
   **/
  call(parser) {
    parser.printHelp();
    parser.exit();
  }
};

/*:nodoc:*
 * class ActionVersion
 *
 * Support action for printing program version
 * This class inherited from [[Action]]
 **/
import Action from '@/action/base';
import c from '@/const';


/*:nodoc:*
 * new ActionVersion(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionVersion extends Action {

  constructor(options) {
    options = options || {};
    options.defaultValue = options.defaultValue ?
      options.defaultValue :
      c.SUPPRESS;
    options.dest = (options.dest || c.SUPPRESS);
    options.nargs = 0;
    super(options);
    this.version = options.version;
  }


  /*:nodoc:*
   * ActionVersion#call(parser, namespace, values, optionString) -> Void
   * - parser (ArgumentParser): current parser
   * - namespace (Namespace): namespace for output data
   * - values (Array): parsed values
   * - optionString (Array): input option string(not parsed)
   *
   * Print version and exit
   **/
  call(parser) {
    var version = this.version || parser.version;
    var formatter = parser._getFormatter();
    formatter.addText(version);
    parser.exit(0, formatter.formatHelp());
  }
};

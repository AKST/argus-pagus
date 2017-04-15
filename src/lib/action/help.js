/*:nodoc:*
 * class ActionHelp
 *
 * Support action for printing help
 * This class inherided from [[Action]]
 **/
import ActionStoreConstant from '@/action/store/constant';
import { SUPPRESS, HELP_FLAG } from '@/const';


/*:nodoc:*
 * new ActionHelp(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionHelp extends ActionStoreConstant {
  constructor(options = {}) {
    super({
      ...options,
      constant: true,
      defaultValue: false,
      nargs: 0,
      dest: HELP_FLAG,
    });
  }
};

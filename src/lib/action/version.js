/*:nodoc:*
 * class ActionVersion
 *
 * Support action for printing program version
 * This class inherited from [[Action]]
 **/
import ActionStoreConstant from '@/action/store/constant';
import { VERS_FLAG } from '@/const';


/*:nodoc:*
 * new ActionVersion(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionVersion extends ActionStoreConstant {
  constructor(options = {}) {
    super({
      ...options,
      constant: true,
      defaultValue: false,
      nargs: 0,
      dest: VERS_FLAG,
    });
  }
};

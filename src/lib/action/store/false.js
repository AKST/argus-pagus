/*:nodoc:*
 * class ActionStoreFalse
 *
 * This action store the values False respectively.
 * This is special cases of 'storeConst'
 *
 * This class inherited from [[Action]]
 **/
import ActionStoreConstant from '@/action/store/constant';


/*:nodoc:*
 * new ActionStoreFalse(options)
 * - options (object): hash of options see [[Action.new]]
 *
 **/
export default class ActionStoreFalse extends ActionStoreConstant {
  constructor(options = {}) {
    options.constant = false;
    options.defaultValue = options.defaultValue !== null ? options.defaultValue : true;
    super(options);
  }
};

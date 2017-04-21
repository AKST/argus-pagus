/*:nodoc:*
 * class ActionStoreTrue
 *
 * This action store the values True respectively.
 * This isspecial cases of 'storeConst'
 *
 * This class inherited from [[Action]]
 **/
import ActionStoreConstant from '@/action/store/constant'


/*:nodoc:*
 * new ActionStoreTrue(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
export default class ActionStoreTrue extends ActionStoreConstant {
  constructor (options = {}) {
    options.constant = true
    options.defaultValue = options.defaultValue !== null ? options.defaultValue : false
    super(options)
  }
}

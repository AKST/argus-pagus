import ActionStoreConstant from '@/action/store/constant'


/**
 * This action store the values True respectively.
 * This is a special case of 'storeConst'.
 */
export default class ActionStoreTrue extends ActionStoreConstant {
  constructor (options = {}) {
    options.constant = true
    options.defaultValue = options.defaultValue !== null ? options.defaultValue : false
    super(options)
  }
}

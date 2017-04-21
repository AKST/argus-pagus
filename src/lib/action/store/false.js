import ActionStoreConstant from '@/action/store/constant'


/**
 * This action store the values False respectively.
 * This is a special case of 'storeConst'.
 */
export default class ActionStoreFalse extends ActionStoreConstant {
  constructor (options = {}) {
    options.constant = false
    options.defaultValue = options.defaultValue !== null ? options.defaultValue : true
    super(options)
  }
}

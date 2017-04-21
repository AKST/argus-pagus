// @flow
import type { ActionConfig } from '@/action/base'
import ActionStoreConstant from '@/action/store/constant'


/**
 * This action store the values False respectively.
 * This is a special case of 'storeConst'.
 */
export default class ActionStoreFalse extends ActionStoreConstant<boolean> {
  constructor (options: ActionConfig<boolean> = {}) {
    options.constant = false
    options.defaultValue = options.defaultValue !== null ? options.defaultValue : true
    super(options)
  }
}

import type { ActionConfig } from '@/action/base'
import ActionStoreConstant from '@/action/store/constant'
import { VERS_FLAG } from '@/const'

/**
 * Support action for printing program version
 * This class inherited from [[Action]].
 */
export default class ActionVersion extends ActionStoreConstant {
  constructor (options: ActionConfig = {}) {
    super({
      ...options,
      constant: true,
      defaultValue: false,
      nargs: 0,
      dest: VERS_FLAG,
    })
  }
}

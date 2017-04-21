// @flow
import type { ActionConfig } from '@/action/base'
import ActionStoreConstant from '@/action/store/constant'
import { HELP_FLAG } from '@/const'


/**
 * Support action for printing help
 */
export default class ActionHelp extends ActionStoreConstant<boolean> {
  constructor (options: ActionConfig<boolean> = {}) {
    super({
      ...options,
      constant: true,
      defaultValue: false,
      nargs: 0,
      dest: HELP_FLAG,
    })
  }
}

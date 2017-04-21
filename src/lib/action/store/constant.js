// @flow
import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import type { ActionConfig } from '@/action/base'
import Action from '@/action/base'

/**
 * This action stores the value specified by the const keyword argument.
 * (Note that the const keyword argument defaults to the rather unhelpful null.)
 * The 'store_const' action is most commonly used with optional
 * arguments that specify some sort of flag.
 */
export default class ActionStoreConstant<T> extends Action<T> {
  constructor (options: ActionConfig<T> = {}) {
    if (typeof options.constant === 'undefined') {
      throw new Error('constant option is required for storeAction')
    }
    super({ ...options, nargs: 0 })
  }

  /**
   * Call the action. Save result in namespace object.
   *
   * @access private
   * @param parser - The parser.
   * @param namespace - The namespace the value is attached to.
   */
  call (parser: ArgumentParser, namespace: Namespace) {
    namespace.set(this.dest, this.constant)
  }
}

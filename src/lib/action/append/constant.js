// @flow
import type { ActionConfig } from '@/action/base'
import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import Action from '@/action/base'


/**
 * This stores a list, and appends the value specified by
 * the const keyword argument to the list.
 * (Note that the const keyword argument defaults to null.)
 * The 'appendConst' action is typically useful when multiple
 * arguments need to store constants to the same list.
 */
export default class ActionAppendConstant<T> extends Action<T> {
  constructor (options: ActionConfig<T> = {}) {
    if (typeof options.constant === 'undefined') {
      throw new Error('constant option is required for appendAction')
    }
    super(Object.assign(options, { nargs: 0 }))
  }

  /**
   * Call the action. Save result in namespace object.
   *
   * @access private
   * @param parser - The parser.
   * @param namespace - The namespace the value is attached to.
   */
  call (parser: ArgumentParser, namespace: Namespace) {
    const progress = namespace[this.dest] || []
    const items = [...progress, this.constant]
    namespace.set(this.dest, items)
  }
}

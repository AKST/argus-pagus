// @flow
import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import type { ActionConfig } from '@/action/base'
import Action from '@/action/base'
import c from '@/const'


/**
 * This action just stores the argument’s value. This is
 * the default action.
 */
export default class ActionStore<T> extends Action<T> {
  constructor (options: ActionConfig<T> = {}) {
    super(options)
    if (typeof options === 'string' && options.nargs <= 0) {
      throw new Error('nargs for store actions must be > 0; if you ' +
          'have nothing to store, actions such as store ' +
          'true or store const may be more appropriate')
    }
    if (typeof options.constant !== 'undefined' && options.nargs !== c.OPTIONAL) {
      throw new Error('nargs must be OPTIONAL to supply const')
    }
  }

  /**
   * Call the action. Save result in namespace object.
   *
   * @access private
   * @param parser - The parser.
   * @param namespace - The namespace the value is attached to.
   * @param values - Values being set.
   */
  call (parser: ArgumentParser, namespace: Namespace, values: any) {
    namespace.set(this.dest, values)
  }
}

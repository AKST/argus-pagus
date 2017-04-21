// @flow
import type { ActionConfig } from '@/action/base'
import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import Action from '@/action/base'


/**
 * This counts the number of times a keyword argument occurs.
 * For example, this is useful for increasing verbosity levels.
 */
export default class ActionCount extends Action<number> {
  constructor (options: ActionConfig<number> = {}) {
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
    namespace.set(this.dest, (namespace[this.dest] || 0) + 1)
  }
}


import ArgumentGroup from '@/argument/group'

/**
 * @param ActionContainer - The super class.
 */
export default (ActionContainer: any) => {
  /**
   * Group arguments, by default, ArgumentParser groups command-line
   * arguments into “positional arguments” and “optional arguments”
   * when displaying help messages. When there is a better
   * conceptual grouping of arguments than this default one,
   * appropriate groups can be created using the addArgumentGroup() method
   */
  return class MutuallyExclusiveGroup extends ArgumentGroup(ActionContainer) {
    /**
     * @param container - Main container.
     * @param options - Config object.
     * @param options.required - Whether it is required.
     */
    constructor (container: Object, options: Object = {}) {
      const { required = false } = options
      super(container)
      this.required = required
    }

    _addAction (action) {
      if (action.required) {
        const msg = 'mutually exclusive arguments must be optional'
        throw new Error(msg)
      }
      action = this._container._addAction(action)
      this._groupActions.push(action)
      return action
    }

    _removeAction (action) {
      this._container._removeAction(action)
      this._groupActions.remove(action)
    }
  }
}

/**
 * A factory method for making classes.
 *
 * @param ActionContainer - The super class.
 * @returns A sub class of ActionContainer.
 */
export default (ActionContainer: any) => {
  /**
   * Group arguments by default, ArgumentParser groups command-line
   * arguments into “positional arguments” and “optional arguments”
   * when displaying help messages. When there is a better
   * conceptual grouping of arguments than this default one,
   * appropriate groups can be created using the
   * addArgumentGroup() method.
   */
  return class ArgumentGroup extends ActionContainer {
    /**
     * @param container - Main container.
     * @param options - A hash of group options.
     * @param options.prefixChars - The group name prefix.
     * @param options.argumentDefault - Default argument value.
     * @param options.title - Group title.
     * @param options.description - Group description.
     */
    constructor (container: Object, options: Object = {}) {
      // add any missing keyword arguments by checking the container
      options.conflictHandler = (options.conflictHandler || container.conflictHandler)
      options.prefixChars = (options.prefixChars || container.prefixChars)
      options.argumentDefault = (options.argumentDefault || container.argumentDefault)
      super(options)

      // group attributes
      this.title = options.title
      this._groupActions = []

      // share most attributes with the container
      this._container = container
      this._registries = container._registries
      this._actions = container._actions
      this._optionStringActions = container._optionStringActions
      this._defaults = container._defaults
      this._hasNegativeNumberOptionals = container._hasNegativeNumberOptionals
      this._mutuallyExclusiveGroups = container._mutuallyExclusiveGroups
    }

    _addAction (action) {
      action = super._addAction(action)
      this._groupActions.push(action)
      return action
    }


    _removeAction (action) {
      super._removeAction(action)
      var actionIndex = this._groupActions.indexOf(action)
      if (actionIndex >= 0) {
        this._groupActions.splice(actionIndex, 1)
      }
    }
  }
}

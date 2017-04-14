/** internal
 * class MutuallyExclusiveGroup
 *
 * Group arguments.
 * By default, ArgumentParser groups command-line arguments
 * into “positional arguments” and “optional arguments”
 * when displaying help messages. When there is a better
 * conceptual grouping of arguments than this default one,
 * appropriate groups can be created using the addArgumentGroup() method
 *
 * This class inherited from [[ArgumentContainer]]
 **/
'use strict';
import ArgumentGroup from '@/argument/group';

/**
 * new MutuallyExclusiveGroup(container, options)
 * - container (object): main container
 * - options (object): options.required -> true/false
 *
 * `required` could be an argument itself, but making it a property of
 * the options argument is more consistent with the JS adaptation of the Python)
 **/
export default ActionContainer => class MutuallyExclusiveGroup extends ArgumentGroup(ActionContainer) {
  constructor(container, { required = false } = {}) {
    super(container)
    this.required = required;
  }

  _addAction(action) {
    var msg;
    if (action.required) {
      msg = 'mutually exclusive arguments must be optional';
      throw new Error(msg);
    }
    action = this._container._addAction(action);
    this._groupActions.push(action);
    return action;
  }

  _removeAction(action) {
    this._container._removeAction(action);
    this._groupActions.remove(action);
  }
};

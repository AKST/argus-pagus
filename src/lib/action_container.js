import { format } from 'util'

import { has, trimChars, capitalize } from '@/utils'
import argumentErrorHelper from './argument/error'
import makeArgumentGroup from '@/argument/group'
import makeMutuallyExclusiveGroup from '@/argument/exclusive'
import c from '@/const'
import Action, {
  ActionHelp,
  ActionAppend,
  ActionAppendConstant,
  ActionCount,
  ActionStore,
  ActionStoreConstant,
  ActionStoreTrue,
  ActionStoreFalse,
  ActionVersion,
  ActionSubparsers,
} from '@/action'

export type Config = {
  description: string,
  prefixChars: Array<string>,
  argumentDefault: any,
  conflictHandler: any,
}

export type Handler = Object | Function

export default class ActionContainer {
  constructor (options: Config = {}) {
    this.description = options.description
    this.argumentDefault = options.argumentDefault
    this.prefixChars = options.prefixChars || ''
    this.conflictHandler = options.conflictHandler

    // set up registries
    this._registries = {}

    // register actions
    this.register('action', null, ActionStore)
    this.register('action', 'store', ActionStore)
    this.register('action', 'storeConst', ActionStoreConstant)
    this.register('action', 'storeTrue', ActionStoreTrue)
    this.register('action', 'storeFalse', ActionStoreFalse)
    this.register('action', 'append', ActionAppend)
    this.register('action', 'appendConst', ActionAppendConstant)
    this.register('action', 'count', ActionCount)
    this.register('action', 'help', ActionHelp)
    this.register('action', 'version', ActionVersion)
    this.register('action', 'parsers', ActionSubparsers)

    // raise an exception if the conflict handler is invalid
    this._getHandler()

    // action storage
    this._actions = []
    this._optionStringActions = {}

    // groups
    this._actionGroups = []
    this._mutuallyExclusiveGroups = []

    // defaults storage
    this._defaults = {}

    // determines whether an "option" looks like a negative number
    // -1, -1.5 -5e+4
    this._regexpNegativeNumber = new RegExp('^[-]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?$')

    // whether or not there are any optionals that look like negative
    // numbers -- uses a list so it can be shared and edited
    this._hasNegativeNumberOptionals = []
  }

  /**
   * Register handlers.
   *
   * @param registryName - Name the handler will be registed under.
   * @param value - TODO.
   * @param handler - TODO.
   */
  register (registryName: string, value: string, handler: Handler) {
    this._registries[registryName] = this._registries[registryName] || {}
    this._registries[registryName][value] = handler
  }

  _registryGet (registryName, value, defaultValue) {
    if (arguments.length < 3) {
      defaultValue = null
    }
    return this._registries[registryName][value] || defaultValue
  }

  /**
   * Set defaults.
   *
   * @param optionsIn - TODO.
   */
  setDefaults (optionsIn: Object) {
    const options = optionsIn || {}

    for (const property of Object.keys(options)) {
      this._defaults[property] = options[property]
    }

    // If these defaults match any existing arguments,
    // replace the previous default on the object with
    // the new one.
    const relevant = this._actions.filter(a => has(options, a.dest))
    relevant.forEach(a => void (a.defaultValue = options[a.dest]))
  }

  /**
   * Get's the default value associated with the specified dest.
   *
   * @param dest - Get's the default of the specified.
   */
  getDefault (dest: string): any {
    let result = has(this._defaults, dest) ? this._defaults[dest] : null

    this._actions.forEach(function (action) {
      if (action.dest === dest && has(action, 'defaultValue')) {
        result = action.defaultValue
      }
    })

    return result
  }

  /**
   * @example
   * addArgument([ '-f', '--foo' ], { action: 'store', defaultValue: 1, ... })
   *
   * @example
   * addArgument([ 'bar' ], { action: 'store', nargs: 1, ... })
   *
   * @example
   * addArgument('--baz', { action: 'store', nargs: 1, ... })
   *
   * @param argsIn - The argument being added.
   * @param options - The configuration of the options.
   */
  addArgument (argsIn: string | Array<string>, options: Object = {}) {
    const args = typeof argsIn === 'string' ? [argsIn] : argsIn

    if (! Array.isArray(args)) {
      throw new TypeError('addArgument first argument should be a string or an array')
    }

    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('addArgument second argument should be a hash')
    }

    // if no positional args are supplied or only one is supplied and
    // it doesn't look like an option string, parse a positional argument
    if (! args || (args.length === 1 && this.prefixChars.indexOf(args[0][0]) < 0)) {
      if (args && !! options.dest) {
        throw new Error('dest supplied twice for positional argument')
      }
      options = this._getPositional(args, options)

      // otherwise, we're adding an optional argument
    }
    else {
      options = this._getOptional(args, options)
    }

    // if no default was supplied, use the parser-level default
    if (typeof options.defaultValue === 'undefined') {
      const dest = options.dest
      if (has(this._defaults, dest)) {
        options.defaultValue = this._defaults[dest]
      }
      else if (typeof this.argumentDefault !== 'undefined') {
        options.defaultValue = this.argumentDefault
      }
    }

    // create the action object, and add it to the parser
    const ActionClass = this._popActionClass(options)
    if (typeof ActionClass !== 'function') {
      throw new Error(format('Unknown action "%s".', ActionClass))
    }
    const action = new ActionClass(options)

    // throw an error if the action type is not callable
    const typeFunction = this._registryGet('type', action.type, action.type)
    if (typeof typeFunction !== 'function') {
      throw new Error(format('"%s" is not callable', typeFunction))
    }

    return this._addAction(action)
  }

  /**
   * @param options - TODO.
   */
  addArgumentGroup (options: any): ArgumentGroup {
    const group = new ArgumentGroup(this, options)
    this._actionGroups.push(group)
    return group
  }

  /**
   * @param options - TODO.
   */
  addMutuallyExclusiveGroup (options): MutuallyExclusiveGroup {
    const group = new MutuallyExclusiveGroup(this, options)
    this._mutuallyExclusiveGroups.push(group)
    return group
  }

  _addAction (action: Action): Action {
    // resolve any conflicts
    this._checkConflict(action)

    // add to actions list
    this._actions.push(action)
    action.container = this

    // index the action by any option strings it has
    action.optionStrings.forEach(optionString => {
      this._optionStringActions[optionString] = action
    })

    // set the flag if any option strings look like negative numbers
    action.optionStrings.forEach(optionString => {
      if (! optionString.match(this._regexpNegativeNumber)) return
      if (this._hasNegativeNumberOptionals.some(Boolean)) return
      this._hasNegativeNumberOptionals.push(true)
    })

    return action
  }

  _removeAction (action) {
    const actionIndex = this._actions.indexOf(action)
    if (actionIndex >= 0) {
      this._actions.splice(actionIndex, 1)
    }
  }

  _addContainerActions (container) {
    // collect groups by titles
    const titleGroupMap = {}
    this._actionGroups.forEach(function (group) {
      if (titleGroupMap[group.title]) {
        throw new Error(format('Cannot merge actions - two groups are named "%s".', group.title))
      }
      titleGroupMap[group.title] = group
    })

    // map each action to its group
    const groupMap = {}
    function actionHash (action) {
      // unique (hopefully?) string suitable as dictionary key
      return action.getName()
    }
    container._actionGroups.forEach(function (group) {
      // if a group with the title exists, use that, otherwise
      // create a new group matching the container's group
      if (! titleGroupMap[group.title]) {
        titleGroupMap[group.title] = this.addArgumentGroup({
          title: group.title,
          description: group.description,
        })
      }

      // map the actions to their new group
      group._groupActions.forEach(function (action) {
        groupMap[actionHash(action)] = titleGroupMap[group.title]
      })
    }, this)

    // add container's mutually exclusive groups
    // NOTE: if add_mutually_exclusive_group ever gains title= and
    // description= then this code will need to be expanded as above
    let mutexGroup
    container._mutuallyExclusiveGroups.forEach(function (group) {
      mutexGroup = this.addMutuallyExclusiveGroup({
        required: group.required,
      })
      // map the actions to their new mutex group
      group._groupActions.forEach(function (action) {
        groupMap[actionHash(action)] = mutexGroup
      })
    }, this)  // forEach takes a 'this' argument

    // add all actions to this container or their group
    container._actions.forEach(function (action) {
      const key = actionHash(action)
      if (groupMap[key]) {
        groupMap[key]._addAction(action)
      }
      else {
        this._addAction(action)
      }
    })
  }

  _getPositional (dest, options) {
    if (Array.isArray(dest)) {
      dest = dest[0]
    }
    // make sure required is not specified
    if (options.required) {
      throw new Error('"required" is an invalid argument for positionals.')
    }

    // mark positional arguments as required if at least one is
    // always required
    if (options.nargs !== c.OPTIONAL && options.nargs !== c.ZERO_OR_MORE) {
      options.required = true
    }
    if (options.nargs === c.ZERO_OR_MORE && typeof options.defaultValue === 'undefined') {
      options.required = true
    }

    // return the keyword arguments with no option strings
    options.dest = dest
    options.optionStrings = []
    return options
  }

  _getOptional (args, options) {
    const prefixChars = this.prefixChars
    const optionStrings = []
    const optionStringsLong = []

    // determine short and long option strings
    args.forEach(function (optionString) {
      // error on strings that don't start with an appropriate prefix
      if (prefixChars.indexOf(optionString[0]) < 0) {
        throw new Error(format('Invalid option string "%s": must start with a "%s".',
          optionString,
          prefixChars
        ))
      }

      // strings starting with two prefix characters are long options
      optionStrings.push(optionString)
      if (optionString.length > 1 && prefixChars.indexOf(optionString[1]) >= 0) {
        optionStringsLong.push(optionString)
      }
    })

    // infer dest, '--foo-bar' -> 'foo_bar' and '-x' -> 'x'
    let dest = options.dest || null
    delete options.dest

    if (! dest) {
      const optionStringDest = optionStringsLong.length ? optionStringsLong[0] : optionStrings[0]
      dest = trimChars(optionStringDest, this.prefixChars)

      if (dest.length === 0) {
        throw new Error(
          format('dest= is required for options like "%s"', optionStrings.join(', '))
        )
      }
      dest = dest.replace(/-/g, '_')
    }

    // return the updated keyword arguments
    options.dest = dest
    options.optionStrings = optionStrings

    return options
  }

  _popActionClass (options, defaultValue) {
    defaultValue = defaultValue || null

    const action = (options.action || defaultValue)
    delete options.action

    const actionClass = this._registryGet('action', action, action)
    return actionClass
  }

  _getHandler () {
    const handlerString = this.conflictHandler
    const handlerFuncName = '_handleConflict' + capitalize(handlerString)
    const func = this[handlerFuncName]
    if (typeof func === 'undefined') {
      const msg = 'invalid conflict resolution value: ' + handlerString
      throw new Error(msg)
    }
    else {
      return func
    }
  }

  _checkConflict (action) {
    const optionStringActions = this._optionStringActions
    const conflictOptionals = []

    // find all options that conflict with this option
    // collect pairs, the string, and an existing action that it conflicts with
    action.optionStrings.forEach(function (optionString) {
      const conflOptional = optionStringActions[optionString]
      if (typeof conflOptional !== 'undefined') {
        conflictOptionals.push([ optionString, conflOptional ])
      }
    })

    if (conflictOptionals.length > 0) {
      const conflictHandler = this._getHandler()
      conflictHandler.call(this, action, conflictOptionals)
    }
  }

  _handleConflictError (action, conflOptionals) {
    const conflicts = conflOptionals.map(pair => pair[0]).join(', ')
    throw argumentErrorHelper(
      action,
      format('Conflicting option string(s): %s', conflicts)
    )
  }

  _handleConflictResolve (action, conflOptionals) {
    // remove all conflicting options
    const self = this
    conflOptionals.forEach(function (pair) {
      const optionString = pair[0]
      const conflictingAction = pair[1]
      // remove the conflicting option string
      const i = conflictingAction.optionStrings.indexOf(optionString)
      if (i >= 0) {
        conflictingAction.optionStrings.splice(i, 1)
      }
      delete self._optionStringActions[optionString]
      // if the option now has no option string, remove it from the
      // container holding it
      if (conflictingAction.optionStrings.length === 0) {
        conflictingAction.container._removeAction(conflictingAction)
      }
    })
  }
}

const ArgumentGroup = makeArgumentGroup(ActionContainer)
const MutuallyExclusiveGroup = makeMutuallyExclusiveGroup(ActionContainer)

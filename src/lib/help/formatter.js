import { sprintf } from 'sprintf-js'

import { repeat, arrayEqual, trimChars } from '@/utils'
import c from '@/const'


/**
 * @action private
 * @param parent - Parent section.
 * @param heading - Header string.
 */
class Section {
  constructor (parent: Object, heading: string) {
    this._parent = parent
    this._heading = heading
    this._items = []
  }

  /**
   * Add function for single element.
   *
   * @param callback - Tuple with function and args.
   */
  addItem (callback) {
    this._items.push(callback)
  }

  /**
   * Form help section string.
   *
   * @access private
   * @param formatter - Current formatter.
   */
  formatHelp (formatter) {
    let itemHelp, heading

    // format the indented section
    if (this._parent) {
      formatter._indent()
    }

    itemHelp = this._items.map(function (item) {
      let obj, func, args

      obj = formatter
      func = item[0]
      args = item[1]
      return func.apply(obj, args)
    })
    itemHelp = formatter._joinParts(itemHelp)

    if (this._parent) {
      formatter._dedent()
    }

    // return nothing if the section was empty
    if (! itemHelp) {
      return ''
    }

    // add the heading if the section was non-empty
    heading = ''
    if (this._heading && this._heading !== c.SUPPRESS) {
      let currentIndent = formatter.currentIndent
      heading = repeat(' ', currentIndent) + this._heading + ':' + c.EOL
    }

    // join the section-initialize newline, the heading and the help
    return formatter._joinParts([ c.EOL, heading, itemHelp, c.EOL ])
  }
}

/**
 * Formatter for generating usage messages and argument help strings. Only the
 * name of this class is considered a public API. All the methods provided by
 * the class are considered an implementation detail.
 *
 * Do not call in your code, use this class only for inherits your own forvatter
 *
 * ToDo add [additonal formatters][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#formatter-class
 */
export default class HelpFormatter {
  /**
   * @param options - Config object.
   * @param options.prog - The program name.
   * @param options.indentIncriment - Indent step.
   * @param options.maxHelpPosition - Max help position.
   * @param options.width - Line width.
   */
  constructor (options) {
    options = options || {}

    this._prog = options.prog

    this._maxHelpPosition = options.maxHelpPosition || 24
    this._width = (options.width || ((process.env.COLUMNS || 80) - 2))

    this._currentIndent = 0
    this._indentIncriment = options.indentIncriment || 2
    this._level = 0
    this._actionMaxLength = 0

    this._rootSection = new Section(null)
    this._currentSection = this._rootSection

    this._whitespaceMatcher = new RegExp('\\s+', 'g')
    this._longBreakMatcher = new RegExp(c.EOL + c.EOL + c.EOL + '+', 'g')
  }

  _indent () {
    this._currentIndent += this._indentIncriment
    this._level += 1
  }

  _dedent () {
    this._currentIndent -= this._indentIncriment
    this._level -= 1
    if (this._currentIndent < 0) {
      throw new Error('Indent decreased below 0.')
    }
  }

  _addItem (func, args) {
    this._currentSection.addItem([ func, args ])
  }

  /**
   * Start new help section.
   *
   * @example
   * formatter.startSection(actionGroup.title)
   * formatter.addText(actionGroup.description)
   * formatter.addArguments(actionGroup._groupActions)
   * formatter.endSection()
   *
   * @param heading - The header string.
   */
  startSection (heading) {
    this._indent()
    let section = new Section(this._currentSection, heading)
    let func = section.formatHelp.bind(section)
    this._addItem(func, [ this ])
    this._currentSection = section
  }

  /**
   * End help section.
   *
   * @example
   * formatter.startSection(actionGroup.title)
   * formatter.addText(actionGroup.description)
   * formatter.addArguments(actionGroup._groupActions)
   * formatter.endSection()
   */
  endSection () {
    this._currentSection = this._currentSection._parent
    this._dedent()
  }

  /**
   * Add plain text into current section.
   *
   * @example
   * formatter.startSection(actionGroup.title)
   * formatter.addText(actionGroup.description)
   * formatter.addArguments(actionGroup._groupActions)
   * formatter.endSection()
   *
   * @param text - The text being added.
   */
  addText (text: string) {
    if (text && text !== c.SUPPRESS) {
      this._addItem(this._formatText, [ text ])
    }
  }

  /**
   * Add usage data into current section.
   *
   * @example
   * formatter.addUsage(this.usage, this._actions, [])
   * return formatter.formatHelp()
   *
   * @param usage - Usage text.
   * @param actions - Actions list.
   * @param groups - Groups list.
   * @param prefix - Usage prefix.
   *
   */
  addUsage (usage: string, actions: Array<any>, groups: Array<any>, prefix: string) {
    if (usage !== c.SUPPRESS) {
      this._addItem(this._formatUsage, [ usage, actions, groups, prefix ])
    }
  }

  /**
   * Add argument into current section.
   *
   * @param action - The action being added.
   */
  addArgument (action) {
    if (action.help !== c.SUPPRESS) {
      // find all invocations
      let invocations = [ this._formatActionInvocation(action) ]
      let invocationLength = invocations[0].length

      let actionLength

      if (action._getSubactions) {
        this._indent()
        action._getSubactions().forEach((subaction) => {
          let invocationNew = this._formatActionInvocation(subaction)
          invocations.push(invocationNew)
          invocationLength = Math.max(invocationLength, invocationNew.length)
        })
        this._dedent()
      }

      // update the maximum item length
      actionLength = invocationLength + this._currentIndent
      this._actionMaxLength = Math.max(this._actionMaxLength, actionLength)

      // add the item to the list
      this._addItem(this._formatAction, [ action ])
    }
  }

  /**
   * Mass add arguments into current section.
   *
   * @example
   * formatter.startSection(actionGroup.title)
   * formatter.addText(actionGroup.description)
   * formatter.addArguments(actionGroup._groupActions)
   * formatter.endSection()
   *
   * @param actions - An actions list.
   */
  addArguments (actions) {
    actions.forEach((action) => {
      this.addArgument(action)
    })
  }

  /**
   * Format help.
   */
  formatHelp () {
    let help = this._rootSection.formatHelp(this)
    if (help) {
      help = help.replace(this._longBreakMatcher, c.EOL + c.EOL)
      help = trimChars(help, c.EOL) + c.EOL
    }
    return help
  }

  _joinParts (partStrings) {
    return partStrings.filter(function (part) {
      return (part && part !== c.SUPPRESS)
    }).join('')
  }

  _formatUsage (usage, actions, groups, prefix) {
    if (! prefix && typeof prefix !== 'string') {
      prefix = 'usage: '
    }

    actions = actions || []
    groups = groups || []


    // if usage is specified, use that
    if (usage) {
      usage = sprintf(usage, { prog: this._prog })
    }
    // if no optionals or positionals are available, usage is just prog
    else if (! usage && actions.length === 0) {
      usage = this._prog
    }
    // if optionals and positionals are available, calculate usage
    else if (! usage) {
      let prog = this._prog
      let optionals = []
      let positionals = []
      let actionUsage
      let textWidth

      // split optionals from positionals
      actions.forEach(function (action) {
        if (action.isOptional()) {
          optionals.push(action)
        }
        else {
          positionals.push(action)
        }
      })

      // build full usage string
      actionUsage = this._formatActionsUsage([].concat(optionals, positionals), groups)
      usage = [ prog, actionUsage ].join(' ')

      // wrap the usage parts if it's too long
      textWidth = this._width - this._currentIndent
      if ((prefix.length + usage.length) > textWidth) {
        // break usage into wrappable parts
        let regexpPart = new RegExp('\\(.*?\\)+|\\[.*?\\]+|\\S+', 'g')
        let optionalUsage = this._formatActionsUsage(optionals, groups)
        let positionalUsage = this._formatActionsUsage(positionals, groups)


        let optionalParts = optionalUsage.match(regexpPart)
        let positionalParts = positionalUsage.match(regexpPart) || []

        if (optionalParts.join(' ') !== optionalUsage) {
          throw new Error('assert "optionalParts.join(\' \') === optionalUsage"')
        }
        if (positionalParts.join(' ') !== positionalUsage) {
          throw new Error('assert "positionalParts.join(\' \') === positionalUsage"')
        }

        // helper for wrapping lines
        let getLines = function (parts, indent, prefix) {
          let lines = []
          let line = []

          let lineLength = prefix ? prefix.length - 1 : indent.length - 1

          parts.forEach(function (part) {
            if (lineLength + 1 + part.length > textWidth) {
              lines.push(indent + line.join(' '))
              line = []
              lineLength = indent.length - 1
            }
            line.push(part)
            lineLength += part.length + 1
          })

          if (line) {
            lines.push(indent + line.join(' '))
          }
          if (prefix) {
            lines[0] = lines[0].substr(indent.length)
          }
          return lines
        }

        let lines, indent, parts
        // if prog is short, follow it with optionals or positionals
        if (prefix.length + prog.length <= 0.75 * textWidth) {
          indent = repeat(' ', (prefix.length + prog.length + 1))
          if (optionalParts) {
            lines = [].concat(
              getLines([ prog ].concat(optionalParts), indent, prefix),
              getLines(positionalParts, indent)
            )
          }
          else if (positionalParts) {
            lines = getLines([ prog ].concat(positionalParts), indent, prefix)
          }
          else {
            lines = [ prog ]
          }
        }
        // if prog is long, put it on its own line
        else {
          indent = repeat(' ', prefix.length)
          parts = optionalParts + positionalParts
          lines = getLines(parts, indent)
          if (lines.length > 1) {
            lines = [].concat(
              getLines(optionalParts, indent),
              getLines(positionalParts, indent)
            )
          }
          lines = [ prog ] + lines
        }
        // join lines into usage
        usage = lines.join(c.EOL)
      }
    }

    // prefix with 'usage:'
    return prefix + usage + c.EOL + c.EOL
  }

  _formatActionsUsage (actions, groups) {
    // find group indices and identify actions in groups
    let groupActions = []
    let inserts = []

    groups.forEach((group) => {
      const start = actions.indexOf(group._groupActions[0])
      if (start >= 0) {
        const end = start + group._groupActions.length

        if (arrayEqual(actions.slice(start, end), group._groupActions)) {
          group._groupActions.forEach(function (action) {
            groupActions.push(action)
          })

          if (! group.required) {
            if (inserts[start]) {
              inserts[start] += ' ['
            }
            else {
              inserts[start] = '['
            }
            inserts[end] = ']'
          }
          else {
            if (inserts[start]) {
              inserts[start] += ' ('
            }
            else {
              inserts[start] = '('
            }
            inserts[end] = ')'
          }
          for (let i = start + 1; i < end; i += 1) {
            inserts[i] = '|'
          }
        }
      }
    })

    // collect all actions format strings
    const parts = []

    actions.forEach((action, actionIndex) => {
      let part, optionString, argsDefault, argsString

      // suppressed arguments are marked with None
      // remove | separators for suppressed arguments
      if (action.help === c.SUPPRESS) {
        parts.push(null)
        if (inserts[actionIndex] === '|') {
          inserts.splice(actionIndex, actionIndex)
        }
        else if (inserts[actionIndex + 1] === '|') {
          inserts.splice(actionIndex + 1, actionIndex + 1)
        }

        // produce all arg strings
      }
      else if (! action.isOptional()) {
        part = this._formatArgs(action, action.dest)

        // if it's in a group, strip the outer []
        if (groupActions.indexOf(action) >= 0) {
          if (part[0] === '[' && part[part.length - 1] === ']') {
            part = part.slice(1, -1)
          }
        }
        // add the action string to the list
        parts.push(part)

      // produce the first way to invoke the option in brackets
      }
      else {
        optionString = action.optionStrings[0]

        // if the Optional doesn't take a value, format is: -s or --long
        if (action.nargs === 0) {
          part = '' + optionString
        }
        // if the Optional takes a value, format is: -s ARGS or --long ARGS
        else {
          argsDefault = action.dest.toUpperCase()
          argsString = this._formatArgs(action, argsDefault)
          part = optionString + ' ' + argsString
        }
        // make it look optional if it's not required or in a group
        if (! action.required && groupActions.indexOf(action) < 0) {
          part = '[' + part + ']'
        }
        // add the action string to the list
        parts.push(part)
      }
    })

    // insert things at the necessary indices
    for (var i = inserts.length - 1; i >= 0; --i) {
      if (inserts[i] !== null) {
        parts.splice(i, 0, inserts[i])
      }
    }

    // join all the action items with spaces
    let text = parts.filter(function (part) {
      return !! part
    }).join(' ')

    // clean up separators for mutually exclusive groups
    // remove spaces
    text = text.replace(/([[(]) /g, '$1')
    text = text.replace(/ ([\])])/g, '$1')
    // remove empty groups
    text = text.replace(/\[ *\]/g, '')
    text = text.replace(/\( *\)/g, '')
    // remove () from single action groups
    text = text.replace(/\(([^|]*)\)/g, '$1')

    return text.trim()
  }

  _formatText (rawText) {
    const text = sprintf(rawText, { prog: this._prog })
    const textWidth = this._width - this._currentIndent
    const indentIncriment = repeat(' ', this._currentIndent)
    return this._fillText(text, textWidth, indentIncriment) + c.EOL + c.EOL
  }

  _formatAction (action) {
    let helpText, helpLines, parts, indentFirst

    // determine the required width and the entry label
    const helpPosition = Math.min(this._actionMaxLength + 2, this._maxHelpPosition)
    const helpWidth = this._width - helpPosition
    const actionWidth = helpPosition - this._currentIndent - 2
    let actionHeader = this._formatActionInvocation(action)

    // no help; start on same line and add a final newline
    if (! action.help) {
      actionHeader = repeat(' ', this._currentIndent) + actionHeader + c.EOL
    }
    // short action name; start on the same line and pad two spaces
    else if (actionHeader.length <= actionWidth) {
      const indent = repeat(' ', this._currentIndent)
      const padding = repeat(' ', actionWidth - actionHeader.length)
      actionHeader = `${indent}${actionHeader}  ${padding}`
      indentFirst = 0
    }
    // long action name; start on the next line
    else {
      actionHeader = repeat(' ', this._currentIndent) + actionHeader + c.EOL
      indentFirst = helpPosition
    }

    // collect the pieces of the action help
    parts = [ actionHeader ]

    // if there was help for the action, add lines of help text
    if (action.help) {
      helpText = this._expandHelp(action)
      helpLines = this._splitLines(helpText, helpWidth)
      parts.push(repeat(' ', indentFirst) + helpLines[0] + c.EOL)
      helpLines.slice(1).forEach(function (line) {
        parts.push(repeat(' ', helpPosition) + line + c.EOL)
      })
    }
    // or add a newline if the description doesn't end with one
    else if (actionHeader.charAt(actionHeader.length - 1) !== c.EOL) {
      parts.push(c.EOL)
    }
    // if there are any sub-actions, add their help as well
    if (action._getSubactions) {
      this._indent()
      action._getSubactions().forEach((subaction) => {
        parts.push(this._formatAction(subaction))
      })
      this._dedent()
    }
    // return a single string
    return this._joinParts(parts)
  }

  _formatActionInvocation (action) {
    if (! action.isOptional()) {
      const formatFn = this._metavarFormatter(action, action.dest)
      const metavars = formatFn(1)
      return metavars[0]
    }

    let parts = []
    let argsDefault
    let argsString

    // if the Optional doesn't take a value, format is: -s, --long
    if (action.nargs === 0) {
      parts = parts.concat(action.optionStrings)
    }
    // if the Optional takes a value, format is: -s ARGS, --long ARGS
    else {
      argsDefault = action.dest.toUpperCase()
      argsString = this._formatArgs(action, argsDefault)
      action.optionStrings.forEach(function (optionString) {
        parts.push(optionString + ' ' + argsString)
      })
    }
    return parts.join(', ')
  }

  _metavarFormatter (action, metavarDefault) {
    let result

    if (action.metavar || action.metavar === '') {
      result = action.metavar
    }
    else if (action.choices) {
      let choices = action.choices

      if (typeof choices === 'string') {
        choices = choices.split('').join(', ')
      }
      else if (Array.isArray(choices)) {
        choices = choices.join(',')
      }
      else {
        choices = Object.keys(choices).join(',')
      }
      result = '{' + choices + '}'
    }
    else {
      result = metavarDefault
    }

    return size => {
      if (Array.isArray(result)) return result

      const metavars = []
      for (var i = 0; i < size; i += 1) {
        metavars.push(result)
      }
      return metavars
    }
  }

  _formatArgs (action, metavarDefault) {
    let result, metavars
    const buildMetavar = this._metavarFormatter(action, metavarDefault)

    switch (action.nargs) {
      case undefined:
      case null:
        metavars = buildMetavar(1)
        result = '' + metavars[0]
        break
      case c.OPTIONAL:
        metavars = buildMetavar(1)
        result = '[' + metavars[0] + ']'
        break
      case c.ZERO_OR_MORE:
        metavars = buildMetavar(2)
        result = '[' + metavars[0] + ' [' + metavars[1] + ' ...]]'
        break
      case c.ONE_OR_MORE:
        metavars = buildMetavar(2)
        result = '' + metavars[0] + ' [' + metavars[1] + ' ...]'
        break
      case c.REMAINDER:
        result = '...'
        break
      case c.PARSER:
        metavars = buildMetavar(1)
        result = metavars[0] + ' ...'
        break
      default:
        metavars = buildMetavar(action.nargs)
        result = metavars.join(' ')
    }
    return result
  }

  _expandHelp (action) {
    let params = { prog: this._prog }

    for (const actionProperty of Object.keys(action)) {
      let actionValue = action[actionProperty]

      if (actionValue !== c.SUPPRESS) {
        params[actionProperty] = actionValue
      }
    }

    if (params.choices) {
      if (typeof params.choices === 'string') {
        params.choices = params.choices.split('').join(', ')
      }
      else if (Array.isArray(params.choices)) {
        params.choices = params.choices.join(', ')
      }
      else {
        params.choices = Object.keys(params.choices).join(', ')
      }
    }

    return sprintf(this._getHelpString(action), params)
  }

  _splitLines (text, width) {
    let lines = []
    let delimiters = [ ' ', '.', ',', '!', '?' ]
    let re = new RegExp('[' + delimiters.join('') + '][^' + delimiters.join('') + ']*$')

    text = text.replace(/[\n|\t]/g, ' ')

    text = text.trim()
    text = text.replace(this._whitespaceMatcher, ' ')

    // Wraps the single paragraph in text (a string) so every line
    // is at most width characters long.
    text.split(c.EOL).forEach(function (line) {
      if (width >= line.length) {
        lines.push(line)
        return
      }

      let wrapStart = 0
      let wrapEnd = width
      let delimiterIndex = 0
      while (wrapEnd <= line.length) {
        if (wrapEnd !== line.length && delimiters.indexOf(line[wrapEnd] < -1)) {
          delimiterIndex = (re.exec(line.substring(wrapStart, wrapEnd)) || {}).index
          wrapEnd = wrapStart + delimiterIndex + 1
        }
        lines.push(line.substring(wrapStart, wrapEnd))
        wrapStart = wrapEnd
        wrapEnd += width
      }
      if (wrapStart < line.length) {
        lines.push(line.substring(wrapStart, wrapEnd))
      }
    })

    return lines
  }

  _fillText (text, width, indent) {
    let lines = this._splitLines(text, width)
    lines = lines.map(function (line) {
      return indent + line
    })
    return lines.join(c.EOL)
  }

  _getHelpString (action) {
    return action.help
  }
}

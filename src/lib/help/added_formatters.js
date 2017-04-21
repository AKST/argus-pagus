import HelpFormatter from '@/help/formatter'
import { trimEnd } from '@/utils'
import c from '@/const'

/**
 * new RawDescriptionHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
 *
 * Help message formatter which adds default values to argument help.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

export class ArgumentDefaultsHelpFormatter extends HelpFormatter {
  _getHelpString (action) {
    let help = action.help
    if (action.help.indexOf('%(defaultValue)s') === -1) {
      if (action.defaultValue !== c.SUPPRESS) {
        let defaultingNargs = [ c.OPTIONAL, c.ZERO_OR_MORE ]
        if (action.isOptional() || (defaultingNargs.indexOf(action.nargs) >= 0)) {
          help += ' (default: %(defaultValue)s)'
        }
      }
    }
    return help
  }
}

/**
 * new RawDescriptionHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
 *
 * Help message formatter which retains any formatting in descriptions.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

export class RawDescriptionHelpFormatter extends HelpFormatter {
  _fillText (text, width, indent) {
    let lines = text.split('\n')
    lines = lines.map(function (line) {
      return trimEnd(indent + line)
    })
    return lines.join('\n')
  }
}

/**
 * new RawTextHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawTextHelpFormatter, ...})
 *
 * Help message formatter which retains formatting of all help text.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

export class RawTextHelpFormatter extends HelpFormatter {
  _splitLines (text) {
    return text.split('\n')
  }
}

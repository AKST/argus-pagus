const exports = {
  EOL: '\n',
  SUPPRESS: '==SUPPRESS==',
  OPTIONAL: '?',
  ZERO_OR_MORE: '*',
  ONE_OR_MORE: '+',
  PARSER: 'A...',
  REMAINDER: '...',
  _UNRECOGNIZED_ARGS_ATTR: '_unrecognized_args',
  HELP_FLAG: Symbol('HELP_FLAG'),
  VERS_FLAG: Symbol('VERSION_FLAG')
}

export const EOL = exports.EOL
export const PARSER = exports.PARSER
export const SUPPRESS = exports.SUPPRESS
export const OPTIONAL = exports.OPTIONAL
export const REMAINDER = exports.REMAINDER
export const ZERO_OR_MORE = exports.ZERO_OR_MORE
export const ONE_OR_MORE = exports.ONE_OR_MORE
export const _UNRECOGNIZED_ARGS_ATTR = exports._UNRECOGNIZED_ARGS_ATTR
export const HELP_FLAG = exports.HELP_FLAG
export const VERS_FLAG = exports.VERS_FLAG

export default exports

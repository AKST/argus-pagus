// @flow
const _exports = {
  EOL: '\n',
  SUPPRESS: '==SUPPRESS==',
  OPTIONAL: '?',
  ZERO_OR_MORE: '*',
  ONE_OR_MORE: '+',
  PARSER: 'A...',
  REMAINDER: '...',
  _UNRECOGNIZED_ARGS_ATTR: '_unrecognized_args',
  HELP_FLAG: Symbol('HELP_FLAG'),
  VERS_FLAG: Symbol('VERSION_FLAG'),
}

export const EOL = _exports.EOL
export const PARSER = _exports.PARSER
export const SUPPRESS = _exports.SUPPRESS
export const OPTIONAL = _exports.OPTIONAL
export const REMAINDER = _exports.REMAINDER
export const ZERO_OR_MORE = _exports.ZERO_OR_MORE
export const ONE_OR_MORE = _exports.ONE_OR_MORE
export const _UNRECOGNIZED_ARGS_ATTR = _exports._UNRECOGNIZED_ARGS_ATTR
export const HELP_FLAG = _exports.HELP_FLAG
export const VERS_FLAG = _exports.VERS_FLAG

export default _exports

const ERR_CODE = 'ARGError'

/**
 * Error format helper. An error from creating or using an argument
 * (optional or positional). The string value of this exception
 * is the message, augmented with information
 * about the argument that caused it.
 *
 * @example
 * var argumentErrorHelper = require('./argument/error')
 *
 * if (conflictOptionals.length > 0) {
 *   throw argumentErrorHelper(
 *     action,
 *     format('Conflicting option string(s): %s', conflictOptionals.join(', '))
 *   )
 * }
 *
 * @param argument - Action with broken argument.
 * @param message - The error message.
 */
export default function (argument: Object, message: string): TypeError {
  const argumentName =
    argument.getName ? argument.getName() : `${argument}`

  const errMessage = ! argumentName
    ? message
    : `argument "${argumentName}": ${message}'`

  const err = new TypeError(errMessage)
  err.code = ERR_CODE
  return err
}

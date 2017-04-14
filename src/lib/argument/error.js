import { format } from 'util';


const ERR_CODE = 'ARGError';

/*:nodoc:*
 * argumentError(argument, message) -> TypeError
 * - argument (Object): action with broken argument
 * - message (String): error message
 *
 * Error format helper. An error from creating or using an argument
 * (optional or positional). The string value of this exception
 * is the message, augmented with information
 * about the argument that caused it.
 *
 * #####Example
 *
 *      var argumentErrorHelper = require('./argument/error');
 *      if (conflictOptionals.length > 0) {
 *        throw argumentErrorHelper(
 *          action,
 *          format('Conflicting option string(s): %s', conflictOptionals.join(', '))
 *        );
 *      }
 *
 **/
export default function (argument, message) {
  const argumentName =
    argument.getName ? argument.getName() : `${argument}`;

  const errMessage =
    !argumentName ? message : `argument "${argumentName}": ${message}'`;

  const err = new TypeError(errMessage);
  err.code = ERR_CODE;
  return err;
};

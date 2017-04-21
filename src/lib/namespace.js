/**
 * Simple object for storing attributes. Implements equality by attribute names
 * and values, and provides a simple string representation.
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#the-namespace-object
 */
import { has, extend as assign } from '@/utils'

/**
 * Simple object for storing attributes. Implements equality by attribute names
 * and values, and provides a simple string representation.
 */
export default class Namespace {
  /**
   * @param options - The options being set.
   */
  constructor (options) {
    assign(this, options)
  }

  /**
   * Tells whenever `namespace` contains given `key` or not.
   *
   * @param key - The check being checked.
   */
  isset (key) {
    return has(this, key)
  }

  /**
   * Set the property named key with value. If key object then set
   * all key properties to namespace object.
   *
   * @param key - The key being set.
   * @param value - The value being set.
   */
  set (key, value) {
    if (typeof (key) === 'object') {
      assign(this, key)
    }
    else {
      this[key] = value
    }
    return this
  }

  /**
   * Return the property key or defaulValue if not set.
   *
   * @param key - The key being get.
   * @param defaultValue - The default if missing.
   */
  get (key, defaultValue) {
    return ! this[key] ? defaultValue : this[key]
  }

  /**
   * Return data[key] (and delete it) or defaultValue.
   *
   * @param key - The key being unset.
   * @param defaultValue - The default if missing.
   */
  unset (key, defaultValue) {
    let value = this[key]
    if (value !== null) {
      delete this[key]
      return value
    }
    return defaultValue
  }
}

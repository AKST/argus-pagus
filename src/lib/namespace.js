/**
 * class Namespace
 *
 * Simple object for storing attributes. Implements equality by attribute names
 * and values, and provides a simple string representation.
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#the-namespace-object
 **/
import { has, extend as assign } from '@/utils';

/**
 * new Namespace(options)
 * - options(object): predefined propertis for result object
 *
 **/
export default class Namespace {
  constructor(options) {
    assign(this, options);
  }

  /**
   * Namespace#isset(key) -> Boolean
   * - key (string|number): property name
   *
   * Tells whenever `namespace` contains given `key` or not.
   **/
  isset(key) {
    return has(this, key);
  };

  /**
   * Namespace#set(key, value) -> self
   * -key (string|number|object): propery name
   * -value (mixed): new property value
   *
   * Set the property named key with value.
   * If key object then set all key properties to namespace object
   **/
  set(key, value) {
    if (typeof (key) === 'object') {
      $$.extend(this, key);
    } else {
      this[key] = value;
    }
    return this;
  };

  /**
   * Namespace#get(key, defaultValue) -> mixed
   * - key (string|number): property name
   * - defaultValue (mixed): default value
   *
   * Return the property key or defaulValue if not set
   **/
  get(key, defaultValue) {
    return !this[key] ? defaultValue : this[key];
  };

  /**
   * Namespace#unset(key, defaultValue) -> mixed
   * - key (string|number): property name
   * - defaultValue (mixed): default value
   *
   * Return data[key](and delete it) or defaultValue
   **/
  unset(key, defaultValue) {
    var value = this[key];
    if (value !== null) {
      delete this[key];
      return value;
    }
    return defaultValue;
  };
}

import type ArgumentParser from '@/argument_parser'
import type Namespace from '@/namespace'
import Action from '@/action/base'
import c from '@/const'


/**
 * This action stores a list, and appends each argument value
 * to the list. This is useful to allow an option to be
 * specified multiple times.
 */
export default class ActionAppend extends Action {
  constructor (options: Object = {}) {
    super(options)
    if (options.nargs <= 0) {
      throw new Error('nargs for append actions must be > 0; if arg ' +
          'strings are not supplying the value to append, ' +
          'the append const action may be more appropriate')
    }
    if (!! options.constant && options.nargs !== c.OPTIONAL) {
      throw new Error('nargs must be OPTIONAL to supply const')
    }
  }

  call (parser: ArgumentParser, namespace: Namespace, values: Array<any>) {
    var items = (namespace[this.dest] || []).slice()
    items.push(values)
    namespace.set(this.dest, items)
  }
}

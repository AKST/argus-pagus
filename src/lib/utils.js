// @flow

type Predicate<A, B> = (a: A, b: B) => boolean
type CountCont = Predicate<number, number>

class Counter {
  _pos: number
  _end: number
  _step: number
  _cont: CountCont

  constructor (from: number, to: number, step: number, predicate: CountCont) {
    this._pos = from
    this._end = to
    this._step = step
    this._cont = predicate
  }

  next (): { done: boolean, value?: number } {
    if (! this._cont(this._pos, this._end)) return { done: true }
    const value = this._pos
    this._pos += this._step
    return { done: false, value }
  }

  /*::
  @@iterator(): Iterator<number> {
    throw new Error()
  }*/

  /**
   * An iterator for the stream
   */
  // $FlowTodo: https://github.com/facebook/flow/issues/2286
  [Symbol.iterator] () {
    return this
  }
}

export function range (from: number, to: number, step: ?number): Iterable<number> {
  if (from === to) return []
  else if (from < to) {
    const stepCalc = step == null ? 1 : step
    if (stepCalc < 1) throw new TypeError('invalid step')
    return new Counter(from, to, stepCalc, (a, b) => a < b)
  }
  else {
    const stepCalc = step == null ? -1 : step
    if (stepCalc > -1) throw new TypeError('invalid step')
    return new Counter(from, to, stepCalc, (a, b) => a > b)
  }
}

export function repeat (string: string, times: number): string {
  if (times < 0) throw new Error('times cannot be less than 0')
  let it = 0
  let acc = ''

  while (it++ < times) acc += string
  return acc
}

export function arrayEqual<A> (a: Array<A>, b: Array<A>): boolean {
  if (a.length !== b.length) return false

  for (const i of range(0, a.length)) {
    if (a[i] !== b[i]) return false
  }

  return true
}

export function deepKeys (object: Object): Iterable<string> {
  return Object.getOwnPropertyNames(object)
}

export function trimChars (str: string, chars: Array<string>): string {
  let sIndex = 0
  let eIndex = str.length - 1

  while (chars.indexOf(str.charAt(sIndex)) >= 0) sIndex += 1
  while (chars.indexOf(str.charAt(eIndex)) >= 0) eIndex -= 1
  return str.slice(sIndex, eIndex + 1)
}

export function trimEnd (str: string): string {
  return str.replace(/\s+$/g, '')
}

export function capitalize (str: string): string {
  const head = str.charAt(0).toUpperCase()
  const tail = str.slice(1)
  return `${head}${tail}`
}

export function arrayUnion<A> (...args: Array<Array<A>>): Array<A> {
  const result = []
  const known = new Set()

  for (const i of range(0, args.length)) {
    const subArray = args[i]

    for (const j of range(0, subArray.length)) {
      const value = subArray[j]

      if (! known.has(value)) {
        result.push(value)
        known.add(value)
      }
    }
  }

  return result
}

export function has (object: Object, key: string): boolean {
  return object.hasOwnProperty(key)
}

export function extend<A: Object, B> (dest: B, src: ?A) {
  if (src == null) return
  Object.assign(dest, src)
}

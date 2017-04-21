export function repeat (str, num) {
  let result = ''
  for (let i = 0; i < num; i++) result += str
  return result
}

export function arrayEqual (a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function trimChars (str, chars) {
  let start = 0
  let end = str.length - 1
  while (chars.indexOf(str.charAt(start)) >= 0) start++
  while (chars.indexOf(str.charAt(end)) >= 0) end--
  return str.slice(start, end + 1)
}

export function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function arrayUnion () {
  const result = []
  for (let i = 0, values = {}; i < arguments.length; i++) {
    let arr = arguments[i]
    for (let j = 0; j < arr.length; j++) {
      if (! values[arr[j]]) {
        values[arr[j]] = true
        result.push(arr[j])
      }
    }
  }
  return result
}

export function has (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export function extend (dest, src) {
  for (const i in src) {
    if (has(src, i)) dest[i] = src[i]
  }
}

export function trimEnd (str) {
  return str.replace(/\s+$/g, '')
}

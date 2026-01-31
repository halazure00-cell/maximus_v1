const listeners = new Set()

export const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const emit = (event) => {
  listeners.forEach((listener) => listener(event))
}

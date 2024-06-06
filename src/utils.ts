import { type Writable, writable } from "svelte/store"

export function hashRouter<T extends string[]>(routes: T): Writable<T[number]> {
  let initial = routes.find((val) => window.location.hash === val)
  if (!initial) {
    initial = routes[0]
  }
  const current = writable<T[number]>(initial)
  current.subscribe((route) => {
    window.location.hash = route
  })
  return current
}


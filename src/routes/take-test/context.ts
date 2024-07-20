import type { Writable } from "svelte/store"

export type Context = Writable<{
  withCorrections: boolean
  fromTestHistory: boolean
}>

export const contextSymbol = Symbol("take test context symbol")

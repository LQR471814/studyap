export type Context = {
    withCorrections: boolean
    testAttemptId: number
}

export const contextSymbol = Symbol("take test context symbol")


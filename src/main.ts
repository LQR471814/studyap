import "./global.css"
import App from "./App.svelte"

const app = new App({
  // biome-ignore lint/style/noNonNullAssertion: this is okay
  target: document.getElementById("app")!,
})

export default app

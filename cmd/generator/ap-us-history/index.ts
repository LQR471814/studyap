import esMain from "es-main"

export async function generate() {
  const subject = await import("./subject")
  const units = await import("./units")
  const stimuli = await import("./stimuli")
  const frqs = await import("./frq")
  const mcqs = await import("./mcq")
  return { ...subject, ...units, ...stimuli, ...frqs, ...mcqs }
}

if (esMain(import.meta)) {
  generate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

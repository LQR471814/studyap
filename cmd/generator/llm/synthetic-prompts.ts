function inlineUnitList(units: string[]): string {
  return units.map((unit) => `'${unit}'`).join(", ")
}

export namespace StimulusPrompts {
  /**
   * Natural language instructions telling the assistant what to do **SPECIFICALLY** to generate
   * a stimulus for a given unit(s) and in a given format.
   */
  export function instructions(units: string[]): string {
    return `For this stimulus:

1. Create it as context for a multiple choice or free response question.
2. Create it for the unit(s) ${inlineUnitList(units)}
3. Make sure to call the generate_stimulus function when you're done.`
  }

  /**
   * Natural language instructions telling the assistant to proceed with the same instruction
   * but generate a different stimulus.
   */
  export function continuation(units: string[]): string {
    return `Great! Now generate another one from a different source for a multiple choice or free response question, still pertaining to the following unit(s):

- ${units.join("\n- ")}`
  }
}

export namespace McqPrompts {
  /**
   * Natural language instructions telling the assistant what to do **SPECIFICALLY** to generate
   * an mcq for a given unit(s) and in a given format.
   */
  export function instructions(
    subject: string,
    units: string[],
    stimulus: string | null,
    answerCount: number,
  ): string {
    if (!stimulus) {
      return `Create a non-obvious multiple choice question that has exactly ${answerCount} answer(s) from the ${subject} unit(s): ${inlineUnitList(units)}`
    }
    return `Create a multiple choice question that may have a non-obvious connection with the following stimulus. It should have exactly ${answerCount} answer(s) and pull in external information from the ${subject} unit(s): ${inlineUnitList(units)}.

${stimulus}`
  }

  /**
   * Natural language instructions telling the assistant to proceed with the same instruction
   * but generate a different stimulus.
   */
  export function continuation(subject: string, units: string[], answerCount: number): string {
    return `Great! Now generate another non-obvious one still pertaining to the ${subject} units ${inlineUnitList(units)} and the aforementioned stimulus (if available). It should have exactly ${answerCount} answer(s).`
  }
}

export namespace FrqPrompts {
  /**
   * Natural language instructions telling the assistant what to do **SPECIFICALLY** to generate
   * an frq for a given unit(s) and in a given format.
   *
   * Ex. `"Create a free response question for the following stimulus pertaining to the unit '${unit}', make sure to call the generate_frq function."`
   */
  export function instructions(
    subject: string,
    units: string[],
    stimulus: string | null,
  ): string {
    if (!stimulus) {
      return `Create a non-obvious free response question from the ${subject} unit(s): ${inlineUnitList(units)}`
    }
    return `Create a free response question that may have a non-obvious connection with the following stimulus. It should pull in external information from the ${subject} unit(s): ${inlineUnitList(units)}

${stimulus}`
  }

  /**
   * Natural language instructions telling the assistant to proceed with the same instruction
   * but generate a different stimulus.
   *
   * Ex. `"Great! Now generate another one still pertaining to the unit '${unit}' and the aforementioned stimulus."`
   */
  export function continuation(subject: string, units: string[]): string {
    return `Great! Now generate another one still pertaining to the ${subject} unit(s) '${inlineUnitList(units)}' and the aforementioned stimulus (if available).`
  }
}

export function formatStimulus(
  text: string,
  imageAltText: string | null,
  attribution: string | null,
): string {
  const attributionSuffix = attribution
    ? `\n\nAttributed to: "${attribution}"`
    : ""
  if (imageAltText) {
    return `This is an image with the following description: ${imageAltText}${attributionSuffix}`
  }
  return `${text}${attributionSuffix}`
}

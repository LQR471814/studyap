import { stimulus, stimulusUnit } from "@/lib/schema/schema"
import {
  type Context,
  generateSubject,
  generateUnits,
  VERSION,
} from "./constants"
import { memo } from "@/lib/utils"

type Stimulus = {
  text?: string
  attribution?: string
  image?: boolean
  unitId?: number
}

export const generateStimuli = memo(async (ctx: Context) => {
  const SUBJECT = await generateSubject(ctx)
  const UNITS = await generateUnits(ctx)

  const { db } = ctx

  const stimuli: Stimulus[] = [
    {
      text: "With the [cotton gin], a single operator could clean as much cotton in a few hours as a group of workers had once needed a whole day to do . . . Soon cotton growing spread into the upland South and beyond, within a decade the total crop increased eightfold . . . The cotton gin not only changed the economy of the South, it also helped transform the North. The large supply of domestically produced fiber was a strong incentive to entrepreneurs in New England and elsewhere to develop an American textile industry.",
      attribution:
        "Alan Brinkley, American History: Connecting with the Past, 2014",
      image: false,
      unitId: UNITS[3].id,
    },
    {
      text: "With the [cotton gin], a single operator could clean as much cotton in a few hours as a group of workers had once needed a whole day to do . . . Soon cotton growing spread into the upland South and beyond, within a decade the total crop increased eightfold . . . The cotton gin not only changed the economy of the South, it also helped transform the North. The large supply of domestically produced fiber was a strong incentive to entrepreneurs in New England and elsewhere to develop an American textile industry.",
      attribution:
        "Alan Brinkley, American History: Connecting with the Past, 2014",
      image: false,
      unitId: UNITS[3].id,
    },
    {
      text: `ARTICLE 2. His Majesty consents to withdraw all his troops and garrisons from all posts and places within the boundary lines assigned by the treaty of peace to the United States. The evacuation is to take place on or before the 1st of June, 1796. All settlers in those parts to enjoy private property rights and become citizens of the United States in one year unless allegiance is declared to His Britannic Majesty.

ARTICLE 6. Gives to British subjects the power of recovering debts due to them by American citizens previous to the treaty of peace; which debts have not been recovered hitherto, on account of some legal impediments. The United States agree to make full and complete compensation to the creditors who have suffered by those impediments. The amount of the losses and damages is to be ascertained by five commissioners — two to be appointed by Great Britain, two by the President of the United States, and one by the other four.”`,
      attribution:
        "Treaty of Amity, Commerce, and Navigation (Jay’s Treaty), 1794",
      image: false,
      unitId: UNITS[2].id,
    },
    {
      text: `ARTICLE 2. His Majesty consents to withdraw all his troops and garrisons from all posts and places within the boundary lines assigned by the treaty of peace to the United States. The evacuation is to take place on or before the 1st of June, 1796. All settlers in those parts to enjoy private property rights and become citizens of the United States in one year unless allegiance is declared to His Britannic Majesty.

ARTICLE 6. Gives to British subjects the power of recovering debts due to them by American citizens previous to the treaty of peace; which debts have not been recovered hitherto, on account of some legal impediments. The United States agree to make full and complete compensation to the creditors who have suffered by those impediments. The amount of the losses and damages is to be ascertained by five commissioners — two to be appointed by Great Britain, two by the President of the United States, and one by the other four.”`,
      attribution:
        "Treaty of Amity, Commerce, and Navigation (Jay’s Treaty), 1794",
      image: false,
      unitId: UNITS[2].id,
    },
    {
      // image source: https://commons.wikimedia.org/wiki/File:National_Women%27s_Party_picketing_the_White_House.jpg
      text: "Photograph of fourteen suffragists in overcoats on picket line, holding suffrage banners in front of the White House. One banner reads: 'Mr. President How Long Must Women Wait For Liberty'. White House visible in background.",
      attribution: "Harris & Ewing",
      image: true,
      unitId: UNITS[6].id,
    },
    // an empty stimulus
    {},
  ]

  const STIMULI = await db
    .insert(stimulus)
    .values(
      stimuli.map((s) => ({
        content: s.text,
        attribution: s.attribution,
        subjectId: SUBJECT.id,
        version: VERSION,
      })),
    )
    .returning()

  await db.insert(stimulusUnit).values(
    STIMULI.filter((_, i) => stimuli[i].unitId !== undefined).map((s, i) => {
      return {
        stimulusId: s.id,
        // this should never happen!
        unitId: stimuli[i].unitId ?? -1,
      }
    }),
  )

  return STIMULI
})

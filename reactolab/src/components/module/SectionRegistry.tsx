"use client";

// Maps section types → components. Rendering order & lock state come from the
// engine; there is no clickable step navigation anywhere (INV-03).

import type { SectionDef } from "@/lib/module-defs";
import {
  ConclusionSection,
  HypoTestSection,
  HypothesisSection,
  OrientationSection,
  ProblemSection,
} from "./sections/InquirySections";
import ExperimentSection from "./sections/ExperimentSection";
import { M0Apersepsi, M0Missions, M0Welcome } from "./sections/Module0Sections";
import { M5Collision, M5Concept, M5Equation } from "./sections/Module5Sections";
import {
  M6Articles,
  M6CER,
  M6Conclusion,
  M6Decision,
  M6Forum,
  M6Intro,
} from "./sections/Module6Sections";
import { M7Closing } from "./sections/Module7Section";

export function renderSection(sec: SectionDef, readOnly: boolean) {
  const props = { sec, readOnly };
  switch (sec.type) {
    case "m0welcome":
      return <M0Welcome {...props} />;
    case "m0apersepsi":
      return <M0Apersepsi {...props} />;
    case "m0missions":
      return <M0Missions {...props} />;
    case "orientation":
      return <OrientationSection {...props} />;
    case "problem":
      return <ProblemSection {...props} />;
    case "hypothesis":
      return <HypothesisSection {...props} />;
    case "experiment":
      return <ExperimentSection {...props} />;
    case "hypotest":
      return <HypoTestSection {...props} />;
    case "conclusion":
      return <ConclusionSection {...props} />;
    case "m5concept":
      return <M5Concept {...props} />;
    case "m5equation":
      return <M5Equation {...props} />;
    case "m5collision":
      return <M5Collision {...props} />;
    case "m6intro":
      return <M6Intro {...props} />;
    case "m6articles":
      return <M6Articles {...props} />;
    case "m6cer":
      return <M6CER {...props} />;
    case "m6forum":
      return <M6Forum {...props} />;
    case "m6decision":
      return <M6Decision {...props} />;
    case "m6conclusion":
      return <M6Conclusion {...props} />;
    case "m7closing":
      return <M7Closing {...props} />;
    default:
      return null;
  }
}

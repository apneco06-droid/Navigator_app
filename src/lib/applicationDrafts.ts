import { BenefitProgram } from "../data/programs";
import { IntakeForm, Language, MatchResult } from "./matching";

export interface ApplicationDraftSection {
  title: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
}

export interface ApplicationDraft {
  id: string;
  program: BenefitProgram;
  title: string;
  office: string;
  summary: string;
  eligibility: string;
  deliveryLabel: string;
  actionHint: string;
  supportsOnline: boolean;
  supportsPrinting: boolean;
  sections: ApplicationDraftSection[];
}

export function buildApplicationDrafts(
  intake: IntakeForm,
  matches: MatchResult[],
): ApplicationDraft[] {
  return matches.slice(0, 4).map((match) => buildApplicationDraft(intake, match));
}

function buildApplicationDraft(intake: IntakeForm, match: MatchResult): ApplicationDraft {
  const language = intake.language;
  const { program } = match;

  return {
    id: program.id,
    program,
    title: language === "es" ? program.nameEs : program.name,
    office: language === "es" ? program.officeLabelEs : program.officeLabel,
    summary: language === "es" ? program.descriptionEs : program.description,
    eligibility: language === "es" ? program.eligibilityEs : program.eligibility,
    deliveryLabel: deliveryLabel(program.submissionMode, language),
    actionHint: actionHint(program.submissionMode, language),
    supportsOnline: program.submissionMode === "online" || program.submissionMode === "mixed",
    supportsPrinting: program.submissionMode === "print" || program.submissionMode === "office" || program.submissionMode === "mixed",
    sections: [
      {
        title: language === "es" ? "Elegibilidad" : "Eligibility",
        fields: [
          {
            label: language === "es" ? "Por que coincide" : "Why it fits",
            value: match.reasons.join(" "),
          },
          {
            label: language === "es" ? "Documentos necesarios" : "Documents needed",
            value: match.documentsNeeded.join(", "),
          },
          ...(match.missingFields.length > 0
            ? [
                {
                  label: language === "es" ? "Falta completar" : "Still needed",
                  value: match.missingFields.join(", "),
                },
              ]
            : []),
        ],
      },
    ],
  };
}

function deliveryLabel(mode: BenefitProgram["submissionMode"], language: Language) {
  const labels = {
    online: { en: "Online submission", es: "Solicitud en linea" },
    mixed: { en: "Online plus follow-up", es: "En linea con seguimiento" },
    office: { en: "Office or in-person filing", es: "Tramite en oficina o en persona" },
    print: { en: "Printable packet first", es: "Primero paquete imprimible" },
  };

  return labels[mode][language];
}

function actionHint(mode: BenefitProgram["submissionMode"], language: Language) {
  if (language === "es") {
    if (mode === "online") {
      return "Esta solicitud puede continuar directamente por el portal oficial.";
    }
    if (mode === "mixed") {
      return "Empieza en linea y preparate para entregar documentos o confirmar datos despues.";
    }
    if (mode === "office") {
      return "Lleva el paquete impreso o usa la informacion para la visita en oficina.";
    }
    return "Imprime o guarda el paquete en PDF antes de continuar.";
  }

  if (mode === "online") {
    return "This application can continue directly in the official portal.";
  }
  if (mode === "mixed") {
    return "Start online and be ready to upload documents or confirm details later.";
  }
  if (mode === "office") {
    return "Bring the printable packet or use this information during an office visit.";
  }
  return "Print or save the packet as a PDF before continuing.";
}

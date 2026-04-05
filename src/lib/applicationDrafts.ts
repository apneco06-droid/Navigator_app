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
        title: language === "es" ? "Informacion del solicitante" : "Applicant information",
        fields: [
          {
            label: language === "es" ? "Nombre completo" : "Full name",
            value: fullName(intake, language),
          },
          {
            label: language === "es" ? "Telefono" : "Phone",
            value: intake.phone.trim() || pending(language),
          },
          {
            label: language === "es" ? "Direccion" : "Address",
            value: intake.address.trim() || pending(language),
          },
          {
            label: language === "es" ? "Ciudad y region" : "City and region",
            value: `${intake.city || unknownCity(language)}, ${regionLabel(intake.region, language)}`,
          },
        ],
      },
      {
        title: language === "es" ? "Perfil del hogar" : "Household profile",
        fields: [
          {
            label: language === "es" ? "Tamano del hogar" : "Household size",
            value: intake.householdSize,
          },
          {
            label: language === "es" ? "Ingreso mensual estimado" : "Estimated monthly income",
            value: incomeLabel(intake.monthlyIncomeBand, language),
          },
          {
            label: language === "es" ? "Edad del solicitante" : "Applicant age band",
            value: ageLabel(intake.ageBand, language),
          },
          {
            label: language === "es" ? "Notas importantes" : "Important notes",
            value: intake.notes.trim() || none(language),
          },
        ],
      },
      {
        title: language === "es" ? "Puntos de elegibilidad" : "Eligibility notes",
        fields: [
          {
            label: language === "es" ? "Por que coincide" : "Why it matches",
            value: match.reasons.join(" "),
          },
          {
            label: language === "es" ? "Documentos para reunir" : "Documents to gather",
            value: match.documentsNeeded.join(", "),
          },
          {
            label: language === "es" ? "Falta completar" : "Still needed",
            value:
              match.missingFields.length > 0
                ? match.missingFields.join(", ")
                : language === "es"
                  ? "No faltan campos principales."
                  : "No major fields are missing.",
          },
        ],
      },
    ],
  };
}

function fullName(intake: IntakeForm, language: Language) {
  const name = `${intake.firstName} ${intake.lastName}`.trim();
  return name || (language === "es" ? "Pendiente" : "Pending");
}

function pending(language: Language) {
  return language === "es" ? "Pendiente" : "Pending";
}

function none(language: Language) {
  return language === "es" ? "Ninguna" : "None";
}

function unknownCity(language: Language) {
  return language === "es" ? "Ciudad desconocida" : "Unknown city";
}

function regionLabel(region: IntakeForm["region"], language: Language) {
  const labels = {
    texas: { en: "Texas", es: "Texas" },
    "new-mexico": { en: "New Mexico", es: "Nuevo Mexico" },
    mexico: { en: "Mexico support", es: "Apoyo de Mexico" },
  };

  return labels[region][language];
}

function ageLabel(ageBand: IntakeForm["ageBand"], language: Language) {
  const labels = {
    "under-18": { en: "Under 18", es: "Menor de 18" },
    "18-64": { en: "18 to 64", es: "18 a 64" },
    "65-plus": { en: "65 and older", es: "65 o mas" },
  };

  return labels[ageBand][language];
}

function incomeLabel(incomeBand: IntakeForm["monthlyIncomeBand"], language: Language) {
  const labels = {
    "under-1000": { en: "Under $1,000", es: "Menos de $1,000" },
    "1000-2000": { en: "$1,000 to $2,000", es: "$1,000 a $2,000" },
    "2000-3500": { en: "$2,000 to $3,500", es: "$2,000 a $3,500" },
    "3500-plus": { en: "$3,500 and up", es: "$3,500 o mas" },
  };

  return labels[incomeBand][language];
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

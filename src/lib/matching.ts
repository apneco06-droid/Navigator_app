import { eligibilityRules } from "../data/eligibilityRules";
import { BenefitProgram, Jurisdiction } from "../data/programs";

export type Language = "en" | "es";

export interface LocalizedText {
  en: string;
  es: string;
}

export interface IntakeForm {
  language: Language;
  firstName: string;
  lastName: string;
  middleName: string;
  city: string;
  region: "texas" | "new-mexico" | "mexico";
  ageBand: "under-18" | "18-64" | "65-plus";
  householdSize: string;
  monthlyIncomeBand:
    | "under-1000"
    | "1000-2000"
    | "2000-3500"
    | "3500-plus";
  hasDisability: boolean;
  pregnantOrPostpartum: boolean;
  childrenUnder5: boolean;
  childrenUnder19: boolean;
  needsHousingHelp: boolean;
  needsUtilityHelp: boolean;
  skipSensitiveInfo: boolean;
  address: string;
  phone: string;
  cellPhone: string;
  email: string;
  zipCode: string;
  county: string;
  dateOfBirth: string;
  socialSecurityNumber: string;
  spouseName: string;
  plansToFileTaxes: "yes" | "no" | "";
  filesJointly: "yes" | "no" | "";
  claimsDependents: "yes" | "no" | "";
  dependentNames: string;
  claimedAsDependent: "yes" | "no" | "";
  taxFilerName: string;
  taxRelationship: string;
  isVeteran: boolean;
  isActiveDuty: boolean;
  needsInterviewHelp: boolean;
  interviewHelpDetails: string;
  interviewLanguage: string;
  needsInterpreter: boolean;
  interpreterLanguage: string;
  preferredContactMethod: "phone" | "text" | "email" | "";
  notes: string;
  employmentStatus: "employed" | "unemployed" | "self-employed" | "not-seeking" | "";
  employerName: string;
  monthlyRent: string;
  currentInsurance: "none" | "private" | "medicaid" | "medicare" | "chip" | "";
  childrenNames: string;
  childDiagnosis: string;
  heatingType: "gas" | "electric" | "both" | "";
  lastUtilityBill: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
  missingFields: string[];
  documentsNeeded: string[];
  nextSteps: string[];
  program: BenefitProgram;
}

type LocalizedValue = string | LocalizedText;

type RuleContext = {
  intake: IntakeForm;
  regionJurisdiction: Jurisdiction;
  veryLowIncome: boolean;
  lowIncome: boolean;
  moderateIncome: boolean;
  hasChildren: boolean;
};

type RuleOutcome = Omit<MatchResult, "program">;

const localizedCategories: Record<string, LocalizedText> = {
  Food: { en: "Food", es: "Alimentos" },
  Health: { en: "Health", es: "Salud" },
  Income: { en: "Income", es: "Ingresos" },
  Utilities: { en: "Utilities", es: "Servicios" },
  Housing: { en: "Housing", es: "Vivienda" },
  Education: { en: "Education", es: "Educacion" },
  Disability: { en: "Disability", es: "Discapacidad" },
  Navigation: { en: "Navigation", es: "Orientacion" },
};

export function matchPrograms(
  intake: IntakeForm,
  allPrograms: BenefitProgram[],
): MatchResult[] {
  const context = buildContext(intake);

  return allPrograms
    .map((program) => evaluateProgram(program, context))
    .filter((result): result is MatchResult => result !== null)
    .sort((left, right) => right.score - left.score);
}

function buildContext(intake: IntakeForm): RuleContext {
  return {
    intake,
    regionJurisdiction: intake.region,
    veryLowIncome: intake.monthlyIncomeBand === "under-1000",
    lowIncome:
      intake.monthlyIncomeBand === "under-1000" ||
      intake.monthlyIncomeBand === "1000-2000",
    moderateIncome: intake.monthlyIncomeBand === "2000-3500",
    hasChildren: intake.childrenUnder19 || intake.childrenUnder5,
  };
}

function evaluateProgram(
  program: BenefitProgram,
  context: RuleContext,
): MatchResult | null {
  if (!isJurisdictionMatch(program, context)) {
    return null;
  }

  const outcome = ruleByProgramId[program.id]?.(context) ?? defaultRule(context, program);
  if (outcome.score <= 0) {
    return null;
  }

  return {
    ...outcome,
    program,
  };
}

function isJurisdictionMatch(program: BenefitProgram, context: RuleContext) {
  if (context.intake.region === "mexico") {
    return program.jurisdictions.includes("mexico");
  }

  return (
    program.jurisdictions.includes(context.regionJurisdiction) ||
    program.jurisdictions.includes("federal-us")
  );
}

function defaultRule(context: RuleContext, program: BenefitProgram): RuleOutcome {
  const reasons: LocalizedText[] = [];
  const nextSteps = buildBaseNextSteps(program, context.intake.language);

  let score = 0;
  if (context.lowIncome && program.fplPercent > 0) {
    score += 0.45;
    reasons.push({
      en: "The income estimate may fit the program range.",
      es: "La estimacion de ingresos puede estar dentro del rango del programa.",
    });
  }
  if (program.tags.includes("children") && context.hasChildren) {
    score += 0.2;
    reasons.push({
      en: "The household includes children.",
      es: "El hogar incluye ninos.",
    });
  }
  if (program.tags.includes("elderly") && context.intake.ageBand === "65-plus") {
    score += 0.2;
    reasons.push({
      en: "The applicant is in a senior age band.",
      es: "La persona solicitante esta en el grupo de adultos mayores.",
    });
  }
  if (program.tags.includes("disability") && context.intake.hasDisability) {
    score += 0.2;
    reasons.push({
      en: "The applicant reported a disability or chronic condition.",
      es: "La persona reporto una discapacidad o condicion cronica.",
    });
  }

  return {
    score,
    reasons: localizeList(reasons, context.intake.language),
    missingFields: buildMissingFields(context.intake),
    documentsNeeded: commonDocuments(program, context.intake.language),
    nextSteps,
  };
}

const ruleByProgramId: Record<string, (context: RuleContext) => RuleOutcome> = Object.fromEntries(
  Object.entries(eligibilityRules).map(([id, rule]) => [
    id,
    (context: RuleContext) =>
      outcomeFor(context, {
        score: rule.score(context.intake),
        reasons: rule.reasons(context.intake),
        documentsNeeded: rule.documentsNeeded,
      }),
  ]),
);

function outcomeFor(
  context: RuleContext,
  options: {
    score: number;
    reasons: LocalizedValue[];
    documentsNeeded: LocalizedValue[];
  },
): RuleOutcome {
  return {
    score: options.score,
    reasons:
      options.score > 0 ? enrichReasons(context, localizeList(options.reasons, context.intake.language)) : [],
    missingFields: options.score > 0 ? buildMissingFields(context.intake) : [],
    documentsNeeded:
      options.score > 0 ? localizeList(options.documentsNeeded, context.intake.language) : [],
    nextSteps: options.score > 0 ? buildProgramNextSteps(context) : [],
  };
}

function enrichReasons(context: RuleContext, reasons: string[]) {
  const enriched = [...reasons];
  if (context.intake.skipSensitiveInfo) {
    enriched.push(
      context.intake.language === "es"
        ? "Se omitieron preguntas sensibles de identidad, asi que esos datos privados se pueden completar a mano despues."
        : "Sensitive identity questions were skipped, so private fields can be completed by hand later.",
    );
  }
  return enriched;
}

function buildMissingFields(intake: IntakeForm) {
  const missing: string[] = [];
  if (!intake.firstName.trim()) {
    missing.push(intake.language === "es" ? "Nombre" : "First name");
  }
  if (!intake.lastName.trim()) {
    missing.push(intake.language === "es" ? "Apellido" : "Last name");
  }
  if (!intake.address.trim()) {
    missing.push(intake.language === "es" ? "Direccion" : "Address");
  }
  if (!intake.phone.trim()) {
    missing.push(intake.language === "es" ? "Numero de telefono" : "Phone number");
  }
  if (intake.skipSensitiveInfo) {
    missing.push(
      intake.language === "es"
        ? "Numero de Seguro Social o identificacion equivalente"
        : "Social Security number or equivalent ID",
    );
  }
  return missing;
}

function buildBaseNextSteps(program: BenefitProgram, language: Language) {
  return [
    language === "es"
      ? `Revisa la ruta oficial para ${program.officeLabelEs}.`
      : `Review the official route for ${program.officeLabel}.`,
    program.submissionMode === "office"
      ? language === "es"
        ? "Imprime este paquete y llevalo a la oficina."
        : "Print this packet and take it to the office."
      : language === "es"
        ? "Usa este paquete para terminar la solicitud en linea mas rapido."
        : "Use this packet to finish the online application faster.",
  ];
}

function buildProgramNextSteps(context: RuleContext) {
  return [
    context.intake.language === "es"
      ? "Revisa la informacion prellenada antes de continuar."
      : "Review the prefilled information before continuing.",
    context.intake.skipSensitiveInfo
      ? context.intake.language === "es"
        ? "Completa los datos sensibles en papel o directamente en la oficina."
        : "Fill in sensitive identity fields on paper or directly at the office."
      : context.intake.language === "es"
        ? "Ten lista la informacion de identidad antes de enviar la solicitud."
        : "Gather identity information before submitting.",
    context.intake.language === "es"
      ? "Lleva los documentos listados para evitar un viaje extra."
      : "Bring the listed proof documents to avoid a return trip.",
  ];
}

function commonDocuments(program: BenefitProgram, language: Language) {
  if (program.tags.includes("housing")) {
    return language === "es"
      ? ["Contrato o prueba de renta", "Comprobante de ingresos", "Identificacion con foto"]
      : ["Lease or rent proof", "Income proof", "Photo ID"];
  }

  return language === "es"
    ? ["Identificacion con foto", "Comprobante de ingresos", "Comprobante de domicilio"]
    : ["Photo ID", "Income proof", "Address proof"];
}

function localizeValue(value: LocalizedValue, language: Language) {
  return typeof value === "string" ? value : value[language];
}

function localizeList(values: LocalizedValue[], language: Language) {
  return values.map((value) => localizeValue(value, language));
}

export function translateCategory(category: string, language: Language) {
  return localizedCategories[category]?.[language] ?? category;
}

export function buildAssistantSummary(intake: IntakeForm, matchCount: number): string {
  if (intake.language === "es") {
    return matchCount > 0
      ? `Encontre ${matchCount} beneficios probables y ya puedo explicarte cuales parecen mas fuertes para ti.`
      : "Todavia no encuentro un beneficio claro, pero podemos ajustar las respuestas y volver a intentar.";
  }

  return matchCount > 0
    ? `I found ${matchCount} likely benefits and can now explain which ones look strongest for you.`
    : "I do not see a strong benefit match yet, but we can adjust the answers and try again.";
}

export function buildResultsNarration(intake: IntakeForm, matches: MatchResult[]) {
  if (matches.length === 0) {
    return intake.language === "es"
      ? "No encontre un beneficio fuerte con estas respuestas. Podemos cambiar algunos datos para buscar mejor."
      : "I did not find a strong benefit match with these answers. We can change a few details and search again.";
  }

  const topPrograms = matches
    .slice(0, 3)
    .map(({ program }) => (intake.language === "es" ? program.nameEs : program.name));
  const leadingPrograms = joinProgramNames(topPrograms, intake.language);
  return intake.language === "es"
    ? `Tus mejores resultados ahora son ${leadingPrograms}. Revisa por que coinciden, que documentos te pediran y dime si quieres aplicar ahora.`
    : `Your strongest matches right now are ${leadingPrograms}. Review why they fit, what documents they need, and tell me if you want to apply now.`;
}

function joinProgramNames(programs: string[], language: Language) {
  if (programs.length <= 1) {
    return programs[0] ?? "";
  }

  if (programs.length === 2) {
    return `${programs[0]} ${language === "es" ? "y" : "and"} ${programs[1]}`;
  }

  const lastProgram = programs[programs.length - 1];
  return `${programs.slice(0, -1).join(", ")}, ${language === "es" ? "y" : "and"} ${lastProgram}`;
}

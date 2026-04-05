import { IntakeForm, LocalizedText } from "../lib/matching";

export interface EligibilityRuleData {
  score: (intake: IntakeForm) => number;
  reasons: (intake: IntakeForm) => LocalizedText[];
  documentsNeeded: LocalizedText[];
}

function text(en: string, es: string): LocalizedText {
  return { en, es };
}

export const eligibilityRules: Record<string, EligibilityRuleData> = {
  snap: {
    score: (intake) =>
      intake.monthlyIncomeBand === "under-1000"
        ? 0.9
        : intake.monthlyIncomeBand === "1000-2000"
          ? 0.9
          : intake.monthlyIncomeBand === "2000-3500"
            ? 0.42
            : 0,
    reasons: (intake) => [
      text("SNAP is mainly income-based.", "SNAP depende principalmente de los ingresos."),
      intake.childrenUnder19 || intake.childrenUnder5
        ? text(
            "Household size with children may increase eligibility.",
            "El tamano del hogar con ninos puede aumentar la elegibilidad.",
          )
        : text(
            "Single-adult households can still qualify.",
            "Los hogares con un solo adulto tambien pueden calificar.",
          ),
    ],
    documentsNeeded: [
      text("Photo ID", "Identificacion con foto"),
      text("Proof of income", "Comprobante de ingresos"),
      text("Proof of address", "Comprobante de domicilio"),
    ],
  },
  "nm-snap": {
    score: (intake) =>
      intake.region === "new-mexico" &&
      (intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000")
        ? 0.93
        : 0,
    reasons: () => [
      text(
        "New Mexico SNAP is appropriate for New Mexico households with low income.",
        "SNAP de Nuevo Mexico es adecuado para hogares de bajos ingresos en Nuevo Mexico.",
      ),
    ],
    documentsNeeded: [
      text("Photo ID", "Identificacion con foto"),
      text("Proof of income", "Comprobante de ingresos"),
      text("New Mexico address", "Domicilio en Nuevo Mexico"),
    ],
  },
  wic: {
    score: (intake) =>
      (intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000") &&
      (intake.pregnantOrPostpartum || intake.childrenUnder5)
        ? 0.96
        : 0,
    reasons: () => [
      text(
        "WIC matches pregnancy, postpartum, and young child households.",
        "WIC coincide con embarazo, posparto y hogares con ninos pequenos.",
      ),
      text(
        "The income estimate suggests the household may fall within WIC limits.",
        "La estimacion de ingresos sugiere que el hogar puede estar dentro de los limites de WIC.",
      ),
    ],
    documentsNeeded: [
      text("Photo ID", "Identificacion con foto"),
      text("Proof of address", "Comprobante de domicilio"),
      text("Pregnancy or child records", "Comprobantes de embarazo o de los ninos"),
    ],
  },
  medicaid: {
    score: (intake) =>
      intake.region === "texas" &&
      ((intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000") ||
        intake.hasDisability)
        ? 0.82
        : 0,
    reasons: (intake) => [
      text(
        "Texas Medicaid depends on income and household circumstances.",
        "Texas Medicaid depende de los ingresos y de la situacion del hogar.",
      ),
      intake.hasDisability
        ? text(
            "Disability may strengthen the Medicaid path.",
            "La discapacidad puede fortalecer la ruta hacia Medicaid.",
          )
        : text(
            "Low income may support Medicaid eligibility.",
            "Los ingresos bajos pueden apoyar la elegibilidad para Medicaid.",
          ),
    ],
    documentsNeeded: [
      text("Photo ID", "Identificacion con foto"),
      text("Income proof", "Comprobante de ingresos"),
      text("Household information", "Informacion del hogar"),
    ],
  },
  "nm-medicaid": {
    score: (intake) =>
      intake.region === "new-mexico" &&
      ((intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000") ||
        intake.hasDisability ||
        intake.childrenUnder19 ||
        intake.childrenUnder5)
        ? 0.9
        : 0,
    reasons: () => [
      text(
        "New Mexico Medicaid is a strong fit for low-income households, children, and disability cases.",
        "Medicaid de Nuevo Mexico es una opcion fuerte para hogares de bajos ingresos, ninos y casos de discapacidad.",
      ),
    ],
    documentsNeeded: [
      text("Photo ID", "Identificacion con foto"),
      text("Income proof", "Comprobante de ingresos"),
      text("New Mexico address", "Domicilio en Nuevo Mexico"),
    ],
  },
  chip: {
    score: (intake) =>
      intake.childrenUnder19 &&
      ["under-1000", "1000-2000", "2000-3500"].includes(intake.monthlyIncomeBand)
        ? 0.88
        : 0,
    reasons: () => [
      text("CHIP is for children under 19.", "CHIP es para ninos menores de 19 anos."),
      text(
        "Moderate-income families may still qualify even when Medicaid does not fit.",
        "Las familias con ingresos moderados aun pueden calificar aunque Medicaid no encaje.",
      ),
    ],
    documentsNeeded: [
      text("Child ID or birth record", "Identificacion o acta de nacimiento del nino"),
      text("Income proof", "Comprobante de ingresos"),
      text("Address proof", "Comprobante de domicilio"),
    ],
  },
  medicare: {
    score: (intake) => (intake.hasDisability ? 0.68 : 0),
    reasons: () => [
      text(
        "The current intake only supports the disability-based Medicare path.",
        "Este intake solo cubre la ruta de Medicare por discapacidad.",
      ),
      text(
        "A full application usually needs Social Security records.",
        "La solicitud completa normalmente requiere registros del Seguro Social.",
      ),
    ],
    documentsNeeded: [
      text("Medical records", "Expedientes medicos"),
      text("Work history", "Historial laboral"),
      text("Social Security records", "Registros del Seguro Social"),
    ],
  },
  starplus: {
    score: (intake) => (intake.region === "texas" && intake.hasDisability ? 0.86 : 0),
    reasons: () => [
      text(
        "STAR+PLUS is aimed at Texans with disability or chronic care needs.",
        "STAR+PLUS esta dirigido a personas en Texas con discapacidad o necesidades de cuidado cronico.",
      ),
    ],
    documentsNeeded: [
      text("Medicaid enrollment info", "Informacion de inscripcion a Medicaid"),
      text("Medical records", "Expedientes medicos"),
      text("Care needs summary", "Resumen de necesidades de cuidado"),
    ],
  },
  ssi: {
    score: (intake) =>
      (intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000") &&
      (intake.ageBand === "65-plus" || intake.hasDisability)
        ? 0.95
        : 0,
    reasons: () => [
      text(
        "SSI is designed for seniors or disabled applicants with limited income.",
        "SSI esta disenado para personas mayores o con discapacidad con ingresos limitados.",
      ),
    ],
    documentsNeeded: [
      text("Photo ID", "Identificacion con foto"),
      text("Income and resource proof", "Comprobante de ingresos y recursos"),
      text("Medical evidence if disabled", "Evidencia medica si hay discapacidad"),
    ],
  },
  ssdi: {
    score: (intake) => (intake.hasDisability ? 0.72 : 0),
    reasons: () => [
      text(
        "SSDI requires disability plus enough work history.",
        "SSDI requiere discapacidad y suficiente historial laboral.",
      ),
      text(
        "This intake cannot confirm work credits yet.",
        "Este intake todavia no puede confirmar los creditos de trabajo.",
      ),
    ],
    documentsNeeded: [
      text("Medical records", "Expedientes medicos"),
      text("Recent work history", "Historial laboral reciente"),
      text("Social Security earnings history", "Historial de ingresos del Seguro Social"),
    ],
  },
  tanf: {
    score: (intake) =>
      intake.monthlyIncomeBand === "under-1000" && intake.childrenUnder19 ? 0.94 : 0,
    reasons: () => [
      text(
        "TANF is typically for very low-income households with children.",
        "TANF suele ser para hogares con ninos y muy bajos ingresos.",
      ),
    ],
    documentsNeeded: [
      text("Income proof", "Comprobante de ingresos"),
      text("Children's records", "Documentos de los ninos"),
      text("Address proof", "Comprobante de domicilio"),
    ],
  },
  liheap: {
    score: (intake) =>
      intake.needsUtilityHelp &&
      ["under-1000", "1000-2000", "2000-3500"].includes(intake.monthlyIncomeBand)
        ? 0.89
        : 0,
    reasons: () => [
      text(
        "The household asked for utility help.",
        "El hogar pidio ayuda con servicios publicos.",
      ),
      text(
        "Energy assistance usually depends on income and utility burden.",
        "La ayuda de energia normalmente depende de los ingresos y de la carga de servicios.",
      ),
    ],
    documentsNeeded: [
      text("Recent utility bill", "Factura reciente de servicios"),
      text("Income proof", "Comprobante de ingresos"),
      text("Photo ID", "Identificacion con foto"),
    ],
  },
  "nm-liheap": {
    score: (intake) =>
      intake.region === "new-mexico" &&
      intake.needsUtilityHelp &&
      ["under-1000", "1000-2000", "2000-3500"].includes(intake.monthlyIncomeBand)
        ? 0.92
        : 0,
    reasons: () => [
      text(
        "New Mexico LIHEAP fits households needing utility relief in New Mexico.",
        "LIHEAP de Nuevo Mexico encaja para hogares que necesitan alivio con servicios en Nuevo Mexico.",
      ),
    ],
    documentsNeeded: [
      text("Recent utility bill", "Factura reciente de servicios"),
      text("Income proof", "Comprobante de ingresos"),
      text("New Mexico address", "Domicilio en Nuevo Mexico"),
    ],
  },
  section8: {
    score: (intake) =>
      intake.needsHousingHelp &&
      ((intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000") ||
        intake.ageBand === "65-plus" ||
        intake.hasDisability)
        ? 0.78
        : 0,
    reasons: () => [
      text(
        "Housing assistance is relevant because rent or housing help was requested.",
        "La ayuda de vivienda es relevante porque se pidio apoyo con renta o vivienda.",
      ),
      text(
        "Seniors and disabled applicants often have priority pathways.",
        "Las personas mayores y con discapacidad a menudo tienen rutas de prioridad.",
      ),
    ],
    documentsNeeded: [
      text("Lease or housing cost proof", "Contrato o comprobante del costo de vivienda"),
      text("Income proof", "Comprobante de ingresos"),
      text("Photo ID", "Identificacion con foto"),
    ],
  },
  headstart: {
    score: (intake) =>
      intake.childrenUnder5 &&
      (intake.monthlyIncomeBand === "under-1000" || intake.monthlyIncomeBand === "1000-2000")
        ? 0.91
        : 0,
    reasons: () => [
      text(
        "Head Start is primarily for children under 5 in lower-income households.",
        "Head Start es principalmente para ninos menores de 5 anos en hogares de bajos ingresos.",
      ),
    ],
    documentsNeeded: [
      text("Child birth record", "Acta de nacimiento del nino"),
      text("Immunization record", "Cartilla o registro de vacunas"),
      text("Income proof", "Comprobante de ingresos"),
    ],
  },
  vocrehab: {
    score: (intake) => (intake.hasDisability ? 0.84 : 0),
    reasons: () => [
      text(
        "Vocational Rehabilitation is a strong fit when disability affects employment.",
        "Rehabilitacion Vocacional es una opcion fuerte cuando la discapacidad afecta el empleo.",
      ),
    ],
    documentsNeeded: [
      text("Disability documentation", "Documentacion de discapacidad"),
      text("Education or work history", "Historial educativo o laboral"),
      text("Photo ID", "Identificacion con foto"),
    ],
  },
  "mx-consular-support": {
    score: (intake) => (intake.region === "mexico" ? 0.93 : 0),
    reasons: () => [
      text(
        "Consular support is useful when documentation or mixed-status family guidance is needed.",
        "El apoyo consular es util cuando se necesita ayuda con documentos o con familias de estatus mixto.",
      ),
    ],
    documentsNeeded: [
      text("Any existing Mexican ID", "Cualquier identificacion mexicana disponible"),
      text("Address details", "Detalles del domicilio"),
      text("List of needed documents", "Lista de documentos necesarios"),
    ],
  },
  "mx-health-window": {
    score: (intake) =>
      intake.region === "mexico"
        ? intake.hasDisability || intake.needsUtilityHelp || intake.notes.length > 0
          ? 0.79
          : 0.58
        : 0,
    reasons: () => [
      text(
        "Ventanilla de Salud can route border residents to low-cost health and social services.",
        "La Ventanilla de Salud puede orientar a residentes fronterizos hacia servicios de salud y apoyo social de bajo costo.",
      ),
    ],
    documentsNeeded: [
      text("Photo ID if available", "Identificacion con foto si esta disponible"),
      text("Medication list", "Lista de medicamentos"),
      text("Notes about needed care", "Notas sobre la atencion necesaria"),
    ],
  },
};

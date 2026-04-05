import rawPrograms from "../../navigator-programs.json";

export type Jurisdiction = "texas" | "new-mexico" | "federal-us" | "mexico";

export interface BenefitProgram {
  id: string;
  name: string;
  nameEs: string;
  category: string;
  description: string;
  descriptionEs: string;
  eligibility: string;
  eligibilityEs: string;
  applyUrl: string;
  fplPercent: number;
  jurisdictions: Jurisdiction[];
  tags: string[];
  officeLabel: string;
  officeLabelEs: string;
  submissionMode: "online" | "print" | "office" | "mixed";
}

type RawProgram = Omit<
  BenefitProgram,
  "jurisdictions" | "tags" | "officeLabel" | "officeLabelEs" | "submissionMode"
>;

const jurisdictionMap: Record<string, Jurisdiction[]> = {
  starplus: ["texas"],
  liheap: ["texas", "new-mexico", "federal-us"],
  section8: ["texas", "new-mexico", "federal-us"],
  vocrehab: ["texas"],
};

const tagMap: Record<string, string[]> = {
  snap: ["food", "income"],
  wic: ["food", "pregnancy", "children-under-5"],
  medicaid: ["health", "income"],
  chip: ["health", "children"],
  medicare: ["disability", "health"],
  starplus: ["disability", "health", "long-term-care"],
  ssi: ["elderly", "disability", "cash"],
  ssdi: ["disability", "cash", "work-history"],
  tanf: ["cash", "children", "income"],
  liheap: ["utilities", "hardship"],
  section8: ["housing", "elderly", "disability"],
  headstart: ["children-under-5", "education"],
  vocrehab: ["disability", "employment"],
};

const officeMap: Record<
  string,
  { en: string; es: string; submissionMode: BenefitProgram["submissionMode"] }
> = {
  snap: {
    en: "Texas Health and Human Services / Your Texas Benefits",
    es: "Servicios Humanos y de Salud de Texas / Your Texas Benefits",
    submissionMode: "online",
  },
  wic: {
    en: "Texas WIC clinic",
    es: "Clínica WIC de Texas",
    submissionMode: "mixed",
  },
  medicaid: {
    en: "Texas Health and Human Services",
    es: "Servicios Humanos y de Salud de Texas",
    submissionMode: "online",
  },
  chip: {
    en: "Texas Health and Human Services",
    es: "Servicios Humanos y de Salud de Texas",
    submissionMode: "online",
  },
  medicare: {
    en: "Social Security Administration",
    es: "Administración del Seguro Social",
    submissionMode: "mixed",
  },
  starplus: {
    en: "Texas Medicaid STAR+PLUS enrollment",
    es: "Inscripción Texas Medicaid STAR+PLUS",
    submissionMode: "office",
  },
  ssi: {
    en: "Social Security Administration",
    es: "Administración del Seguro Social",
    submissionMode: "mixed",
  },
  ssdi: {
    en: "Social Security Administration",
    es: "Administración del Seguro Social",
    submissionMode: "mixed",
  },
  tanf: {
    en: "Your Texas Benefits",
    es: "Your Texas Benefits",
    submissionMode: "online",
  },
  liheap: {
    en: "Community action agency or local energy assistance office",
    es: "Agencia local de ayuda comunitaria o de energía",
    submissionMode: "print",
  },
  section8: {
    en: "Local housing authority",
    es: "Autoridad local de vivienda",
    submissionMode: "office",
  },
  headstart: {
    en: "Local Head Start partner",
    es: "Centro local de Head Start",
    submissionMode: "office",
  },
  vocrehab: {
    en: "Texas Workforce Commission Vocational Rehabilitation",
    es: "Rehabilitación Vocacional de la Comisión Laboral de Texas",
    submissionMode: "office",
  },
};

const additionalPrograms: BenefitProgram[] = [
  {
    id: "htw",
    name: "Healthy Texas Women",
    nameEs: "Healthy Texas Women",
    category: "Health",
    description: "Free family planning, screenings, and preventive care for women 15–44 who don't qualify for Medicaid.",
    descriptionEs: "Planificacion familiar, chequeos y atencion preventiva gratis para mujeres de 15 a 44 anos que no califican para Medicaid.",
    eligibility: "Women 15–44 in Texas with income up to 200% FPL, not currently on Medicaid.",
    eligibilityEs: "Mujeres de 15 a 44 anos en Texas con ingresos hasta el 200% del FPL, sin Medicaid activo.",
    applyUrl: "https://yourtexasbenefits.com",
    fplPercent: 200,
    jurisdictions: ["texas"],
    tags: ["health", "income"],
    officeLabel: "Texas Health and Human Services",
    officeLabelEs: "Servicios Humanos y de Salud de Texas",
    submissionMode: "online",
  },
  {
    id: "cshcn",
    name: "CSHCN Services Program",
    nameEs: "Programa CSHCN",
    category: "Health",
    description: "Health services and support for Texas children under 21 with physical or developmental special needs.",
    descriptionEs: "Servicios de salud para ninos menores de 21 anos en Texas con necesidades especiales fisicas o del desarrollo.",
    eligibility: "Texas children under 21 with special health care needs, income-based sliding fee.",
    eligibilityEs: "Ninos menores de 21 anos en Texas con necesidades especiales de salud, cuota segun ingresos.",
    applyUrl: "https://www.dshs.texas.gov/cshcn",
    fplPercent: 200,
    jurisdictions: ["texas"],
    tags: ["health", "children", "disability"],
    officeLabel: "Texas DSHS / CSHCN Services",
    officeLabelEs: "DSHS de Texas / Servicios CSHCN",
    submissionMode: "mixed",
  },
  {
    id: "nm-wic",
    name: "New Mexico WIC",
    nameEs: "WIC de Nuevo México",
    category: "Food",
    description: "Free healthy food, formula, and nutrition support for pregnant women and children under 5 in New Mexico.",
    descriptionEs: "Comida saludable gratis, formula y apoyo nutricional para mujeres embarazadas y ninos menores de 5 anos en Nuevo Mexico.",
    eligibility: "Pregnant women, new mothers, and children under 5 in NM earning up to 185% FPL.",
    eligibilityEs: "Mujeres embarazadas, nuevas madres y ninos menores de 5 anos en NM con ingresos hasta 185% del FPL.",
    applyUrl: "https://www.nmhealth.org/about/phd/wic/",
    fplPercent: 185,
    jurisdictions: ["new-mexico"],
    tags: ["food", "pregnancy", "children-under-5"],
    officeLabel: "New Mexico WIC Program",
    officeLabelEs: "Programa WIC de Nuevo Mexico",
    submissionMode: "mixed",
  },
  {
    id: "nm-works",
    name: "NM Works (Cash Assistance)",
    nameEs: "NM Works (Asistencia en Efectivo)",
    category: "Income",
    description: "Monthly cash assistance for low-income New Mexico families with children.",
    descriptionEs: "Asistencia mensual en efectivo para familias de bajos ingresos con ninos en Nuevo Mexico.",
    eligibility: "Very low-income NM households with children under 18.",
    eligibilityEs: "Hogares de muy bajos ingresos en NM con ninos menores de 18 anos.",
    applyUrl: "https://www.yes.state.nm.us",
    fplPercent: 100,
    jurisdictions: ["new-mexico"],
    tags: ["cash", "children", "income"],
    officeLabel: "New Mexico HSD / NM Works",
    officeLabelEs: "HSD de Nuevo Mexico / NM Works",
    submissionMode: "online",
  },
  {
    id: "ep-project-vida",
    name: "Project Vida Health Center",
    nameEs: "Centro de Salud Project Vida",
    category: "Health",
    description: "Low-cost primary care, dental, and behavioral health services in El Paso for uninsured and underinsured residents.",
    descriptionEs: "Atencion primaria, dental y salud conductual a bajo costo en El Paso para residentes sin seguro o con seguro limitado.",
    eligibility: "El Paso-area residents regardless of immigration status or insurance. Sliding fee scale.",
    eligibilityEs: "Residentes del area de El Paso sin importar estatus migratorio o seguro. Cuota segun ingresos.",
    applyUrl: "https://www.projectvida.org",
    fplPercent: 0,
    jurisdictions: ["texas"],
    tags: ["health", "language", "hardship"],
    officeLabel: "Project Vida Health Center, El Paso",
    officeLabelEs: "Centro de Salud Project Vida, El Paso",
    submissionMode: "office",
  },
  {
    id: "nm-snap",
    name: "New Mexico SNAP",
    nameEs: "SNAP de Nuevo México",
    category: "Food",
    description: "Food assistance for New Mexico residents through the state benefits portal.",
    descriptionEs: "Asistencia alimentaria para residentes de Nuevo México por el portal estatal.",
    eligibility: "Low-income households in New Mexico.",
    eligibilityEs: "Hogares de bajos ingresos en Nuevo México.",
    applyUrl: "https://www.yes.state.nm.us",
    fplPercent: 130,
    jurisdictions: ["new-mexico"],
    tags: ["food", "income"],
    officeLabel: "New Mexico HSD / YES New Mexico",
    officeLabelEs: "HSD de Nuevo México / YES New Mexico",
    submissionMode: "online",
  },
  {
    id: "nm-medicaid",
    name: "New Mexico Medicaid",
    nameEs: "Medicaid de Nuevo México",
    category: "Health",
    description: "Health coverage for qualifying low-income New Mexico residents.",
    descriptionEs: "Cobertura médica para residentes elegibles de bajos ingresos en Nuevo México.",
    eligibility: "Adults, children, seniors, and people with disabilities who qualify under New Mexico rules.",
    eligibilityEs: "Adultos, niños, personas mayores y personas con discapacidad que califican bajo las reglas de Nuevo México.",
    applyUrl: "https://www.yes.state.nm.us",
    fplPercent: 138,
    jurisdictions: ["new-mexico"],
    tags: ["health", "income", "children", "elderly", "disability"],
    officeLabel: "New Mexico HSD / Medicaid",
    officeLabelEs: "HSD de Nuevo México / Medicaid",
    submissionMode: "online",
  },
  {
    id: "nm-liheap",
    name: "New Mexico LIHEAP",
    nameEs: "LIHEAP de Nuevo México",
    category: "Utilities",
    description: "Seasonal energy support for electricity and gas bills in New Mexico.",
    descriptionEs: "Apoyo estacional para pagar luz y gas en Nuevo México.",
    eligibility: "Low-income households needing energy bill support.",
    eligibilityEs: "Hogares de bajos ingresos que necesitan apoyo con energía.",
    applyUrl: "https://www.yes.state.nm.us",
    fplPercent: 150,
    jurisdictions: ["new-mexico"],
    tags: ["utilities", "hardship"],
    officeLabel: "New Mexico LIHEAP",
    officeLabelEs: "LIHEAP de Nuevo México",
    submissionMode: "print",
  },
  {
    id: "mx-consular-support",
    name: "Mexico Consular Guidance",
    nameEs: "Orientación Consular de México",
    category: "Navigation",
    description: "Support for ID replacement, documents, and referrals through Mexican consular services.",
    descriptionEs: "Apoyo para reposición de identificación, documentos y referencias por servicios consulares mexicanos.",
    eligibility: "Mexican nationals or mixed-status families needing documentation support.",
    eligibilityEs: "Ciudadanos mexicanos o familias mixtas que necesitan apoyo documental.",
    applyUrl: "https://consulmex.sre.gob.mx/elpaso/",
    fplPercent: 0,
    jurisdictions: ["mexico"],
    tags: ["documents", "language", "hardship"],
    officeLabel: "Consulate of Mexico in El Paso",
    officeLabelEs: "Consulado de México en El Paso",
    submissionMode: "office",
  },
  {
    id: "mx-health-window",
    name: "Ventanilla de Salud",
    nameEs: "Ventanilla de Salud",
    category: "Health",
    description: "Health navigation, screenings, and local community referrals through the Mexican consulate network.",
    descriptionEs: "Orientación de salud, chequeos y referencias comunitarias por la red consular mexicana.",
    eligibility: "Border residents needing low-cost health navigation and referrals.",
    eligibilityEs: "Residentes fronterizos que necesitan orientación de salud de bajo costo.",
    applyUrl: "https://consulmex.sre.gob.mx/elpaso/",
    fplPercent: 0,
    jurisdictions: ["mexico"],
    tags: ["health", "language", "hardship"],
    officeLabel: "Ventanilla de Salud, El Paso Consulate",
    officeLabelEs: "Ventanilla de Salud, Consulado de El Paso",
    submissionMode: "office",
  },
];

export const programs: BenefitProgram[] = (rawPrograms as RawProgram[]).map(
  (program) => ({
    ...program,
    jurisdictions:
      jurisdictionMap[program.id] ?? ["texas", "federal-us", "new-mexico"],
    tags: tagMap[program.id] ?? [],
    officeLabel: officeMap[program.id]?.en ?? "Benefits office",
    officeLabelEs: officeMap[program.id]?.es ?? "Oficina de beneficios",
    submissionMode: officeMap[program.id]?.submissionMode ?? "mixed",
  }),
).concat(additionalPrograms);

import { IntakeForm } from "../lib/matching";

export type QuestionType = "text" | "choice";

export interface ProgramQuestion {
  field: keyof IntakeForm;
  type: QuestionType;
  labelEn: string;
  labelEs: string;
  placeholderEn?: string;
  placeholderEs?: string;
  options?: Array<{
    value: string;
    labelEn: string;
    labelEs: string;
  }>;
}

const employmentStatusQuestion: ProgramQuestion = {
  field: "employmentStatus",
  type: "choice",
  labelEn: "Current work status",
  labelEs: "Situación de trabajo",
  options: [
    { value: "employed", labelEn: "Employed", labelEs: "Empleado/a" },
    { value: "unemployed", labelEn: "Unemployed", labelEs: "Desempleado/a" },
    { value: "self-employed", labelEn: "Self-employed", labelEs: "Trabajo propio" },
    { value: "not-seeking", labelEn: "Not currently seeking work", labelEs: "No busca empleo" },
  ],
};

const employerNameQuestion: ProgramQuestion = {
  field: "employerName",
  type: "text",
  labelEn: "Employer name (if employed)",
  labelEs: "Nombre del empleador (si trabaja)",
  placeholderEn: "Employer name or N/A",
  placeholderEs: "Nombre del empleador o N/A",
};

const monthlyRentQuestion: ProgramQuestion = {
  field: "monthlyRent",
  type: "text",
  labelEn: "Monthly rent or mortgage amount",
  labelEs: "Renta o hipoteca mensual",
  placeholderEn: "e.g. $600",
  placeholderEs: "ej. $600",
};

const currentInsuranceQuestion: ProgramQuestion = {
  field: "currentInsurance",
  type: "choice",
  labelEn: "Current health insurance",
  labelEs: "Seguro médico actual",
  options: [
    { value: "none", labelEn: "None", labelEs: "Ninguno" },
    { value: "private", labelEn: "Private / employer plan", labelEs: "Privado / seguro de empleo" },
    { value: "medicaid", labelEn: "Medicaid", labelEs: "Medicaid" },
    { value: "medicare", labelEn: "Medicare", labelEs: "Medicare" },
    { value: "chip", labelEn: "CHIP", labelEs: "CHIP" },
  ],
};

const childrenNamesQuestion: ProgramQuestion = {
  field: "childrenNames",
  type: "text",
  labelEn: "Children's names and ages (one per line or comma-separated)",
  labelEs: "Nombre y edad de los niños (uno por línea o separados por coma)",
  placeholderEn: "e.g. Sofia 3, Miguel 7",
  placeholderEs: "ej. Sofia 3, Miguel 7",
};

const childDiagnosisQuestion: ProgramQuestion = {
  field: "childDiagnosis",
  type: "text",
  labelEn: "Condition or disability (brief description)",
  labelEs: "Condición o discapacidad (descripción breve)",
  placeholderEn: "e.g. autism, cerebral palsy, diabetes",
  placeholderEs: "ej. autismo, parálisis cerebral, diabetes",
};

const heatingTypeQuestion: ProgramQuestion = {
  field: "heatingType",
  type: "choice",
  labelEn: "Home heating and cooling type",
  labelEs: "Tipo de calefacción y enfriamiento",
  options: [
    { value: "gas", labelEn: "Natural gas", labelEs: "Gas natural" },
    { value: "electric", labelEn: "Electric", labelEs: "Eléctrico" },
    { value: "both", labelEn: "Both", labelEs: "Ambos" },
  ],
};

const lastUtilityBillQuestion: ProgramQuestion = {
  field: "lastUtilityBill",
  type: "text",
  labelEn: "Last utility bill amount",
  labelEs: "Monto del último recibo de servicios",
  placeholderEn: "e.g. $120",
  placeholderEs: "ej. $120",
};

export const programQuestionsMap: Record<string, ProgramQuestion[]> = {
  snap: [employmentStatusQuestion, employerNameQuestion, monthlyRentQuestion, lastUtilityBillQuestion],
  "nm-snap": [employmentStatusQuestion, employerNameQuestion, monthlyRentQuestion, lastUtilityBillQuestion],
  medicaid: [currentInsuranceQuestion, employmentStatusQuestion],
  chip: [childrenNamesQuestion, currentInsuranceQuestion],
  htw: [currentInsuranceQuestion],
  cshcn: [childrenNamesQuestion, childDiagnosisQuestion, currentInsuranceQuestion],
  wic: [childrenNamesQuestion],
  "nm-wic": [childrenNamesQuestion],
  tanf: [employmentStatusQuestion, childrenNamesQuestion, monthlyRentQuestion],
  "nm-works": [employmentStatusQuestion, childrenNamesQuestion, monthlyRentQuestion],
  liheap: [heatingTypeQuestion, lastUtilityBillQuestion, monthlyRentQuestion],
  section8: [monthlyRentQuestion, employmentStatusQuestion],
  headstart: [childrenNamesQuestion],
  ssi: [childDiagnosisQuestion],
  ssdi: [childDiagnosisQuestion, employerNameQuestion],
  starplus: [childDiagnosisQuestion, currentInsuranceQuestion],
  vocrehab: [childDiagnosisQuestion, employmentStatusQuestion],
  "ep-project-vida": [currentInsuranceQuestion, employmentStatusQuestion],
  medicare: [currentInsuranceQuestion],
};

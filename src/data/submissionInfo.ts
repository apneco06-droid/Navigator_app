export interface SubmissionInfo {
  mailEn?: string;
  mailEs?: string;
  inPersonEn?: string;
  inPersonEs?: string;
  phone?: string;
  hoursEn?: string;
  hoursEs?: string;
}

const submissionInfoMap: Record<string, SubmissionInfo> = {
  snap: {
    mailEn: "HHSC, P.O. Box 149027, Austin, TX 78714-9027",
    mailEs: "HHSC, P.O. Box 149027, Austin, TX 78714-9027",
    inPersonEn: "El Paso HHSC Benefits Office — 1345 Eastlake Ave, El Paso, TX 79905",
    inPersonEs: "Oficina de Beneficios HHSC El Paso — 1345 Eastlake Ave, El Paso, TX 79905",
    phone: "1-877-541-7905",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  medicaid: {
    mailEn: "HHSC, P.O. Box 149027, Austin, TX 78714-9027",
    mailEs: "HHSC, P.O. Box 149027, Austin, TX 78714-9027",
    inPersonEn: "El Paso HHSC Benefits Office — 1345 Eastlake Ave, El Paso, TX 79905",
    inPersonEs: "Oficina de Beneficios HHSC El Paso — 1345 Eastlake Ave, El Paso, TX 79905",
    phone: "1-800-252-8263",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  chip: {
    inPersonEn: "El Paso HHSC Benefits Office — 1345 Eastlake Ave, El Paso, TX 79905",
    inPersonEs: "Oficina de Beneficios HHSC El Paso — 1345 Eastlake Ave, El Paso, TX 79905",
    phone: "1-800-647-6558",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  tanf: {
    mailEn: "HHSC, P.O. Box 149027, Austin, TX 78714-9027",
    mailEs: "HHSC, P.O. Box 149027, Austin, TX 78714-9027",
    inPersonEn: "El Paso HHSC Benefits Office — 1345 Eastlake Ave, El Paso, TX 79905",
    inPersonEs: "Oficina de Beneficios HHSC El Paso — 1345 Eastlake Ave, El Paso, TX 79905",
    phone: "1-877-541-7905",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  htw: {
    inPersonEn: "El Paso HHSC Benefits Office — 1345 Eastlake Ave, El Paso, TX 79905",
    inPersonEs: "Oficina de Beneficios HHSC El Paso — 1345 Eastlake Ave, El Paso, TX 79905",
    phone: "1-855-889-7367",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  cshcn: {
    mailEn: "DSHS CSHCN Services, P.O. Box 12668, Austin, TX 78711",
    mailEs: "DSHS Servicios CSHCN, P.O. Box 12668, Austin, TX 78711",
    inPersonEn: "Texas DSHS Regional Office — 8407 Magnolia Ave, El Paso, TX 79925",
    inPersonEs: "Oficina Regional DSHS Texas — 8407 Magnolia Ave, El Paso, TX 79925",
    phone: "1-800-252-8023",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  wic: {
    inPersonEn: "El Paso City-County WIC — 5300 Paisano Dr, El Paso, TX 79905",
    inPersonEs: "WIC Ciudad-Condado de El Paso — 5300 Paisano Dr, El Paso, TX 79905",
    phone: "915-351-0100",
    hoursEn: "Mon–Fri 7:30 am – 4:30 pm",
    hoursEs: "Lun–Vie 7:30 am – 4:30 pm",
  },
  "nm-wic": {
    inPersonEn: "NM WIC Las Cruces Office — 1170 N Solano Dr, Las Cruces, NM 88001",
    inPersonEs: "Oficina WIC NM Las Cruces — 1170 N Solano Dr, Las Cruces, NM 88001",
    phone: "1-800-654-3957",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  "nm-works": {
    mailEn: "NM HSD Income Support Division, P.O. Box 2348, Santa Fe, NM 87504",
    mailEs: "NM HSD División de Apoyo de Ingresos, P.O. Box 2348, Santa Fe, NM 87504",
    inPersonEn: "NM HSD Las Cruces Office — 1309 W. Hadley Ave, Las Cruces, NM 88005",
    inPersonEs: "Oficina HSD Las Cruces NM — 1309 W. Hadley Ave, Las Cruces, NM 88005",
    phone: "1-800-283-4465",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  "nm-snap": {
    mailEn: "NM HSD Income Support Division, P.O. Box 2348, Santa Fe, NM 87504",
    mailEs: "NM HSD División de Apoyo de Ingresos, P.O. Box 2348, Santa Fe, NM 87504",
    inPersonEn: "NM HSD Las Cruces Office — 1309 W. Hadley Ave, Las Cruces, NM 88005",
    inPersonEs: "Oficina HSD Las Cruces NM — 1309 W. Hadley Ave, Las Cruces, NM 88005",
    phone: "1-800-283-4465",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  liheap: {
    mailEn: "Opportunity Center — P.O. Box 2397, El Paso, TX 79999",
    mailEs: "Opportunity Center — P.O. Box 2397, El Paso, TX 79999",
    inPersonEn: "Opportunity Center — 5400 Gateway Blvd E, El Paso, TX 79905",
    inPersonEs: "Opportunity Center — 5400 Gateway Blvd E, El Paso, TX 79905",
    phone: "915-534-6100",
    hoursEn: "Mon–Fri 8 am – 5 pm (limited intake slots — call first)",
    hoursEs: "Lun–Vie 8 am – 5 pm (cupos limitados — llamar primero)",
  },
  section8: {
    inPersonEn: "El Paso Housing Authority — 5300 E. Paisano Dr, El Paso, TX 79905",
    inPersonEs: "Autoridad de Vivienda de El Paso — 5300 E. Paisano Dr, El Paso, TX 79905",
    phone: "915-849-3700",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  headstart: {
    inPersonEn: "El Paso Head Start (SISD) — 12440 Rojas Dr, El Paso, TX 79928",
    inPersonEs: "Head Start El Paso (SISD) — 12440 Rojas Dr, El Paso, TX 79928",
    phone: "915-937-0000",
    hoursEn: "Mon–Fri 8 am – 4 pm",
    hoursEs: "Lun–Vie 8 am – 4 pm",
  },
  ssi: {
    inPersonEn: "Social Security Administration — 8535 Dyer St, El Paso, TX 79904",
    inPersonEs: "Administración del Seguro Social — 8535 Dyer St, El Paso, TX 79904",
    phone: "1-800-772-1213",
    hoursEn: "Mon–Fri 9 am – 4 pm",
    hoursEs: "Lun–Vie 9 am – 4 pm",
  },
  ssdi: {
    inPersonEn: "Social Security Administration — 8535 Dyer St, El Paso, TX 79904",
    inPersonEs: "Administración del Seguro Social — 8535 Dyer St, El Paso, TX 79904",
    phone: "1-800-772-1213",
    hoursEn: "Mon–Fri 9 am – 4 pm",
    hoursEs: "Lun–Vie 9 am – 4 pm",
  },
  medicare: {
    inPersonEn: "Social Security Administration — 8535 Dyer St, El Paso, TX 79904",
    inPersonEs: "Administración del Seguro Social — 8535 Dyer St, El Paso, TX 79904",
    phone: "1-800-633-4227",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  starplus: {
    inPersonEn: "HHSC STAR+PLUS — 1345 Eastlake Ave, El Paso, TX 79905",
    inPersonEs: "HHSC STAR+PLUS — 1345 Eastlake Ave, El Paso, TX 79905",
    phone: "1-800-964-2777",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  vocrehab: {
    inPersonEn: "TWC Vocational Rehabilitation — 8765 Montana Ave, El Paso, TX 79925",
    inPersonEs: "Rehabilitación Vocacional TWC — 8765 Montana Ave, El Paso, TX 79925",
    phone: "915-774-8602",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
  "ep-project-vida": {
    inPersonEn: "Project Vida Health Center — 1420 Mescalero Rd, El Paso, TX 79925",
    inPersonEs: "Centro de Salud Project Vida — 1420 Mescalero Rd, El Paso, TX 79925",
    phone: "915-772-3366",
    hoursEn: "Mon–Fri 8 am – 5 pm",
    hoursEs: "Lun–Vie 8 am – 5 pm",
  },
};

export function getSubmissionInfo(programId: string): SubmissionInfo {
  return submissionInfoMap[programId] ?? {};
}

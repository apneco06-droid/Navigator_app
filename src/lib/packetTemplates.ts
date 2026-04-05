import { MatchResult, IntakeForm } from "./matching";
import { Language } from "./matching";

export interface PacketTemplate {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  routingNote: string;
  programs: MatchResult[];
}

type FamilyId = "texas-core" | "disability" | "housing-utilities" | "mexico-support" | "other";

const familyMeta: Record<
  FamilyId,
  Omit<PacketTemplate, "programs">
> = {
  "texas-core": {
    id: "texas-core",
    title: "Texas core benefits packet",
    subtitle: "Food, health, and family support",
    intro:
      "Use this packet for Texas essentials like SNAP, Medicaid, CHIP, TANF, and WIC. These programs usually move fastest when income and household documents are ready.",
    routingNote:
      "For El Paso residents, start with the Texas Benefits portal and be ready for follow-up from local HHSC or clinic staff.",
  },
  disability: {
    id: "disability",
    title: "Disability benefits packet",
    subtitle: "SSI, SSDI, Medicare disability, and vocational support",
    intro:
      "Use this packet when disability, chronic illness, or long-term care needs are central. Medical records and work history matter more here than in basic income programs.",
    routingNote:
      "In El Paso, expect a mix of Social Security, Medicaid, and local disability-service referrals rather than one single office.",
  },
  "housing-utilities": {
    id: "housing-utilities",
    title: "Housing and utilities packet",
    subtitle: "Rent relief, vouchers, and energy assistance",
    intro:
      "Use this packet when the immediate problem is rent, housing stability, or utility shutoff risk. Bring bills, lease details, and recent income proof.",
    routingNote:
      "For El Paso-area households, local housing authority and community action agencies are usually the first stop.",
  },
  "mexico-support": {
    id: "mexico-support",
    title: "Mexico support packet",
    subtitle: "Consular guidance and border health navigation",
    intro:
      "Use this packet when the applicant needs consular support, documentation help, or referral-based border services rather than a standard U.S. benefits portal.",
    routingNote:
      "In El Paso, start with the Mexican Consulate or related border health navigation services.",
  },
  other: {
    id: "other",
    title: "Additional programs packet",
    subtitle: "Other likely matches",
    intro:
      "These programs did not fit one of the main packet groups but may still be worth reviewing.",
    routingNote:
      "Review these with a helper or navigator because the best route may depend on the local office response.",
  },
};

export function buildPacketTemplates(
  intake: IntakeForm,
  matches: MatchResult[],
  language: Language,
): PacketTemplate[] {
  const grouped = new Map<FamilyId, MatchResult[]>();

  for (const match of matches.slice(0, 8)) {
    const family = resolveFamily(match);
    const existing = grouped.get(family) ?? [];
    existing.push(match);
    grouped.set(family, existing);
  }

  const templates: PacketTemplate[] = [];
  const order: FamilyId[] = [
    "texas-core",
    "disability",
    "housing-utilities",
    "mexico-support",
    "other",
  ];

  for (const family of order) {
    const programs = grouped.get(family);
    if (!programs || programs.length === 0) {
      continue;
    }

    const meta = familyMeta[family];
    templates.push({
      ...translateTemplate(meta, language),
      intro: adaptIntroForIntake(translateTemplate(meta, language).intro, intake, language),
      programs,
    });
  }

  return templates;
}

function resolveFamily(match: MatchResult): FamilyId {
  const { program } = match;

  if (program.id.startsWith("mx-")) {
    return "mexico-support";
  }

  if (
    ["ssi", "ssdi", "medicare", "starplus", "vocrehab"].includes(program.id)
  ) {
    return "disability";
  }

  if (["section8", "liheap", "nm-liheap"].includes(program.id)) {
    return "housing-utilities";
  }

  if (
    ["snap", "nm-snap", "wic", "nm-wic", "medicaid", "nm-medicaid", "chip", "tanf", "nm-works", "headstart", "htw", "cshcn", "ep-project-vida"].includes(
      program.id,
    )
  ) {
    return "texas-core";
  }

  return "other";
}

function adaptIntroForIntake(intro: string, intake: IntakeForm, language: Language) {
  if (intake.skipSensitiveInfo) {
    return language === "es"
      ? `${intro} Los campos sensibles de identidad se omitieron intencionalmente y solo deben agregarse si la persona se siente cómoda.`
      : `${intro} Sensitive identity fields were intentionally skipped and should be added only if the applicant is comfortable.`;
  }

  return intro;
}

function translateTemplate(
  template: Omit<PacketTemplate, "programs">,
  language: Language,
): Omit<PacketTemplate, "programs"> {
  if (language === "en") {
    return template;
  }

  const translations: Record<string, Omit<PacketTemplate, "programs">> = {
    "texas-core": {
      id: "texas-core",
      title: "Paquete básico de beneficios de Texas",
      subtitle: "Comida, salud y apoyo familiar",
      intro:
        "Usa este paquete para beneficios esenciales de Texas como SNAP, Medicaid, CHIP, TANF y WIC. Estos programas suelen avanzar más rápido cuando los documentos del hogar y de ingresos están listos.",
      routingNote:
        "Para residentes de El Paso, comienza con el portal de Texas Benefits y prepárate para seguimiento de HHSC o del personal de la clínica.",
    },
    disability: {
      id: "disability",
      title: "Paquete de beneficios por discapacidad",
      subtitle: "SSI, SSDI, Medicare por discapacidad y apoyo vocacional",
      intro:
        "Usa este paquete cuando la discapacidad, enfermedad crónica o necesidad de cuidado a largo plazo sea central. Aquí pesan más los expedientes médicos y el historial laboral.",
      routingNote:
        "En El Paso, normalmente habrá una mezcla de Seguro Social, Medicaid y referencias locales de discapacidad en lugar de una sola oficina.",
    },
    "housing-utilities": {
      id: "housing-utilities",
      title: "Paquete de vivienda y servicios",
      subtitle: "Renta, vales y ayuda de energía",
      intro:
        "Usa este paquete cuando el problema inmediato sea la renta, la estabilidad de vivienda o el riesgo de corte de servicios. Lleva facturas, contrato y prueba reciente de ingresos.",
      routingNote:
        "Para hogares del área de El Paso, la autoridad local de vivienda y agencias comunitarias suelen ser la primera parada.",
    },
    "mexico-support": {
      id: "mexico-support",
      title: "Paquete de apoyo de México",
      subtitle: "Orientación consular y navegación de salud fronteriza",
      intro:
        "Usa este paquete cuando la persona necesite apoyo consular, ayuda documental o servicios por referencia en la frontera en vez de un portal estándar de beneficios de EE.UU.",
      routingNote:
        "En El Paso, comienza con el Consulado de México o con servicios relacionados de navegación de salud fronteriza.",
    },
    other: {
      id: "other",
      title: "Paquete de programas adicionales",
      subtitle: "Otros programas probables",
      intro:
        "Estos programas no entraron en uno de los grupos principales, pero aun así vale la pena revisarlos.",
      routingNote:
        "Revísalos con un asistente o navegador porque la mejor ruta puede depender de la respuesta de la oficina local.",
    },
  };

  return translations[template.id] ?? template;
}

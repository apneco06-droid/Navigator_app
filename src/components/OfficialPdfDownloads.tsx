import { useState } from "react";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";
import {
  generateTexasH1010PdfPair,
} from "../lib/officialTexasPdfs";

interface OfficialPdfDownloadsProps {
  intake: IntakeFormValue;
  matches: MatchResult[];
}

interface OtherForm {
  programIds: string[];
  labelEn: string;
  labelEs: string;
  descEn: string;
  descEs: string;
  url: string;
}

const OTHER_FORMS: OtherForm[] = [
  {
    programIds: ["ssi", "ssdi"],
    labelEn: "SSI Application (SSA-8000-BK)",
    labelEs: "Solicitud SSI (SSA-8000-BK)",
    descEn: "Official Social Security Administration form for Supplemental Security Income.",
    descEs: "Formulario oficial de la Administración del Seguro Social para el Ingreso Suplementario.",
    url: "https://www.ssa.gov/forms/ssa-8000-bk.pdf",
  },
  {
    programIds: ["section8"],
    labelEn: "Section 8 Tenancy Request (HUD-52517)",
    labelEs: "Solicitud de arrendamiento Sección 8 (HUD-52517)",
    descEn: "HUD Request for Tenancy Approval — used when applying with a housing voucher.",
    descEs: "Solicitud HUD de Aprobación de Arrendamiento — se usa al aplicar con un cupón de vivienda.",
    url: "https://www.hud.gov/sites/dfiles/OCHCO/documents/52517ENG.pdf",
  },
  {
    programIds: ["ssi", "ssdi", "medicare"],
    labelEn: "Authorization to Release Medical Info (SSA-827)",
    labelEs: "Autorización para divulgar información médica (SSA-827)",
    descEn: "SSA authorization form required when applying for disability benefits.",
    descEs: "Formulario SSA requerido al solicitar beneficios por discapacidad.",
    url: "https://www.ssa.gov/forms/ssa-827.pdf",
  },
];

export function OfficialPdfDownloads({ intake, matches }: OfficialPdfDownloadsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const isSpanish = intake.language === "es";

  const texasMatches = matches.filter(({ program }) =>
    ["snap", "tanf", "medicaid", "chip", "htw"].includes(program.id),
  );

  const matchedOtherForms = OTHER_FORMS.filter((form) =>
    matches.some(({ program }) => form.programIds.includes(program.id)),
  );

  const hasAnyForms = texasMatches.length > 0 || matchedOtherForms.length > 0;

  if (!hasAnyForms) return null;

  async function handleDownloadH1010() {
    try {
      setIsGenerating(true);
      const pair = await generateTexasH1010PdfPair(intake, texasMatches);
      const base = safeName(intake);
      downloadPdf(pair.final, `${base}-texas-h1010-prefilled.pdf`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">{isSpanish ? "Formularios oficiales" : "Official forms"}</span>
        <h2>{isSpanish ? "Descargar formularios" : "Download forms"}</h2>
        <p>
          {isSpanish
            ? "Formularios prellenados con tus datos y enlaces a los documentos oficiales."
            : "Pre-filled forms with your data, plus links to the official government documents."}
        </p>
      </div>

      <div className="apply-stack">
        {texasMatches.length > 0 && (
          <article className="apply-card">
            <div className="apply-card-header">
              <div>
                <h3>{isSpanish ? "Solicitud H1010 — Texas" : "H1010 Application — Texas"}</h3>
                <p>{isSpanish ? "SNAP · Medicaid · TANF · CHIP" : "SNAP · Medicaid · TANF · CHIP"}</p>
              </div>
              <span className="category-pill">{isSpanish ? "PDF prellenado" : "Pre-filled PDF"}</span>
            </div>

            <p className="benefit-copy">
              {isSpanish
                ? "Genera un PDF de dos páginas con todos tus datos ya llenados siguiendo la estructura del H1010 oficial."
                : "Generates a 2-page PDF with all your data filled in, following the official H1010 structure."}
            </p>

            <div className="apply-submission-info">
              <p className="office-copy">
                <strong>{isSpanish ? "Formulario oficial en blanco: " : "Official blank form: "}</strong>
                <a
                  href="https://yourtexasbenefits.com/Learn/GetPaperForm?lang=en_US"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  yourtexasbenefits.com
                </a>
                {" — "}
                {isSpanish
                  ? 'busca "Formulario para solicitar beneficios"'
                  : 'look for "Form to apply for Food Benefits, Healthcare, or Cash help"'}
              </p>
            </div>

            <div className="apply-card-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleDownloadH1010}
                disabled={isGenerating}
              >
                {isGenerating
                  ? isSpanish ? "Generando PDF..." : "Generating PDF..."
                  : isSpanish ? "Descargar H1010 prellenado" : "Download pre-filled H1010"}
              </button>
            </div>
          </article>
        )}

        {matchedOtherForms.map((form) => (
          <article key={form.url} className="apply-card">
            <div className="apply-card-header">
              <div>
                <h3>{isSpanish ? form.labelEs : form.labelEn}</h3>
                <p>{isSpanish ? "Formulario federal oficial" : "Official federal form"}</p>
              </div>
              <span className="category-pill">{isSpanish ? "Enlace oficial" : "Official link"}</span>
            </div>

            <p className="benefit-copy">{isSpanish ? form.descEs : form.descEn}</p>

            <div className="apply-card-actions">
              <a
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                {isSpanish ? "Abrir formulario oficial (PDF)" : "Open official form (PDF)"}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeName(intake: IntakeFormValue) {
  const base = `${intake.firstName}-${intake.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return base.replace(/^-+|-+$/g, "") || "applicant";
}

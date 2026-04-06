import { useState } from "react";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";
import {
  generateTexasH1010PdfPair,
  generateTexasH0011Pdf,
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
  const [generatingForm, setGeneratingForm] = useState<string | null>(null);

  const isSpanish = intake.language === "es";

  const texasMatches = matches.filter(({ program }) =>
    ["snap", "tanf", "medicaid", "chip", "htw"].includes(program.id),
  );

  const snapMatches = matches.filter(({ program }) => program.id === "snap");

  // H0011 (TSAP) is the shorter SNAP form for elderly (60+) or disabled-only households
  const qualifiesForTsap =
    snapMatches.length > 0 &&
    (intake.ageBand === "65-plus" || intake.hasDisability) &&
    intake.employmentStatus !== "employed";

  const matchedOtherForms = OTHER_FORMS.filter((form) =>
    matches.some(({ program }) => form.programIds.includes(program.id)),
  );

  const hasAnyForms = texasMatches.length > 0 || matchedOtherForms.length > 0;

  if (!hasAnyForms) return null;

  async function handleDownloadH1010() {
    try {
      setGeneratingForm("h1010");
      const pair = await generateTexasH1010PdfPair(intake, texasMatches);
      const base = safeName(intake);
      downloadPdf(pair.final, `${base}-h1010-packet.pdf`);
    } finally {
      setGeneratingForm(null);
    }
  }

  async function handleDownloadH0011() {
    try {
      setGeneratingForm("h0011");
      const bytes = await generateTexasH0011Pdf(intake, snapMatches);
      const base = safeName(intake);
      downloadPdf(bytes, `${base}-h0011-tsap-packet.pdf`);
    } finally {
      setGeneratingForm(null);
    }
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">{isSpanish ? "Formularios oficiales" : "Official forms"}</span>
        <h2>{isSpanish ? "Descargar paquete de solicitud" : "Download application packet"}</h2>
        <p>
          {isSpanish
            ? "Cada descarga incluye una hoja de referencia con tus datos prellenados, seguida del formulario oficial en blanco para completar y firmar."
            : "Each download includes a pre-filled data reference sheet followed by the official blank form to complete and sign."}
        </p>
      </div>

      <div className="apply-stack">
        {texasMatches.length > 0 && (
          <article className="apply-card">
            <div className="apply-card-header">
              <div>
                <h3>{isSpanish ? "Solicitud H1010 (July 2025)" : "H1010 Application (July 2025)"}</h3>
                <p>SNAP, Medicaid, TANF, CHIP</p>
              </div>
              <span className="category-pill">{isSpanish ? "Paquete oficial" : "Full packet"}</span>
            </div>

            <p className="benefit-copy">
              {isSpanish
                ? "El paquete contiene: (1) hoja de referencia de 2 paginas con todos tus datos prellenados, (2) pagina separadora con instrucciones, y (3) el formulario oficial H1010 completo de 34 paginas."
                : "Packet contains: (1) 2-page pre-filled data sheet with all your answers, (2) separator page with instructions, and (3) the full official 34-page H1010 form to sign and submit."}
            </p>

            <div className="apply-card-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleDownloadH1010}
                disabled={generatingForm !== null}
              >
                {generatingForm === "h1010"
                  ? isSpanish ? "Generando paquete..." : "Building packet..."
                  : isSpanish ? "Descargar paquete H1010" : "Download H1010 packet"}
              </button>
            </div>
          </article>
        )}

        {qualifiesForTsap && (
          <article className="apply-card">
            <div className="apply-card-header">
              <div>
                <h3>{isSpanish ? "Solicitud simplificada H0011 (TSAP)" : "Simplified SNAP H0011 (TSAP)"}</h3>
                <p>{isSpanish ? "Solo beneficios de alimentos SNAP" : "SNAP food benefits only"}</p>
              </div>
              <span className="category-pill">{isSpanish ? "Formulario corto" : "Short form"}</span>
            </div>

            <p className="benefit-copy">
              {isSpanish
                ? "Formulario abreviado para hogares donde todos son mayores de 60 anos o reciben pagos por discapacidad y no tienen ingresos laborales."
                : "Shorter form for households where everyone is 60+ or receives disability payments and has no earned income."}
            </p>

            <div className="apply-card-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleDownloadH0011}
                disabled={generatingForm !== null}
              >
                {generatingForm === "h0011"
                  ? isSpanish ? "Generando paquete..." : "Building packet..."
                  : isSpanish ? "Descargar paquete H0011 (TSAP)" : "Download H0011 (TSAP) packet"}
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

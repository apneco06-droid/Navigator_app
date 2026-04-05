import { useState } from "react";
import { MatchResult, IntakeForm as IntakeFormValue } from "../lib/matching";
import {
  generateTexasH1010MrPdfPair,
  generateTexasH1010PdfPair,
} from "../lib/officialTexasPdfs";

interface OfficialPdfDownloadsProps {
  intake: IntakeFormValue;
  matches: MatchResult[];
}

export function OfficialPdfDownloads({ intake, matches }: OfficialPdfDownloadsProps) {
  const [isGeneratingMain, setIsGeneratingMain] = useState(false);
  const [isGeneratingMedical, setIsGeneratingMedical] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const texasMatches = matches.filter(({ program }) =>
    ["snap", "tanf", "medicaid", "chip"].includes(program.id),
  );
  const needsMedicalAddendum = texasMatches.some(({ program }) =>
    ["medicaid", "chip"].includes(program.id),
  );

  if (texasMatches.length === 0) {
    return null;
  }

  async function handleDownloadMain() {
    try {
      setIsGeneratingMain(true);
      const pair = await generateTexasH1010PdfPair(intake, texasMatches);
      const base = safeName(intake);
      if (debugMode) {
        downloadPdf(pair.preview, `${base}-texas-h1010-DEBUG.pdf`);
      }
      downloadPdf(pair.final, `${base}-texas-benefits-h1010.pdf`);
    } finally {
      setIsGeneratingMain(false);
    }
  }

  async function handleDownloadMedical() {
    try {
      setIsGeneratingMedical(true);
      const pair = await generateTexasH1010MrPdfPair(intake);
      const base = safeName(intake);
      if (debugMode) {
        downloadPdf(pair.preview, `${base}-texas-h1010-mr-DEBUG.pdf`);
      }
      downloadPdf(pair.final, `${base}-texas-benefits-h1010-mr.pdf`);
    } finally {
      setIsGeneratingMedical(false);
    }
  }

  return (
    <section className="panel mobile-panel">
      <div className="section-heading">
        <span className="eyebrow">{intake.language === "es" ? "PDFs oficiales" : "Official PDFs"}</span>
        <h2>{intake.language === "es" ? "Descargar formularios llenados" : "Download filled forms"}</h2>
        <p>
          {intake.language === "es"
            ? "Formularios oficiales de Texas ya llenados con los datos del usuario."
            : "Official Texas forms prefilled with the applicant's information."}
        </p>
      </div>

      <div className="apply-actions">
        <button
          type="button"
          className="primary-button"
          onClick={handleDownloadMain}
          disabled={isGeneratingMain}
        >
          {isGeneratingMain
            ? intake.language === "es"
              ? "Generando H1010..."
              : "Generating H1010..."
            : intake.language === "es"
              ? "Descargar H1010 lleno"
              : "Download filled H1010"}
        </button>

        {needsMedicalAddendum ? (
          <button
            type="button"
            className="secondary-button"
            onClick={handleDownloadMedical}
            disabled={isGeneratingMedical}
          >
            {isGeneratingMedical
              ? intake.language === "es"
                ? "Generando H1010-MR..."
                : "Generating H1010-MR..."
              : intake.language === "es"
                ? "Descargar H1010-MR lleno"
                : "Download filled H1010-MR"}
          </button>
        ) : null}
      </div>

      <div className="debug-toggle-row">
        <label className="debug-toggle-label">
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          <span>
            {intake.language === "es"
              ? "Modo de calibración: también descarga el PDF con bordes de campo visibles"
              : "Calibration mode: also download the PDF with visible field borders"}
          </span>
        </label>
      </div>
    </section>
  );
}

function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const copy = new Uint8Array(pdfBytes);
  const blob = new Blob([copy.buffer as ArrayBuffer], { type: "application/pdf" });
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

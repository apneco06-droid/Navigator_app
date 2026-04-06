/**
 * PDF Generator — Texas Benefits Application
 *
 * Loads the official H1010 / H1010-MR forms and overlays applicant data
 * at calibrated pixel coordinates, producing a properly pre-filled PDF
 * that matches the actual HHSC form layout.
 *
 * WinAnsi rule: all strings passed to drawText() must be ASCII-only.
 */

import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { IntakeForm, MatchResult } from "./matching";

// ─────────────────────────────────────────────────────────────────────────────
// FORM PATHS
// ─────────────────────────────────────────────────────────────────────────────

const H1010_URL = "/forms/H1010_Apr2024_3.pdf";
const H1010_MR_URL = "/forms/H1010-MR.pdf";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Rect = { x: number; y: number; width: number; height: number };

/** Both a clean final PDF and a debug preview (same content in this generator). */
export interface PdfPair {
  final: Uint8Array;
  preview: Uint8Array;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOW-LEVEL DRAWING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a string to uppercase for consistent form appearance.
 * Government forms conventionally use ALL-CAPS for name/address data.
 */
function up(text: string): string {
  return (text || "").trim().toUpperCase();
}

/**
 * Draws text centred inside a field rectangle.
 *
 * Vertical alignment uses Helvetica's cap-height ratio (~0.72 × em size)
 * so uppercase letters appear visually centred — not the full em box.
 */
function drawField(
  page: PDFPage,
  text: string,
  rect: Rect,
  size: number,
  font: any,
  color: ReturnType<typeof rgb>,
  align: "left" | "center" = "left",
) {
  const value = (text || "").trim();
  if (!value) return;

  const hPad    = 4;
  const maxWidth = rect.width - hPad * 2;
  let content = value;
  while (content.length > 0 && font.widthOfTextAtSize(content, size) > maxWidth) {
    content = content.slice(0, -1);
  }

  const textWidth = font.widthOfTextAtSize(content, size);
  const x =
    align === "center"
      ? rect.x + Math.max((rect.width - textWidth) / 2, hPad)
      : rect.x + hPad;

  // Cap-height centering: Helvetica cap height ≈ 0.72 × em size.
  // This baseline places uppercase letters visually centred in the rect.
  const capHeight = size * 0.72;
  const y = rect.y + Math.max((rect.height - capHeight) / 2, 1);

  page.drawText(content, { x, y, size, font, color });
}

function drawMark(page: PDFPage, x: number, y: number, font: any) {
  page.drawText("X", { x, y, size: 13, font, color: rgb(0.08, 0.08, 0.08) });
}

function drawYesNo(
  page: PDFPage,
  yes: boolean,
  yesX: number,
  yesY: number,
  noX: number,
  noY: number,
  font: any,
) {
  drawMark(page, yes ? yesX : noX, yes ? yesY : noY, font);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

function formatPhone(value: string) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value || "";
}

function formatSsn(value: string) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return value || "";
}

function fullName(intake: IntakeForm) {
  return [intake.firstName, intake.middleName, intake.lastName].filter(Boolean).join(" ");
}

function monthlyIncomeToAmount(band: IntakeForm["monthlyIncomeBand"]): string {
  const map: Record<string, string> = {
    "under-1000": "900",
    "1000-2000": "1500",
    "2000-3500": "2750",
    "3500-plus": "3500+",
  };
  return map[band] ?? "";
}

function estimatedHousingAmount(intake: IntakeForm): string {
  if (intake.needsHousingHelp || intake.needsUtilityHelp) {
    return intake.needsHousingHelp ? "800" : "250";
  }
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF LOADER
// ─────────────────────────────────────────────────────────────────────────────

async function loadPdf(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot load form from ${url}`);
  const pdfDoc = await PDFDocument.load(await response.arrayBuffer());
  return { pdfDoc, pages: pdfDoc.getPages() };
}

// ─────────────────────────────────────────────────────────────────────────────
// H1010 PAGE FILL FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page 1 of the H1010 form (PDF page index 4).
 * Covers: program selection checkboxes, applicant name, SSN, DOB,
 * home address, phone numbers, mailing address, and income/housing.
 */
function fillH1010Page1(
  page: PDFPage,
  intake: IntakeForm,
  matches: MatchResult[],
  font: any,
  boldFont: any,
) {
  const selected = new Set(matches.map(({ program }) => program.id));
  const black = rgb(0.08, 0.08, 0.08);
  const inputSize = 12;
  const smallSize = 11;

  // Program selection checkboxes
  if (selected.has("snap"))       drawMark(page, 207, 649, boldFont);
  if (selected.has("tanf"))       drawMark(page, 351, 649, boldFont);
  if (selected.has("chip"))       drawMark(page, 468, 681, boldFont);
  if (selected.has("medicaid") && intake.childrenUnder19)  drawMark(page, 468, 656, boldFont);
  if (selected.has("medicaid") && !intake.childrenUnder19) drawMark(page, 468, 632, boldFont);
  if (intake.pregnantOrPostpartum) drawMark(page, 468, 608, boldFont);

  // Applicant name
  drawField(page, up(intake.firstName),  { x: 157, y: 526, width: 115, height: 18 }, inputSize, font, black, "center");
  drawField(page, up(intake.middleName), { x: 316, y: 526, width:  98, height: 18 }, inputSize, font, black, "center");
  drawField(page, up(intake.lastName),   { x: 476, y: 526, width:  88, height: 18 }, inputSize, font, black, "center");

  // SSN and DOB
  drawField(page, formatSsn(intake.socialSecurityNumber), { x: 320, y: 479, width: 105, height: 18 }, inputSize, font, black, "center");
  drawField(page, intake.dateOfBirth,                     { x: 443, y: 479, width: 118, height: 18 }, inputSize, font, black, "center");

  // Home address
  drawField(page, up(intake.address), { x: 320, y: 455, width: 243, height: 18 }, inputSize, font,     black);
  drawField(page, up(intake.city),    { x: 320, y: 407, width: 108, height: 18 }, inputSize, font,     black, "center");
  drawField(page, "TX",               { x: 430, y: 407, width:  59, height: 18 }, inputSize, boldFont, black, "center");
  drawField(page, intake.zipCode,     { x: 541, y: 407, width:  36, height: 18 }, inputSize, font,     black, "center");

  // Phone numbers
  drawField(page, formatPhone(intake.phone),                     { x: 320, y: 359, width: 108, height: 18 }, inputSize, font, black, "center");
  drawField(page, formatPhone(intake.cellPhone || intake.phone), { x: 443, y: 359, width: 118, height: 18 }, inputSize, font, black, "center");

  // Mailing address (same as home)
  drawField(page, up(intake.address), { x: 320, y: 310, width: 243, height: 18 }, inputSize, font,     black);
  drawField(page, up(intake.county),  { x: 430, y: 310, width: 133, height: 18 }, inputSize, font,     black, "center");
  drawField(page, up(intake.city),    { x: 320, y: 262, width: 108, height: 18 }, inputSize, font,     black, "center");
  drawField(page, "TX",               { x: 430, y: 262, width:  59, height: 18 }, inputSize, boldFont, black, "center");
  drawField(page, intake.zipCode,     { x: 541, y: 262, width:  36, height: 18 }, inputSize, font,     black, "center");

  // Income and housing
  const hasIncome = monthlyIncomeToAmount(intake.monthlyIncomeBand) !== "";
  drawYesNo(page, false,      438, 144, 481, 144, boldFont);
  drawYesNo(page, hasIncome,  438, 112, 474, 112, boldFont);
  drawField(page, monthlyIncomeToAmount(intake.monthlyIncomeBand), { x: 515, y: 101, width: 53, height: 16 }, smallSize, font, black, "center");
  drawYesNo(page, hasIncome,  438, 82, 474, 82, boldFont);
  drawField(page, monthlyIncomeToAmount(intake.monthlyIncomeBand), { x: 515, y: 70,  width: 53, height: 16 }, smallSize, font, black, "center");
  const hasHousing = intake.needsHousingHelp || intake.needsUtilityHelp;
  drawYesNo(page, hasHousing, 438, 49, 474, 49, boldFont);
  drawField(page, estimatedHousingAmount(intake), { x: 515, y: 38, width: 53, height: 16 }, smallSize, font, black, "center");
}

/**
 * Page 2 of the H1010 form (PDF page index 5).
 * Covers: pregnancy, military status, interview language, and interpreter needs.
 */
function fillH1010Page2(
  page: PDFPage,
  intake: IntakeForm,
  font: any,
  boldFont: any,
) {
  const black = rgb(0.08, 0.08, 0.08);
  const interviewLang = intake.interviewLanguage ||
    (intake.language === "es" ? "Spanish" : "English");

  drawYesNo(page, intake.pregnantOrPostpartum, 512, 699, 554, 699, boldFont);
  drawYesNo(page, intake.isActiveDuty,         512, 470, 554, 470, boldFont);
  drawYesNo(page, intake.isVeteran,            512, 414, 554, 414, boldFont);
  drawYesNo(page, intake.needsInterviewHelp,   513, 213, 556, 213, boldFont);
  drawYesNo(page, intake.interviewHelpDetails.trim().length > 0, 513, 163, 556, 163, boldFont);
  drawField(page, up(interviewLang), { x: 362, y: 86, width: 196, height: 18 }, 11, font, black, "center");
  drawYesNo(page, intake.needsInterpreter, 514, 52, 556, 52, boldFont);

  if (intake.needsInterpreter) {
    const lang = (intake.interpreterLanguage || intake.language).toLowerCase();
    if (lang.includes("span") || lang === "es") {
      drawMark(page, 179, 20, boldFont);
    } else {
      drawField(page, up(intake.interpreterLanguage), { x: 364, y: 6, width: 194, height: 18 }, 10.5, font, black, "center");
    }
  }

  drawField(page, formatSsn(intake.socialSecurityNumber), { x: 63, y: 0, width: 131, height: 18 }, 11, font, black, "center");
}

/**
 * Page 16 of the H1010 form (PDF page index 19).
 * Covers: applicant name, language preference, preferred contact method, and SSN.
 */
function fillH1010Page16(
  page: PDFPage,
  intake: IntakeForm,
  font: any,
  boldFont: any,
) {
  const black = rgb(0.08, 0.08, 0.08);
  const interviewLang = intake.interviewLanguage ||
    (intake.language === "es" ? "Spanish" : "English");

  drawField(page, up(fullName(intake)), { x: 337, y: 320, width: 224, height: 18 }, 12, font, black, "center");
  drawField(page, up(interviewLang),    { x: 336, y: 290, width: 225, height: 18 }, 12, font, black, "center");

  if (intake.preferredContactMethod === "phone") {
    drawMark(page, 145, 247, boldFont);
    drawField(page, formatPhone(intake.phone), { x: 438, y: 246, width: 112, height: 18 }, 12, font, black, "center");
  }
  if (intake.preferredContactMethod === "text") {
    drawMark(page, 145, 196, boldFont);
    drawField(page, formatPhone(intake.cellPhone || intake.phone), { x: 438, y: 195, width: 112, height: 18 }, 12, font, black, "center");
  }
  if (intake.preferredContactMethod === "email") {
    drawMark(page, 145, 145, boldFont);
    drawField(page, intake.email.toLowerCase(), { x: 332, y: 145, width: 228, height: 18 }, 11, font, black, "center");
  }

  drawField(page, formatSsn(intake.socialSecurityNumber), { x: 69, y: 16, width: 126, height: 18 }, 11, font, black, "center");
}

// ─────────────────────────────────────────────────────────────────────────────
// H1010-MR PAGE FILL FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page 1 of the H1010-MR (Medical Records) addendum (PDF page index 0).
 * Covers: applicant name, spouse, tax filing status, and dependents.
 */
function fillH1010MrPage1(
  page: PDFPage,
  intake: IntakeForm,
  font: any,
  boldFont: any,
) {
  const black = rgb(0.08, 0.08, 0.08);

  drawField(page, up(intake.firstName),  { x: 135, y: 390, width: 100, height: 16 }, 10.5, font, black, "center");
  drawField(page, up(intake.middleName), { x: 260, y: 390, width:  92, height: 16 }, 10.5, font, black, "center");
  drawField(page, up(intake.lastName),   { x: 404, y: 390, width: 116, height: 16 }, 10.5, font, black, "center");
  drawField(page, up(intake.spouseName), { x: 136, y: 341, width: 386, height: 16 }, 10.5, font, black, "center");

  drawYesNo(page, intake.plansToFileTaxes    === "yes", 521, 282, 560, 282, boldFont);
  drawYesNo(page, intake.filesJointly        === "yes", 521, 246, 560, 246, boldFont);
  drawYesNo(page, intake.claimsDependents    === "yes", 521, 211, 560, 211, boldFont);
  drawField(page, up(intake.dependentNames), { x: 136, y: 167, width: 388, height: 16 }, 9.5, font, black, "center");
  drawYesNo(page, intake.claimedAsDependent  === "yes", 521, 136, 560, 136, boldFont);
  drawField(page, up(intake.taxFilerName),   { x: 136, y: 106, width: 255, height: 16 }, 10.5, font, black, "center");
  drawField(page, up(intake.taxRelationship),{ x: 414, y: 106, width: 120, height: 16 }, 10,   font, black, "center");
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the H1010 pre-filled PDF.
 * Loads the official H1010 (April 2024) form and overlays applicant data
 * on pages 1, 2, and 16 at calibrated coordinates.
 */
export async function generateTexasH1010Pdf(
  intake: IntakeForm,
  matches: MatchResult[],
): Promise<Uint8Array> {
  return (await generateTexasH1010PdfPair(intake, matches)).final;
}

export async function generateTexasH1010PdfPair(
  intake: IntakeForm,
  matches: MatchResult[],
): Promise<PdfPair> {
  const { pdfDoc, pages } = await loadPdf(H1010_URL);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  fillH1010Page1 (pages[4],  intake, matches, font, boldFont);
  fillH1010Page2 (pages[5],  intake,          font, boldFont);
  fillH1010Page16(pages[19], intake,          font, boldFont);

  const bytes = await pdfDoc.save();
  return { final: bytes, preview: bytes };
}

/**
 * Generates the H1010-MR (Medical Records) addendum pre-filled PDF.
 * Loads the official H1010-MR form and overlays applicant tax / dependent data.
 */
export async function generateTexasH1010MrPdf(
  intake: IntakeForm,
): Promise<Uint8Array> {
  return (await generateTexasH1010MrPdfPair(intake)).final;
}

export async function generateTexasH1010MrPdfPair(
  intake: IntakeForm,
): Promise<PdfPair> {
  const { pdfDoc, pages } = await loadPdf(H1010_MR_URL);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  fillH1010MrPage1(pages[0], intake, font, boldFont);

  const bytes = await pdfDoc.save();
  return { final: bytes, preview: bytes };
}

/**
 * Generates a basic data-sheet PDF for the H0011 (TSAP / SNAP simplified) form.
 * Used for elderly (60+) or disabled households with no earned income.
 * Returns a filled H0011 packet with key applicant fields overlaid.
 */
export async function generateTexasH0011Pdf(
  intake: IntakeForm,
  _matches: MatchResult[],
): Promise<Uint8Array> {
  const { pdfDoc, pages } = await loadPdf("/forms/H0011.pdf");
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  void boldFont;

  // H0011 page 0 — best-effort overlay of applicant name, address, SSN
  // (Coordinates estimated from the July 2025 H0011 static layout)
  const black = rgb(0.08, 0.08, 0.08);
  const p = pages[0];
  const { height } = p.getSize();

  const fieldY = (formY: number) => height - formY;

  drawField(p, up(intake.firstName),                   { x: 140, y: fieldY(230), width:  95, height: 16 }, 10, font, black, "center");
  drawField(p, up(intake.middleName),                  { x: 248, y: fieldY(230), width:  80, height: 16 }, 10, font, black, "center");
  drawField(p, up(intake.lastName),                    { x: 340, y: fieldY(230), width: 105, height: 16 }, 10, font, black, "center");
  drawField(p, up(intake.address),                     { x: 140, y: fieldY(258), width: 310, height: 16 }, 10, font, black);
  drawField(p, up(intake.city),                        { x: 140, y: fieldY(286), width: 120, height: 16 }, 10, font, black, "center");
  drawField(p, "TX",                                   { x: 270, y: fieldY(286), width:  40, height: 16 }, 10, font, black, "center");
  drawField(p, intake.zipCode,                         { x: 320, y: fieldY(286), width:  55, height: 16 }, 10, font, black, "center");
  drawField(p, formatPhone(intake.phone),              { x: 140, y: fieldY(316), width: 140, height: 16 }, 10, font, black, "center");
  drawField(p, formatSsn(intake.socialSecurityNumber), { x: 340, y: fieldY(316), width: 110, height: 16 }, 10, font, black, "center");
  drawField(p, intake.householdSize,                   { x: 140, y: fieldY(344), width:  80, height: 16 }, 10, font, black, "center");

  const bytes = await pdfDoc.save();
  return bytes;
}

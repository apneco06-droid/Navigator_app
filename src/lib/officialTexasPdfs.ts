/**
 * PDF Fill Engine — H1010 Texas Benefits Application
 *
 * Architecture:
 *  1. ENGINE TYPES         — typed declarations for fields, checkboxes, templates
 *  2. DATA EXTRACTION      — maps IntakeForm → flat PdfDataValues (AI extracts structure, not coordinates)
 *  3. TEMPLATE DEFINITIONS — per-page coordinate declarations (developer calibrates, not AI)
 *  4. ENGINE FUNCTIONS     — AcroForm detection, text-in-box rendering, coordinate conversion
 *  5. PUBLIC API           — generateTexasH1010Pdf, generateTexasH1010MrPdf, *PdfPair variants
 *  6. UTILITY FUNCTIONS    — formatPhone, formatSsn, etc.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { IntakeForm, MatchResult } from "./matching";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ENGINE TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PdfPage = ReturnType<PDFDocument["getPages"]>[number];
type PdfFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;
type RgbColor = ReturnType<typeof rgb>;

type Rect = { x: number; y: number; width: number; height: number };
type Alignment = "left" | "center" | "right";
type FontWeight = "regular" | "bold";

/**
 * One text field to be filled on a page.
 * x/y are in the coordinate system indicated by originY.
 */
interface FieldTemplate {
  /** Key into PdfDataValues. If fixedValue is set, key is ignored for value lookup. */
  key: string;
  /** Bounding rectangle that contains the text. */
  rect: Rect;
  /**
   * Y-axis origin for the rect coordinates.
   * "bottom" (default) = PDF standard — (0, 0) is bottom-left corner.
   * "top"              = top-left origin — y is distance from top of page.
   */
  originY?: "top" | "bottom";
  /** Horizontal text alignment within the box (default "left"). */
  align?: Alignment;
  /** Allow text to wrap to multiple lines (default false). */
  multiline?: boolean;
  /**
   * Starting font size for autosizing (default 12).
   * The engine shrinks the font until the text fits, stopping at minFontSize.
   */
  maxFontSize?: number;
  /** Minimum font size before hard truncation (default 7). */
  minFontSize?: number;
  /** Which embedded font to use (default "regular"). */
  font?: FontWeight;
  /** When set, always writes this literal string. The key is not consulted. */
  fixedValue?: string;
  /**
   * AcroForm field name if the PDF has fillable fields.
   * When the engine detects AcroForm fields it uses this name directly.
   */
  acroFieldName?: string;
}

/**
 * A checkbox or single-character mark placed at a point.
 * The mark is drawn when Boolean(values[key]) === true.
 */
interface CheckboxTemplate {
  /** Key into PdfDataValues. Mark drawn when truthy. */
  key: string;
  x: number;
  y: number;
  originY?: "top" | "bottom";
  /** Mark glyph size in pt (default 13). */
  size?: number;
  /** AcroForm checkbox field name if applicable. */
  acroFieldName?: string;
}

/** All field and checkbox definitions for one PDF page. */
interface PageTemplate {
  /** 0-based index into pdfDoc.getPages(). */
  pageIndex: number;
  /**
   * Page height in pt, used when originY is "top".
   * If omitted the engine reads it from the page at runtime.
   */
  pageHeight?: number;
  fields: FieldTemplate[];
  checkboxes?: CheckboxTemplate[];
}

/** Options passed to the fill pipeline. */
interface PdfFillOptions {
  /**
   * When true, draws a colored border around every target field
   * so coordinates can be visually calibrated.
   * Red  = text fields with values
   * Grey = text fields that are empty
   * Green = checkboxes
   */
  debug: boolean;
}

/**
 * A flat key→value map the engine reads from.
 * AI extracts structured user data into this shape.
 * Coordinates are never stored here — only data values.
 */
type PdfDataValues = Record<string, string | boolean | number>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. DATA EXTRACTION
//    Maps IntakeForm + MatchResult[] → PdfDataValues.
//    All business logic (what value goes in what field) lives here, not
//    in the template coordinate declarations below.
// ─────────────────────────────────────────────────────────────────────────────

interface H1010Data extends PdfDataValues {
  firstName: string;
  middleName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  stateAbbr: string;
  zipCode: string;
  phone: string;
  cellPhone: string;
  county: string;
  estimatedIncome: string;
  estimatedHousing: string;

  // Page 1 checkboxes — benefit selection
  applySnap: boolean;
  applyTanf: boolean;
  applyChip: boolean;
  applyMedicaidChildren: boolean;
  applyMedicaidAdult: boolean;
  isPregnantForBenefits: boolean;

  // Page 1 yes/no income rows
  // Row 1 is always "no" per form instructions for this intake path
  incomeRow1Yes: boolean;
  incomeRow1No: boolean;
  incomeRow2Yes: boolean;
  incomeRow2No: boolean;
  incomeRow3Yes: boolean;
  incomeRow3No: boolean;
  housingRow1Yes: boolean;
  housingRow1No: boolean;

  // Page 2
  isPregnantOrPostpartum: boolean;
  notPregnantOrPostpartum: boolean;
  isActiveDuty: boolean;
  notActiveDuty: boolean;
  isVeteran: boolean;
  notVeteran: boolean;
  needsInterviewHelp: boolean;
  notNeedsInterviewHelp: boolean;
  hasInterviewDetails: boolean;
  notHasInterviewDetails: boolean;
  interviewLanguage: string;
  needsInterpreter: boolean;
  notNeedsInterpreter: boolean;
  interpreterIsSpanish: boolean;
  interpreterCustomLanguage: string;
  ssnPage2: string;

  // Page 16
  fullName: string;
  interviewLanguagePage16: string;
  preferContactPhone: boolean;
  preferContactText: boolean;
  preferContactEmail: boolean;
  contactPhoneValue: string;
  contactCellValue: string;
  contactEmailValue: string;
  ssnPage16: string;
}

function extractH1010Data(intake: IntakeForm, matches: MatchResult[]): H1010Data {
  const selected = new Set(matches.map(({ program }) => program.id));
  const hasMedicaid = selected.has("medicaid");
  const hasIncome = monthlyIncomeEstimate(intake.monthlyIncomeBand) !== "";
  const hasHousing = intake.needsHousingHelp || intake.needsUtilityHelp;
  const interviewLang = intake.interviewLanguage || (intake.language === "es" ? "Spanish" : "English");
  const interpIsSpanish = (intake.interpreterLanguage || intake.language).toLowerCase().includes("span");
  const preferPhone = intake.preferredContactMethod === "phone";
  const preferText = intake.preferredContactMethod === "text";
  const preferEmail = intake.preferredContactMethod === "email";
  const hasInterviewDetails = intake.interviewHelpDetails.trim().length > 0;

  return {
    firstName: intake.firstName,
    middleName: intake.middleName || "",
    lastName: intake.lastName,
    ssn: formatSsn(intake.socialSecurityNumber),
    dateOfBirth: formatDate(intake.dateOfBirth),
    address: intake.address,
    city: intake.city,
    stateAbbr: "TX",
    zipCode: intake.zipCode,
    phone: formatPhone(intake.phone),
    cellPhone: formatPhone(intake.cellPhone || intake.phone),
    county: intake.county,
    estimatedIncome: monthlyIncomeEstimate(intake.monthlyIncomeBand),
    estimatedHousing: estimatedHousingAmount(intake),

    applySnap: selected.has("snap"),
    applyTanf: selected.has("tanf"),
    applyChip: selected.has("chip"),
    applyMedicaidChildren: hasMedicaid && intake.childrenUnder19,
    applyMedicaidAdult: hasMedicaid && !intake.childrenUnder19,
    isPregnantForBenefits: intake.pregnantOrPostpartum,

    incomeRow1Yes: false,
    incomeRow1No: true,
    incomeRow2Yes: hasIncome,
    incomeRow2No: !hasIncome,
    incomeRow3Yes: hasIncome,
    incomeRow3No: !hasIncome,
    housingRow1Yes: hasHousing,
    housingRow1No: !hasHousing,

    isPregnantOrPostpartum: intake.pregnantOrPostpartum,
    notPregnantOrPostpartum: !intake.pregnantOrPostpartum,
    isActiveDuty: intake.isActiveDuty,
    notActiveDuty: !intake.isActiveDuty,
    isVeteran: intake.isVeteran,
    notVeteran: !intake.isVeteran,
    needsInterviewHelp: intake.needsInterviewHelp,
    notNeedsInterviewHelp: !intake.needsInterviewHelp,
    hasInterviewDetails,
    notHasInterviewDetails: !hasInterviewDetails,
    interviewLanguage: interviewLang,
    needsInterpreter: intake.needsInterpreter,
    notNeedsInterpreter: !intake.needsInterpreter,
    interpreterIsSpanish: intake.needsInterpreter && interpIsSpanish,
    interpreterCustomLanguage: intake.needsInterpreter && !interpIsSpanish ? (intake.interpreterLanguage || "") : "",
    ssnPage2: formatSsn(intake.socialSecurityNumber),

    fullName: [intake.firstName, intake.middleName, intake.lastName].filter(Boolean).join(" "),
    interviewLanguagePage16: interviewLang,
    preferContactPhone: preferPhone,
    preferContactText: preferText,
    preferContactEmail: preferEmail,
    contactPhoneValue: preferPhone ? formatPhone(intake.phone) : "",
    contactCellValue: preferText ? formatPhone(intake.cellPhone || intake.phone) : "",
    contactEmailValue: preferEmail ? intake.email : "",
    ssnPage16: formatSsn(intake.socialSecurityNumber),
  };
}

interface H1010MrData extends PdfDataValues {
  firstName: string;
  middleName: string;
  lastName: string;
  spouseName: string;
  dependentNames: string;
  taxFilerName: string;
  taxRelationship: string;

  plansToFileTaxesYes: boolean;
  plansToFileTaxesNo: boolean;
  filesJointlyYes: boolean;
  filesJointlyNo: boolean;
  claimsDependentsYes: boolean;
  claimsDependentsNo: boolean;
  claimedAsDependentYes: boolean;
  claimedAsDependentNo: boolean;
}

function extractH1010MrData(intake: IntakeForm): H1010MrData {
  return {
    firstName: intake.firstName,
    middleName: intake.middleName || "",
    lastName: intake.lastName,
    spouseName: intake.spouseName || "",
    dependentNames: intake.dependentNames || "",
    taxFilerName: intake.taxFilerName || "",
    taxRelationship: intake.taxRelationship || "",

    plansToFileTaxesYes: intake.plansToFileTaxes === "yes",
    plansToFileTaxesNo: intake.plansToFileTaxes === "no",
    filesJointlyYes: intake.filesJointly === "yes",
    filesJointlyNo: intake.filesJointly === "no",
    claimsDependentsYes: intake.claimsDependents === "yes",
    claimsDependentsNo: intake.claimsDependents === "no",
    claimedAsDependentYes: intake.claimedAsDependent === "yes",
    claimedAsDependentNo: intake.claimedAsDependent === "no",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEMPLATE DEFINITIONS
//    Coordinates are measured from the existing PDFs.
//    originY defaults to "bottom" (PDF standard: bottom-left origin).
//    To use top-left coordinates, set originY: "top" and optionally pageHeight.
// ─────────────────────────────────────────────────────────────────────────────

const H1010_PAGE1: PageTemplate = {
  pageIndex: 4,
  fields: [
    { key: "firstName",        rect: { x: 157, y: 526, width: 115, height: 18 }, align: "center" },
    { key: "middleName",       rect: { x: 316, y: 526, width:  98, height: 18 }, align: "center" },
    { key: "lastName",         rect: { x: 476, y: 526, width:  88, height: 18 }, align: "center" },
    { key: "ssn",              rect: { x: 320, y: 479, width: 105, height: 18 }, align: "center" },
    { key: "dateOfBirth",      rect: { x: 443, y: 479, width: 118, height: 18 }, align: "center" },
    { key: "address",          rect: { x: 320, y: 455, width: 243, height: 18 }, align: "left"   },
    { key: "city",             rect: { x: 320, y: 407, width: 108, height: 18 }, align: "center" },
    { key: "stateAbbr",        rect: { x: 430, y: 407, width:  59, height: 18 }, align: "center", font: "bold" },
    { key: "zipCode",          rect: { x: 541, y: 407, width:  36, height: 18 }, align: "center" },
    { key: "phone",            rect: { x: 320, y: 359, width: 108, height: 18 }, align: "center" },
    { key: "cellPhone",        rect: { x: 443, y: 359, width: 118, height: 18 }, align: "center" },
    { key: "address",          rect: { x: 320, y: 310, width: 243, height: 18 }, align: "left"   }, // mailing = home
    { key: "county",           rect: { x: 430, y: 310, width: 133, height: 18 }, align: "center" },
    { key: "city",             rect: { x: 320, y: 262, width: 108, height: 18 }, align: "center" },
    { key: "stateAbbr",        rect: { x: 430, y: 262, width:  59, height: 18 }, align: "center", font: "bold" },
    { key: "zipCode",          rect: { x: 541, y: 262, width:  36, height: 18 }, align: "center" },
    { key: "estimatedIncome",  rect: { x: 515, y: 101, width:  53, height: 16 }, align: "center", maxFontSize: 11 },
    { key: "estimatedIncome",  rect: { x: 515, y:  70, width:  53, height: 16 }, align: "center", maxFontSize: 11 },
    { key: "estimatedHousing", rect: { x: 515, y:  38, width:  53, height: 16 }, align: "center", maxFontSize: 11 },
  ],
  checkboxes: [
    // Benefit selection
    { key: "applySnap",             x: 207, y: 649 },
    { key: "applyTanf",             x: 351, y: 649 },
    { key: "applyChip",             x: 468, y: 681 },
    { key: "applyMedicaidChildren", x: 468, y: 656 },
    { key: "applyMedicaidAdult",    x: 468, y: 632 },
    { key: "isPregnantForBenefits", x: 468, y: 608 },
    // Income/housing yes-no rows
    { key: "incomeRow1Yes",  x: 438, y: 144 },
    { key: "incomeRow1No",   x: 481, y: 144 },
    { key: "incomeRow2Yes",  x: 438, y: 112 },
    { key: "incomeRow2No",   x: 474, y: 112 },
    { key: "incomeRow3Yes",  x: 438, y:  82 },
    { key: "incomeRow3No",   x: 474, y:  82 },
    { key: "housingRow1Yes", x: 438, y:  49 },
    { key: "housingRow1No",  x: 474, y:  49 },
  ],
};

const H1010_PAGE2: PageTemplate = {
  pageIndex: 5,
  fields: [
    { key: "interviewLanguage",       rect: { x: 362, y:  86, width: 196, height: 18 }, align: "center" },
    { key: "interpreterCustomLanguage", rect: { x: 364, y:   6, width: 194, height: 18 }, align: "center", maxFontSize: 10.5 },
    { key: "ssnPage2",                rect: { x:  63, y:   0, width: 131, height: 18 }, align: "center", maxFontSize: 11 },
  ],
  checkboxes: [
    { key: "isPregnantOrPostpartum",  x: 512, y: 699 },
    { key: "notPregnantOrPostpartum", x: 554, y: 699 },
    { key: "isActiveDuty",            x: 512, y: 470 },
    { key: "notActiveDuty",           x: 554, y: 470 },
    { key: "isVeteran",               x: 512, y: 414 },
    { key: "notVeteran",              x: 554, y: 414 },
    { key: "needsInterviewHelp",      x: 513, y: 213 },
    { key: "notNeedsInterviewHelp",   x: 556, y: 213 },
    { key: "hasInterviewDetails",     x: 513, y: 163 },
    { key: "notHasInterviewDetails",  x: 556, y: 163 },
    { key: "needsInterpreter",        x: 514, y:  52 },
    { key: "notNeedsInterpreter",     x: 556, y:  52 },
    { key: "interpreterIsSpanish",    x: 179, y:  20 },
  ],
};

const H1010_PAGE16: PageTemplate = {
  pageIndex: 19,
  fields: [
    { key: "fullName",              rect: { x: 337, y: 320, width: 224, height: 18 }, align: "center" },
    { key: "interviewLanguagePage16", rect: { x: 336, y: 290, width: 225, height: 18 }, align: "center" },
    { key: "contactPhoneValue",     rect: { x: 438, y: 246, width: 112, height: 18 }, align: "center" },
    { key: "contactCellValue",      rect: { x: 438, y: 195, width: 112, height: 18 }, align: "center" },
    { key: "contactEmailValue",     rect: { x: 332, y: 145, width: 228, height: 18 }, align: "center", maxFontSize: 11 },
    { key: "ssnPage16",             rect: { x:  69, y:  16, width: 126, height: 18 }, align: "center", maxFontSize: 11 },
  ],
  checkboxes: [
    { key: "preferContactPhone", x: 145, y: 247 },
    { key: "preferContactText",  x: 145, y: 196 },
    { key: "preferContactEmail", x: 145, y: 145 },
  ],
};

const H1010MR_PAGE1: PageTemplate = {
  pageIndex: 0,
  fields: [
    { key: "firstName",      rect: { x: 135, y: 390, width: 100, height: 16 }, align: "center", maxFontSize: 10.5 },
    { key: "middleName",     rect: { x: 260, y: 390, width:  92, height: 16 }, align: "center", maxFontSize: 10.5 },
    { key: "lastName",       rect: { x: 404, y: 390, width: 116, height: 16 }, align: "center", maxFontSize: 10.5 },
    { key: "spouseName",     rect: { x: 136, y: 341, width: 386, height: 16 }, align: "center", maxFontSize: 10.5 },
    { key: "dependentNames", rect: { x: 136, y: 167, width: 388, height: 16 }, align: "center", maxFontSize: 9.5  },
    { key: "taxFilerName",   rect: { x: 136, y: 106, width: 255, height: 16 }, align: "center", maxFontSize: 10.5 },
    { key: "taxRelationship",rect: { x: 414, y: 106, width: 120, height: 16 }, align: "center", maxFontSize: 10   },
  ],
  checkboxes: [
    { key: "plansToFileTaxesYes",      x: 521, y: 282 },
    { key: "plansToFileTaxesNo",       x: 560, y: 282 },
    { key: "filesJointlyYes",          x: 521, y: 246 },
    { key: "filesJointlyNo",           x: 560, y: 246 },
    { key: "claimsDependentsYes",      x: 521, y: 211 },
    { key: "claimsDependentsNo",       x: 560, y: 211 },
    { key: "claimedAsDependentYes",    x: 521, y: 136 },
    { key: "claimedAsDependentNo",     x: 560, y: 136 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ENGINE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── AcroForm detection ────────────────────────────────────────────────────────

function hasAcroFormFields(pdfDoc: PDFDocument): boolean {
  try {
    return pdfDoc.getForm().getFields().length > 0;
  } catch {
    return false;
  }
}

function fillAcroFormFields(
  pdfDoc: PDFDocument,
  values: PdfDataValues,
  templates: PageTemplate[],
): void {
  const form = pdfDoc.getForm();
  for (const template of templates) {
    for (const field of template.fields) {
      if (!field.acroFieldName) continue;
      const value = field.fixedValue !== undefined
        ? field.fixedValue
        : String(values[field.key] ?? "");
      if (!value.trim()) continue;
      try {
        form.getTextField(field.acroFieldName).setText(value);
      } catch {
        // Field not present or wrong type — silently skip
      }
    }
    for (const cb of template.checkboxes ?? []) {
      if (!cb.acroFieldName) continue;
      try {
        const f = form.getCheckBox(cb.acroFieldName);
        if (Boolean(values[cb.key])) {
          f.check();
        } else {
          f.uncheck();
        }
      } catch {
        // Not present — skip
      }
    }
  }
}

// ── Coordinate helpers ────────────────────────────────────────────────────────

/** Returns effective page height accounting for rotation. */
function pageHeight(page: PdfPage): number {
  const { width, height } = page.getSize();
  const angle = page.getRotation().angle % 360;
  return angle === 90 || angle === 270 ? width : height;
}

/** Returns effective page width accounting for rotation. */
function pageWidth(page: PdfPage): number {
  const { width, height } = page.getSize();
  const angle = page.getRotation().angle % 360;
  return angle === 90 || angle === 270 ? height : width;
}

/**
 * Converts a top-origin Y + field height to a bottom-origin Y.
 * PDF coordinate system has (0,0) at bottom-left; top-origin is more
 * natural when reading coordinates off a form in a PDF viewer.
 */
function topToBottomY(topY: number, fieldH: number, pageH: number): number {
  return pageH - topY - fieldH;
}

function resolveFieldY(
  rect: Rect,
  originY: "top" | "bottom",
  page: PdfPage,
  templatePageHeight?: number,
): number {
  if (originY === "bottom") return rect.y;
  const h = templatePageHeight ?? pageHeight(page);
  return topToBottomY(rect.y, rect.height, h);
}

function resolveCheckboxY(
  cb: CheckboxTemplate,
  page: PdfPage,
  templatePageHeight?: number,
): number {
  if ((cb.originY ?? "bottom") === "bottom") return cb.y;
  const h = templatePageHeight ?? pageHeight(page);
  return h - cb.y - (cb.size ?? 13);
}

// ── Text utilities ─────────────────────────────────────────────────────────────

function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PdfFont,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function truncateText(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PdfFont,
): string {
  let result = text.trim();
  while (result.length > 0 && font.widthOfTextAtSize(result, fontSize) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result;
}

/**
 * Shrinks fontSize from maxFontSize to minFontSize (in 0.5pt steps) until
 * the text fits in the bounding box, then returns the lines and chosen size.
 */
function autosizeFont(
  text: string,
  rect: Rect,
  maxFontSize: number,
  minFontSize: number,
  font: PdfFont,
  multiline: boolean,
): { lines: string[]; fontSize: number } {
  const hPad = 4;
  const maxW = rect.width - hPad * 2;

  for (let size = maxFontSize; size >= minFontSize; size -= 0.5) {
    // Helvetica metrics: ascent 71.8%, descent 20.7% of font size
    const glyphH = size * (0.718 + 0.207);
    const lineH = size * 1.2;
    if (multiline) {
      const lines = wrapText(text, maxW, size, font);
      const totalH = (lines.length - 1) * lineH + glyphH;
      if (totalH <= rect.height) return { lines, fontSize: size };
    } else {
      if (font.widthOfTextAtSize(text, size) <= maxW) return { lines: [text], fontSize: size };
    }
  }

  // At minimum size, wrap or truncate as best we can
  if (multiline) {
    return { lines: wrapText(text, maxW, minFontSize, font), fontSize: minFontSize };
  }
  return {
    lines: [truncateText(text, maxW, minFontSize, font)],
    fontSize: minFontSize,
  };
}

// ── Draw functions ─────────────────────────────────────────────────────────────

const TEXT_BLACK: RgbColor = rgb(0.08, 0.08, 0.08);
const DEBUG_FIELD_FILLED: RgbColor = rgb(0.85, 0.15, 0.15);  // red — text field with value
const DEBUG_FIELD_EMPTY: RgbColor = rgb(0.70, 0.70, 0.70);   // grey — text field without value
const DEBUG_CHECKBOX: RgbColor = rgb(0.10, 0.55, 0.15);      // green — checkbox target

/**
 * Draws text inside a bounding box with:
 * - font autosizing (maxFontSize → minFontSize)
 * - single-line or multiline wrapping
 * - left / center / right horizontal alignment
 * - vertically centered using Helvetica glyph metrics
 * - optional debug rectangle border
 */
function drawTextInBox(
  page: PdfPage,
  text: string,
  rect: Rect,
  opts: {
    font: PdfFont;
    align: Alignment;
    maxFontSize: number;
    minFontSize: number;
    multiline: boolean;
    debug: boolean;
  },
): void {
  const value = (text || "").trim();

  if (opts.debug) {
    page.drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      borderColor: value ? DEBUG_FIELD_FILLED : DEBUG_FIELD_EMPTY,
      borderWidth: 0.75,
    });
  }

  if (!value) return;

  const { lines, fontSize } = autosizeFont(
    value,
    rect,
    opts.maxFontSize,
    opts.minFontSize,
    opts.font,
    opts.multiline,
  );

  const hPad = 4;
  const lineH = fontSize * 1.2;
  const ascent = fontSize * 0.718;
  const descent = fontSize * 0.207;
  const glyphH = ascent + descent;
  // Baseline of the bottom-most line, vertically centered in the box
  const startY = rect.y + (rect.height - ((lines.length - 1) * lineH + glyphH)) / 2 + descent;

  lines.forEach((line, i) => {
    const textW = opts.font.widthOfTextAtSize(line, fontSize);
    const x =
      opts.align === "center"
        ? rect.x + Math.max((rect.width - textW) / 2, hPad)
        : opts.align === "right"
          ? rect.x + Math.max(rect.width - textW - hPad, hPad)
          : rect.x + hPad;
    // Lines are drawn bottom-up; line 0 is at the top
    const y = startY + (lines.length - 1 - i) * lineH;
    page.drawText(line, { x, y, size: fontSize, font: opts.font, color: TEXT_BLACK });
  });
}

/**
 * Draws a checkbox mark ("X") at a specific point.
 * Debug mode adds a green border around the mark target area.
 */
function drawCheckmark(
  page: PdfPage,
  x: number,
  y: number,
  font: PdfFont,
  size: number,
  debug: boolean,
): void {
  if (debug) {
    page.drawRectangle({
      x: x - 2,
      y: y - 2,
      width: size + 4,
      height: size + 4,
      borderColor: DEBUG_CHECKBOX,
      borderWidth: 0.75,
    });
  }
  page.drawText("X", { x, y, size, font, color: TEXT_BLACK });
}

// ── Page fill engine ──────────────────────────────────────────────────────────

/**
 * Fills all fields and checkboxes on one page using the template definitions.
 * Handles coordinate conversion and all rendering variants.
 */
function fillPage(
  page: PdfPage,
  template: PageTemplate,
  values: PdfDataValues,
  regularFont: PdfFont,
  boldFont: PdfFont,
  options: PdfFillOptions,
): void {
  // --- Text fields ---
  for (const field of template.fields) {
    const raw = field.fixedValue !== undefined
      ? field.fixedValue
      : String(values[field.key] ?? "");

    const resolvedY = resolveFieldY(
      field.rect,
      field.originY ?? "bottom",
      page,
      template.pageHeight,
    );
    const rect: Rect = { ...field.rect, y: resolvedY };

    drawTextInBox(page, raw, rect, {
      font: field.font === "bold" ? boldFont : regularFont,
      align: field.align ?? "left",
      maxFontSize: field.maxFontSize ?? 12,
      minFontSize: field.minFontSize ?? 7,
      multiline: field.multiline ?? false,
      debug: options.debug,
    });
  }

  // --- Checkboxes ---
  for (const cb of template.checkboxes ?? []) {
    const resolvedY = resolveCheckboxY(cb, page, template.pageHeight);

    if (options.debug) {
      const sz = cb.size ?? 13;
      page.drawRectangle({
        x: cb.x - 2,
        y: resolvedY - 2,
        width: sz + 4,
        height: sz + 4,
        borderColor: DEBUG_CHECKBOX,
        borderWidth: 0.75,
      });
    }

    if (Boolean(values[cb.key])) {
      drawCheckmark(page, cb.x, resolvedY, boldFont, cb.size ?? 13, false);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PDF LOAD AND FILL PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

async function loadPdf(url: string): Promise<PDFDocument> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load PDF template from ${url} (${response.status})`);
  }
  return PDFDocument.load(await response.arrayBuffer());
}

async function buildFilledPdf(
  url: string,
  templates: PageTemplate[],
  values: PdfDataValues,
  options: PdfFillOptions,
): Promise<Uint8Array> {
  const pdfDoc = await loadPdf(url);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  if (hasAcroFormFields(pdfDoc)) {
    // PDF has interactive AcroForm fields — fill them directly
    fillAcroFormFields(pdfDoc, values, templates);
    if (options.debug) {
      // Draw debug rects over AcroForm pages for calibration
      for (const template of templates) {
        const page = pages[template.pageIndex];
        if (page) fillPage(page, template, {}, regularFont, boldFont, options);
      }
    }
  } else {
    // No AcroForm fields — overlay text using coordinate templates
    for (const template of templates) {
      const page = pages[template.pageIndex];
      if (!page) continue;
      fillPage(page, template, values, regularFont, boldFont, options);
    }
  }

  return pdfDoc.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const FORM_URL = "/forms/H1010_Apr2024_3.pdf";
const MEDICAL_ADDENDUM_URL = "/forms/H1010-MR.pdf";

/** Both a clean final PDF and a debug preview with field borders. */
export interface PdfPair {
  /** Clean PDF ready for download and printing. */
  final: Uint8Array;
  /**
   * Debug PDF with colored borders around every target field.
   * Red = filled text field, grey = empty text field, green = checkbox.
   * Use this to visually calibrate coordinates against the form.
   */
  preview: Uint8Array;
}

/**
 * Generates a prefilled H1010 Texas Benefits application.
 * Returns the clean final PDF as a Uint8Array (backward-compatible).
 */
export async function generateTexasH1010Pdf(
  intake: IntakeForm,
  matches: MatchResult[],
): Promise<Uint8Array> {
  const values = extractH1010Data(intake, matches);
  const templates = [H1010_PAGE1, H1010_PAGE2, H1010_PAGE16];
  return buildFilledPdf(FORM_URL, templates, values, { debug: false });
}

/**
 * Generates both a clean H1010 and a debug preview (field borders visible).
 * Use the preview to visually verify coordinate alignment.
 */
export async function generateTexasH1010PdfPair(
  intake: IntakeForm,
  matches: MatchResult[],
): Promise<PdfPair> {
  const values = extractH1010Data(intake, matches);
  const templates = [H1010_PAGE1, H1010_PAGE2, H1010_PAGE16];
  const [final, preview] = await Promise.all([
    buildFilledPdf(FORM_URL, templates, values, { debug: false }),
    buildFilledPdf(FORM_URL, templates, values, { debug: true }),
  ]);
  return { final, preview };
}

/**
 * Generates a prefilled H1010-MR medical addendum.
 * Returns the clean final PDF (backward-compatible).
 */
export async function generateTexasH1010MrPdf(intake: IntakeForm): Promise<Uint8Array> {
  const values = extractH1010MrData(intake);
  return buildFilledPdf(MEDICAL_ADDENDUM_URL, [H1010MR_PAGE1], values, { debug: false });
}

/**
 * Generates both a clean H1010-MR and a debug preview.
 */
export async function generateTexasH1010MrPdfPair(intake: IntakeForm): Promise<PdfPair> {
  const values = extractH1010MrData(intake);
  const templates = [H1010MR_PAGE1];
  const [final, preview] = await Promise.all([
    buildFilledPdf(MEDICAL_ADDENDUM_URL, templates, values, { debug: false }),
    buildFilledPdf(MEDICAL_ADDENDUM_URL, templates, values, { debug: true }),
  ]);
  return { final, preview };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function formatPhone(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function formatSsn(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return value;
}

function formatDate(value: string): string {
  return value || "";
}

function monthlyIncomeEstimate(band: IntakeForm["monthlyIncomeBand"]): string {
  const map: Record<string, string> = {
    "under-1000": "900",
    "1000-2000": "1500",
    "2000-3500": "2750",
    "3500-plus": "3500+",
  };
  return map[band] ?? "";
}

function estimatedHousingAmount(intake: IntakeForm): string {
  if (intake.needsHousingHelp) return "800";
  if (intake.needsUtilityHelp) return "250";
  return "";
}

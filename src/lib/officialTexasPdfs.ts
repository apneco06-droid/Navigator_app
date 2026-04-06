/**
 * officialTexasPdfs.ts — Texas HHSC form templates and public PDF API
 *
 * Architecture:
 *   TEMPLATES  – FieldDef[] arrays that define WHERE data goes on each form page.
 *                All coordinate decisions live here; never in AI-generated code.
 *   EXTRACTORS – Functions that map IntakeForm → Record<string,string>.
 *                These decide WHAT data to place; never WHERE.
 *   PUBLIC API – generateTexas*PdfPair() functions consumed by the UI.
 *                Always returns { final, preview } where preview = debug version.
 *
 * Rendering is delegated to pdfEngine.ts, which is form-agnostic.
 */

import { PDFDocument, StandardFonts } from "pdf-lib";
import { IntakeForm, MatchResult }     from "./matching";
import {
  FieldDef,
  RenderOptions,
  hasRealAcroFormFields,
  fillAcroFormFields,
  renderFields,
} from "./pdfEngine";

// ─────────────────────────────────────────────────────────────────────────────
// FORM ASSET PATHS
// ─────────────────────────────────────────────────────────────────────────────

const H1010_URL    = "/forms/H1010_Apr2024_3.pdf";
const H1010_MR_URL = "/forms/H1010-MR.pdf";
const H0011_URL    = "/forms/H0011.pdf";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Result of every generate* call. final = clean; preview = debug overlay. */
export interface PdfPair {
  final:   Uint8Array;
  preview: Uint8Array;
}

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE TEMPLATES
// All coordinates are in the native PDF bottom-left system (coords omitted →
// defaults to "bottom-left").  Use coords:"top-left" for measurements taken
// from a printed form's top edge.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * H1010 (April 2024) – pages at PDF indices 4, 5, 19
 * (Form pages 1, 2, 16 — preceded by four cover/instruction pages A–D)
 */
const H1010_TEMPLATE: FieldDef[] = [

  // ── PDF page 4 = Form page 1 ───────────────────────────────────────────────
  // Program selection marks
  { kind: "mark", key: "snap",              page: 4, x: 207, y: 649 },
  { kind: "mark", key: "tanf",              page: 4, x: 351, y: 649 },
  { kind: "mark", key: "chip",              page: 4, x: 468, y: 681 },
  { kind: "mark", key: "medicaid_children", page: 4, x: 468, y: 656 },
  { kind: "mark", key: "medicaid_adult",    page: 4, x: 468, y: 632 },
  { kind: "mark", key: "pregnant",          page: 4, x: 468, y: 608 },

  // Applicant name (three separate boxes)
  { kind: "text", key: "firstName",  page: 4, rect: { x: 157, y: 526, width: 115, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "middleName", page: 4, rect: { x: 316, y: 526, width:  98, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "lastName",   page: 4, rect: { x: 476, y: 526, width:  88, height: 18 }, align: "center", fontSize: 12, uppercase: true },

  // SSN and date of birth
  { kind: "text", key: "ssn", page: 4, rect: { x: 320, y: 479, width: 105, height: 18 }, align: "center", fontSize: 12 },
  { kind: "text", key: "dob", page: 4, rect: { x: 443, y: 479, width: 118, height: 18 }, align: "center", fontSize: 12 },

  // Home / physical address
  { kind: "text", key: "address", page: 4, rect: { x: 320, y: 455, width: 243, height: 18 }, align: "left",   fontSize: 12, uppercase: true },
  { kind: "text", key: "city",    page: 4, rect: { x: 320, y: 407, width: 108, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "state",   page: 4, rect: { x: 430, y: 407, width:  59, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "zipCode", page: 4, rect: { x: 541, y: 407, width:  36, height: 18 }, align: "center", fontSize: 12 },

  // Phone numbers (home / cell)
  { kind: "text", key: "phone",     page: 4, rect: { x: 320, y: 359, width: 108, height: 18 }, align: "center", fontSize: 12 },
  { kind: "text", key: "cellPhone", page: 4, rect: { x: 443, y: 359, width: 118, height: 18 }, align: "center", fontSize: 12 },

  // Mailing address (same as home; county on second row)
  { kind: "text", key: "address", page: 4, rect: { x: 320, y: 310, width: 243, height: 18 }, align: "left",   fontSize: 12, uppercase: true },
  { kind: "text", key: "county",  page: 4, rect: { x: 430, y: 310, width: 133, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "city",    page: 4, rect: { x: 320, y: 262, width: 108, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "state",   page: 4, rect: { x: 430, y: 262, width:  59, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "zipCode", page: 4, rect: { x: 541, y: 262, width:  36, height: 18 }, align: "center", fontSize: 12 },

  // Income section
  { kind: "mark", key: "hasNoIncome",       page: 4, x: 481, y: 144 },   // "No" for unearned income question
  { kind: "mark", key: "hasEarnedIncome",   page: 4, x: 438, y: 112 },   // "Yes" for earned income
  { kind: "text", key: "earnedIncome",      page: 4, rect: { x: 515, y: 101, width: 53, height: 16 }, align: "center", fontSize: 11 },
  { kind: "mark", key: "hasEarnedIncome",   page: 4, x: 438, y: 82  },   // repeated on next line
  { kind: "text", key: "earnedIncome",      page: 4, rect: { x: 515, y: 70,  width: 53, height: 16 }, align: "center", fontSize: 11 },
  { kind: "mark", key: "hasHousingExpense", page: 4, x: 438, y: 49  },
  { kind: "text", key: "housingAmount",     page: 4, rect: { x: 515, y: 38,  width: 53, height: 16 }, align: "center", fontSize: 11 },

  // ── PDF page 5 = Form page 2 ───────────────────────────────────────────────
  { kind: "mark", key: "pregnant",           page: 5, x: 512, y: 699 },
  { kind: "mark", key: "isActiveDuty",       page: 5, x: 512, y: 470 },
  { kind: "mark", key: "isVeteran",          page: 5, x: 512, y: 414 },
  { kind: "mark", key: "needsInterviewHelp", page: 5, x: 513, y: 213 },
  { kind: "mark", key: "hasHelpDetails",     page: 5, x: 513, y: 163 },
  { kind: "text", key: "interviewLang",      page: 5, rect: { x: 362, y: 86, width: 196, height: 18 }, align: "center", fontSize: 11, uppercase: true },
  { kind: "mark", key: "needsInterpreter",   page: 5, x: 514, y: 52  },
  { kind: "mark", key: "interpreterSpanish", page: 5, x: 179, y: 20  },
  { kind: "text", key: "interpreterOther",   page: 5, rect: { x: 364, y: 6,  width: 194, height: 18 }, align: "center", fontSize: 10.5, uppercase: true },
  { kind: "text", key: "ssn",               page: 5, rect: { x: 63,  y: 0,  width: 131, height: 18 }, align: "center", fontSize: 11 },

  // ── PDF page 19 = Form page 16 ────────────────────────────────────────────
  { kind: "text", key: "fullName",         page: 19, rect: { x: 337, y: 320, width: 224, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "text", key: "interviewLang",    page: 19, rect: { x: 336, y: 290, width: 225, height: 18 }, align: "center", fontSize: 12, uppercase: true },
  { kind: "mark", key: "contactPhone",     page: 19, x: 145, y: 247 },
  { kind: "text", key: "contactPhoneNum",  page: 19, rect: { x: 438, y: 246, width: 112, height: 18 }, align: "center", fontSize: 12 },
  { kind: "mark", key: "contactText",      page: 19, x: 145, y: 196 },
  { kind: "text", key: "contactTextNum",   page: 19, rect: { x: 438, y: 195, width: 112, height: 18 }, align: "center", fontSize: 12 },
  { kind: "mark", key: "contactEmail",     page: 19, x: 145, y: 145 },
  { kind: "text", key: "contactEmailAddr", page: 19, rect: { x: 332, y: 145, width: 228, height: 18 }, align: "center", fontSize: 11 },
  { kind: "text", key: "ssn",              page: 19, rect: { x: 69,  y: 16,  width: 126, height: 18 }, align: "center", fontSize: 11 },
];

/**
 * H1010-MR (Medical Records / Tax addendum) – PDF page 0
 */
const H1010_MR_TEMPLATE: FieldDef[] = [
  { kind: "text", key: "firstName",          page: 0, rect: { x: 135, y: 390, width: 100, height: 16 }, align: "center", fontSize: 10.5, uppercase: true },
  { kind: "text", key: "middleName",         page: 0, rect: { x: 260, y: 390, width:  92, height: 16 }, align: "center", fontSize: 10.5, uppercase: true },
  { kind: "text", key: "lastName",           page: 0, rect: { x: 404, y: 390, width: 116, height: 16 }, align: "center", fontSize: 10.5, uppercase: true },
  { kind: "text", key: "spouseName",         page: 0, rect: { x: 136, y: 341, width: 386, height: 16 }, align: "center", fontSize: 10.5, uppercase: true },
  { kind: "mark", key: "plansToFileTaxes",   page: 0, x: 521, y: 282 },
  { kind: "mark", key: "filesJointly",       page: 0, x: 521, y: 246 },
  { kind: "mark", key: "claimsDependents",   page: 0, x: 521, y: 211 },
  { kind: "text", key: "dependentNames",     page: 0, rect: { x: 136, y: 167, width: 388, height: 16 }, align: "center", fontSize: 9.5, uppercase: true },
  { kind: "mark", key: "claimedAsDependent", page: 0, x: 521, y: 136 },
  { kind: "text", key: "taxFilerName",       page: 0, rect: { x: 136, y: 106, width: 255, height: 16 }, align: "center", fontSize: 10.5, uppercase: true },
  { kind: "text", key: "taxRelationship",    page: 0, rect: { x: 414, y: 106, width: 120, height: 16 }, align: "center", fontSize: 10,   uppercase: true },
];

/**
 * H0011 TSAP (simplified SNAP for elderly/disabled) – PDF page 0.
 * Coordinates are estimated from the July 2025 H0011 static visual layout
 * in top-left origin (measured from top of page).
 */
const H0011_TEMPLATE: FieldDef[] = [
  { kind: "text", key: "firstName",  page: 0, coords: "top-left", rect: { x: 140, y: 230, width:  95, height: 16 }, align: "center", fontSize: 10, uppercase: true },
  { kind: "text", key: "middleName", page: 0, coords: "top-left", rect: { x: 248, y: 230, width:  80, height: 16 }, align: "center", fontSize: 10, uppercase: true },
  { kind: "text", key: "lastName",   page: 0, coords: "top-left", rect: { x: 340, y: 230, width: 105, height: 16 }, align: "center", fontSize: 10, uppercase: true },
  { kind: "text", key: "address",    page: 0, coords: "top-left", rect: { x: 140, y: 258, width: 310, height: 16 }, align: "left",   fontSize: 10, uppercase: true },
  { kind: "text", key: "city",       page: 0, coords: "top-left", rect: { x: 140, y: 286, width: 120, height: 16 }, align: "center", fontSize: 10, uppercase: true },
  { kind: "text", key: "state",      page: 0, coords: "top-left", rect: { x: 270, y: 286, width:  40, height: 16 }, align: "center", fontSize: 10, uppercase: true },
  { kind: "text", key: "zipCode",    page: 0, coords: "top-left", rect: { x: 320, y: 286, width:  55, height: 16 }, align: "center", fontSize: 10 },
  { kind: "text", key: "phone",      page: 0, coords: "top-left", rect: { x: 140, y: 316, width: 140, height: 16 }, align: "center", fontSize: 10 },
  { kind: "text", key: "ssn",        page: 0, coords: "top-left", rect: { x: 340, y: 316, width: 110, height: 16 }, align: "center", fontSize: 10 },
  { kind: "text", key: "householdSize", page: 0, coords: "top-left", rect: { x: 140, y: 344, width: 80, height: 16 }, align: "center", fontSize: 10 },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA EXTRACTORS
// These functions are the ONLY place that maps IntakeForm fields → data keys.
// They produce a flat Record<string,string> consumed by the rendering engine.
// ─────────────────────────────────────────────────────────────────────────────

function mark(val: boolean): string { return val ? "true" : ""; }

function formatPhone(value: string): string {
  const d = (value || "").replace(/\D/g, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : value || "";
}

function formatSsn(value: string): string {
  const d = (value || "").replace(/\D/g, "");
  return d.length === 9 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : value || "";
}

function monthlyIncomeToAmount(band: IntakeForm["monthlyIncomeBand"]): string {
  const map: Record<string, string> = {
    "under-1000": "900",
    "1000-2000":  "1500",
    "2000-3500":  "2750",
    "3500-plus":  "3500+",
  };
  return map[band] ?? "";
}

function estimatedHousingAmount(intake: IntakeForm): string {
  if (intake.needsHousingHelp || intake.needsUtilityHelp) {
    return intake.needsHousingHelp ? "800" : "250";
  }
  return "";
}

/**
 * Extracts structured user data for the H1010 form.
 * WHAT goes on the form — not WHERE.
 */
function extractH1010Data(
  intake: IntakeForm,
  matches: MatchResult[],
): Record<string, string> {
  const selected     = new Set(matches.map(({ program }) => program.id));
  const hasIncome    = monthlyIncomeToAmount(intake.monthlyIncomeBand) !== "";
  const hasHousing   = intake.needsHousingHelp || intake.needsUtilityHelp;
  const interviewLang = intake.interviewLanguage ||
    (intake.language === "es" ? "Spanish" : "English");
  const interpLang   = (intake.interpreterLanguage || intake.language).toLowerCase();
  const isSpanish    = interpLang.includes("span") || interpLang === "es";

  return {
    // ── Programs ──────────────────────────────────────────────────────────────
    snap:              mark(selected.has("snap")),
    tanf:              mark(selected.has("tanf")),
    chip:              mark(selected.has("chip")),
    medicaid_children: mark(selected.has("medicaid") && !!intake.childrenUnder19),
    medicaid_adult:    mark(selected.has("medicaid") && !intake.childrenUnder19),
    pregnant:          mark(intake.pregnantOrPostpartum),

    // ── Identity ──────────────────────────────────────────────────────────────
    firstName:  intake.firstName,
    middleName: intake.middleName,
    lastName:   intake.lastName,
    fullName:   [intake.firstName, intake.middleName, intake.lastName].filter(Boolean).join(" "),
    ssn:        formatSsn(intake.socialSecurityNumber),
    dob:        intake.dateOfBirth,

    // ── Address ───────────────────────────────────────────────────────────────
    address:   intake.address,
    city:      intake.city,
    state:     "TX",
    zipCode:   intake.zipCode,
    county:    intake.county,
    phone:     formatPhone(intake.phone),
    cellPhone: formatPhone(intake.cellPhone || intake.phone),

    // ── Income ────────────────────────────────────────────────────────────────
    hasNoIncome:       "true",              // always mark "No" for unearned income
    hasEarnedIncome:   mark(hasIncome),
    earnedIncome:      monthlyIncomeToAmount(intake.monthlyIncomeBand),
    hasHousingExpense: mark(hasHousing),
    housingAmount:     estimatedHousingAmount(intake),

    // ── Military / veteran ────────────────────────────────────────────────────
    isActiveDuty: mark(intake.isActiveDuty),
    isVeteran:    mark(intake.isVeteran),

    // ── Interview & language ─────────────────────────────────────────────────
    needsInterviewHelp: mark(intake.needsInterviewHelp),
    hasHelpDetails:     mark(intake.interviewHelpDetails.trim().length > 0),
    interviewLang:      interviewLang,
    needsInterpreter:   mark(intake.needsInterpreter),
    interpreterSpanish: mark(intake.needsInterpreter && isSpanish),
    interpreterOther:   (intake.needsInterpreter && !isSpanish) ? intake.interpreterLanguage : "",

    // ── Preferred contact ─────────────────────────────────────────────────────
    contactPhone:     mark(intake.preferredContactMethod === "phone"),
    contactPhoneNum:  intake.preferredContactMethod === "phone"
      ? formatPhone(intake.phone) : "",
    contactText:      mark(intake.preferredContactMethod === "text"),
    contactTextNum:   intake.preferredContactMethod === "text"
      ? formatPhone(intake.cellPhone || intake.phone) : "",
    contactEmail:     mark(intake.preferredContactMethod === "email"),
    contactEmailAddr: intake.preferredContactMethod === "email"
      ? (intake.email || "").toLowerCase() : "",
  };
}

/**
 * Extracts structured user data for the H1010-MR (tax / medical) addendum.
 * WHAT goes on the form — not WHERE.
 */
function extractH1010MrData(intake: IntakeForm): Record<string, string> {
  return {
    firstName:          intake.firstName,
    middleName:         intake.middleName,
    lastName:           intake.lastName,
    spouseName:         intake.spouseName,
    plansToFileTaxes:   mark(intake.plansToFileTaxes   === "yes"),
    filesJointly:       mark(intake.filesJointly       === "yes"),
    claimsDependents:   mark(intake.claimsDependents   === "yes"),
    dependentNames:     intake.dependentNames,
    claimedAsDependent: mark(intake.claimedAsDependent === "yes"),
    taxFilerName:       intake.taxFilerName,
    taxRelationship:    intake.taxRelationship,
  };
}

/**
 * Extracts data for the H0011 TSAP simplified SNAP form.
 */
function extractH0011Data(intake: IntakeForm): Record<string, string> {
  return {
    firstName:     intake.firstName,
    middleName:    intake.middleName,
    lastName:      intake.lastName,
    address:       intake.address,
    city:          intake.city,
    state:         "TX",
    zipCode:       intake.zipCode,
    phone:         formatPhone(intake.phone),
    ssn:           formatSsn(intake.socialSecurityNumber),
    householdSize: intake.householdSize,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF LOADER
// ─────────────────────────────────────────────────────────────────────────────

async function loadPdf(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot load form: ${url} (${res.status})`);
  const pdfDoc = await PDFDocument.load(await res.arrayBuffer());
  return { pdfDoc, pages: pdfDoc.getPages() };
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE RENDER HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads a form, renders a template onto it, and returns the bytes.
 * Automatically detects AcroForm fields and fills them first if present;
 * falls back to coordinate overlay otherwise.
 */
async function renderForm(
  url: string,
  template: FieldDef[],
  data: Record<string, string>,
  renderOpts: RenderOptions,
): Promise<Uint8Array> {
  const { pdfDoc, pages } = await loadPdf(url);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  if (hasRealAcroFormFields(pdfDoc)) {
    await fillAcroFormFields(pdfDoc, data, font);
  }
  // Always run coordinate overlay — fills fields that AcroForm can't reach
  // (and is the primary strategy for XFA-stripped HHSC forms).
  renderFields(pages, font, boldFont, template, data, renderOpts);

  return pdfDoc.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the H1010 pre-filled PDF pair.
 *
 * @param intake  User intake data collected by the conversational guide.
 * @param matches Programs matched by the eligibility engine.
 * @returns { final, preview } where preview has debug field-rect overlays.
 *
 * To see debug rectangles, call:
 *   generateTexasH1010PdfPair(intake, matches).then(p => downloadPdf(p.preview, 'debug.pdf'))
 */
export async function generateTexasH1010PdfPair(
  intake:  IntakeForm,
  matches: MatchResult[],
): Promise<PdfPair> {
  const data = extractH1010Data(intake, matches);
  const [final, preview] = await Promise.all([
    renderForm(H1010_URL, H1010_TEMPLATE, data, { debug: false }),
    renderForm(H1010_URL, H1010_TEMPLATE, data, { debug: true  }),
  ]);
  return { final, preview };
}

export async function generateTexasH1010Pdf(
  intake:  IntakeForm,
  matches: MatchResult[],
): Promise<Uint8Array> {
  return (await generateTexasH1010PdfPair(intake, matches)).final;
}

/**
 * Generates the H1010-MR (Medical Records / Tax) addendum pre-filled PDF pair.
 */
export async function generateTexasH1010MrPdfPair(
  intake: IntakeForm,
): Promise<PdfPair> {
  const data = extractH1010MrData(intake);
  const [final, preview] = await Promise.all([
    renderForm(H1010_MR_URL, H1010_MR_TEMPLATE, data, { debug: false }),
    renderForm(H1010_MR_URL, H1010_MR_TEMPLATE, data, { debug: true  }),
  ]);
  return { final, preview };
}

export async function generateTexasH1010MrPdf(
  intake: IntakeForm,
): Promise<Uint8Array> {
  return (await generateTexasH1010MrPdfPair(intake)).final;
}

/**
 * Generates the H0011 TSAP simplified SNAP PDF.
 * For households where everyone is 60+ or receives disability payments.
 */
export async function generateTexasH0011Pdf(
  intake:   IntakeForm,
  _matches: MatchResult[],
): Promise<Uint8Array> {
  const data = extractH0011Data(intake);
  return renderForm(H0011_URL, H0011_TEMPLATE, data, { debug: false });
}

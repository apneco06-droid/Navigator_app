/**
 * PDF Generator — Texas Benefits Application Data Sheets
 *
 * Generates clean, pre-filled reference PDFs that mirror the H1010 / H1010-MR
 * question structure. Uses pdf-lib to draw from scratch (avoids XFA stripping
 * issues in the source form), producing a document caseworkers and applicants
 * can use directly or attach to the blank official form.
 */

import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, RGB } from "pdf-lib";
import { IntakeForm, MatchResult } from "./matching";

// ─────────────────────────────────────────────────────────────────────────────
// COLORS & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BLACK   = rgb(0.08, 0.08, 0.08);
const DARK    = rgb(0.2,  0.2,  0.2);
const MUTED   = rgb(0.45, 0.45, 0.45);
const LIGHT   = rgb(0.85, 0.85, 0.85);
const ACCENT  = rgb(0.07, 0.38, 0.60);   // HHSC-blue-ish
const WHITE   = rgb(1, 1, 1);

const PAGE_W  = 612;   // 8.5"
const PAGE_H  = 792;   // 11"
const MARGIN  = 50;
const COL_W   = PAGE_W - MARGIN * 2;

// ─────────────────────────────────────────────────────────────────────────────
// DATA EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

interface H1010Data {
  firstName: string;
  middleName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  stateAbbr: string;
  zipCode: string;
  county: string;
  phone: string;
  cellPhone: string;
  email: string;

  applySnap: boolean;
  applyTanf: boolean;
  applyChip: boolean;
  applyMedicaidChildren: boolean;
  applyMedicaidAdult: boolean;
  isPregnantForBenefits: boolean;

  householdSize: string;
  estimatedMonthlyIncome: string;
  estimatedHousing: string;

  isPregnantOrPostpartum: boolean;
  isActiveDuty: boolean;
  isVeteran: boolean;
  hasDisability: boolean;
  needsInterviewHelp: boolean;
  interviewHelpDetails: string;
  interviewLanguage: string;
  needsInterpreter: boolean;
  interpreterLanguage: string;
  preferredContactMethod: string;

  plansToFileTaxes: string;
  filesJointly: string;
  claimsDependents: string;
  claimedAsDependent: string;
  spouseName: string;
  dependentNames: string;
  taxFilerName: string;
  taxRelationship: string;

  employerName: string;
  employmentStatus: string;
  monthlyRent: string;
  currentInsurance: string;
  childrenNames: string;
  childDiagnosis: string;
  notes: string;
}

function extractData(intake: IntakeForm, matches: MatchResult[]): H1010Data {
  const ids = new Set(matches.map(m => m.program.id));
  const hasMedicaid = ids.has("medicaid");
  return {
    firstName:   intake.firstName,
    middleName:  intake.middleName || "",
    lastName:    intake.lastName,
    ssn:         formatSsn(intake.socialSecurityNumber),
    dateOfBirth: intake.dateOfBirth,
    address:     intake.address,
    city:        intake.city,
    stateAbbr:   intake.region === "new-mexico" ? "NM" : "TX",
    zipCode:     intake.zipCode,
    county:      intake.county,
    phone:       formatPhone(intake.phone),
    cellPhone:   formatPhone(intake.cellPhone || intake.phone),
    email:       intake.email,

    applySnap:              ids.has("snap"),
    applyTanf:              ids.has("tanf"),
    applyChip:              ids.has("chip"),
    applyMedicaidChildren:  hasMedicaid && intake.childrenUnder19,
    applyMedicaidAdult:     hasMedicaid && !intake.childrenUnder19,
    isPregnantForBenefits:  intake.pregnantOrPostpartum,

    householdSize:          intake.householdSize,
    estimatedMonthlyIncome: incomeLabel(intake.monthlyIncomeBand),
    estimatedHousing:       intake.monthlyRent || estimatedHousingFallback(intake),

    isPregnantOrPostpartum: intake.pregnantOrPostpartum,
    isActiveDuty:           intake.isActiveDuty,
    isVeteran:              intake.isVeteran,
    hasDisability:          intake.hasDisability,
    needsInterviewHelp:     intake.needsInterviewHelp,
    interviewHelpDetails:   intake.interviewHelpDetails,
    interviewLanguage:      intake.interviewLanguage || (intake.language === "es" ? "Spanish" : "English"),
    needsInterpreter:       intake.needsInterpreter,
    interpreterLanguage:    intake.interpreterLanguage || (intake.needsInterpreter ? "Spanish" : ""),
    preferredContactMethod: intake.preferredContactMethod,

    plansToFileTaxes:  intake.plansToFileTaxes,
    filesJointly:      intake.filesJointly,
    claimsDependents:  intake.claimsDependents,
    claimedAsDependent:intake.claimedAsDependent,
    spouseName:        intake.spouseName,
    dependentNames:    intake.dependentNames,
    taxFilerName:      intake.taxFilerName,
    taxRelationship:   intake.taxRelationship,

    employerName:       intake.employerName,
    employmentStatus:   intake.employmentStatus,
    monthlyRent:        intake.monthlyRent,
    currentInsurance:   intake.currentInsurance,
    childrenNames:      intake.childrenNames,
    childDiagnosis:     intake.childDiagnosis,
    notes:              intake.notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

class Sheet {
  doc: PDFDocument;
  page!: PDFPage;
  reg: PDFFont;
  bold: PDFFont;
  cursor: number = 0;

  constructor(doc: PDFDocument, reg: PDFFont, bold: PDFFont) {
    this.doc  = doc;
    this.reg  = reg;
    this.bold = bold;
    this.addPage();
  }

  addPage() {
    this.page   = this.doc.addPage([PAGE_W, PAGE_H]);
    this.cursor = PAGE_H - MARGIN;
  }

  needsPage(space: number) {
    if (this.cursor - space < MARGIN + 20) {
      this.addPage();
    }
  }

  /** Raw text at (x, y) with bottom-left origin. */
  text(str: string, x: number, y: number, size: number, font: PDFFont, color: RGB = BLACK) {
    if (!str) return;
    this.page.drawText(str, { x, y, size, font, color });
  }

  /** Move cursor down by delta. */
  down(delta: number) { this.cursor -= delta; }

  /** Draw a full-width horizontal rule. */
  rule(weight = 0.4, color: RGB = LIGHT) {
    this.page.drawLine({
      start: { x: MARGIN, y: this.cursor },
      end:   { x: PAGE_W - MARGIN, y: this.cursor },
      thickness: weight,
      color,
    });
  }

  /** Document header — only on first page. */
  drawDocHeader(title: string, subtitle: string) {
    // Blue bar
    this.page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: ACCENT });
    this.text("TEXAS HEALTH AND HUMAN SERVICES COMMISSION", MARGIN, PAGE_H - 22, 7.5, this.bold, WHITE);
    this.text(title, MARGIN, PAGE_H - 38, 13, this.bold, WHITE);
    this.text(subtitle, MARGIN, PAGE_H - 52, 7.5, this.reg, rgb(0.85, 0.92, 1));
    this.cursor = PAGE_H - 72;
    this.down(6);
  }

  /** Section heading band. */
  sectionHead(label: string) {
    this.needsPage(28);
    this.down(6);
    this.page.drawRectangle({ x: MARGIN, y: this.cursor - 2, width: COL_W, height: 18, color: rgb(0.91, 0.93, 0.96) });
    this.text(label.toUpperCase(), MARGIN + 6, this.cursor + 2, 8, this.bold, ACCENT);
    this.down(22);
  }

  /** One labeled field drawn as a form box. */
  field(label: string, value: string, x: number, w: number) {
    this.needsPage(30);
    const y = this.cursor;
    // Outer box
    this.page.drawRectangle({ x, y: y - 18, width: w, height: 20, borderColor: LIGHT, borderWidth: 0.6 });
    // Label (tiny, in top-left of box)
    this.text(label, x + 3, y - 3, 6.5, this.reg, MUTED);
    // Value
    const display = value.trim() || "(blank)";
    const color   = value.trim() ? BLACK : LIGHT;
    this.text(display, x + 3, y - 13, 9, this.reg, color);
  }

  /** Commit a row of fields to the page and advance cursor. */
  rowEnd(count: number) {
    this.down(26);
  }

  /** Draw a filled inner square to represent a checked state (WinAnsi-safe). */
  private filledCheck(bx: number, by: number) {
    this.page.drawRectangle({ x: bx + 2, y: by + 2, width: 6, height: 6, color: ACCENT });
  }

  /** Checkbox row — label + yes/no marks. */
  yesno(label: string, value: boolean) {
    this.needsPage(16);
    const y = this.cursor;
    const box = (checked: boolean, bx: number) => {
      this.page.drawRectangle({ x: bx, y: y - 10, width: 10, height: 10, borderColor: DARK, borderWidth: 0.6 });
      if (checked) this.filledCheck(bx, y - 10);
    };
    box(value,  MARGIN);
    box(!value, MARGIN + 20);
    this.text("Yes", MARGIN + 12, y - 8, 8, this.reg, DARK);
    this.text("No",  MARGIN + 32, y - 8, 8, this.reg, DARK);
    this.text(label, MARGIN + 56, y - 8, 9, this.reg, BLACK);
    this.down(16);
  }

  /** Simple program checkbox. */
  checkbox(label: string, checked: boolean) {
    this.needsPage(16);
    const y = this.cursor;
    this.page.drawRectangle({ x: MARGIN, y: y - 10, width: 10, height: 10, borderColor: DARK, borderWidth: 0.6 });
    if (checked) this.filledCheck(MARGIN, y - 10);
    this.text(label, MARGIN + 16, y - 8, 9, this.reg, checked ? BLACK : MUTED);
    this.down(16);
  }

  /** Tall multi-line text area. */
  memo(label: string, value: string) {
    this.needsPage(44);
    const y = this.cursor;
    this.page.drawRectangle({ x: MARGIN, y: y - 36, width: COL_W, height: 38, borderColor: LIGHT, borderWidth: 0.6 });
    this.text(label, MARGIN + 3, y - 3, 6.5, this.reg, MUTED);
    this.text(value.trim() || "(blank)", MARGIN + 3, y - 14, 9, this.reg, value.trim() ? BLACK : LIGHT);
    this.down(44);
  }

  /** Footer on current page. */
  drawFooter(pageLabel: string) {
    const y = MARGIN - 14;
    this.rule(0.3, rgb(0.8, 0.8, 0.8));
    this.page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_W - MARGIN, y: y + 4 }, thickness: 0.3, color: LIGHT });
    this.text("Form H1010 - Pre-filled Data Reference", MARGIN, y - 2, 7, this.reg, MUTED);
    this.text(pageLabel, PAGE_W - MARGIN - 40, y - 2, 7, this.reg, MUTED);
    this.text("Bring this sheet to the HHSC office or attach to the blank official H1010 form.", MARGIN, y - 12, 7, this.reg, MUTED);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildPage1(s: Sheet, d: H1010Data) {
  s.drawDocHeader(
    "Pre-filled Application Data - Form H1010",
    "Texas Works Application for Assistance  |  SNAP, Medicaid, TANF, CHIP",
  );

  // Benefits requested
  s.sectionHead("Benefits Requested - Check all that apply");
  s.checkbox("SNAP food benefits", d.applySnap);
  s.checkbox("TANF cash help for families", d.applyTanf);
  s.checkbox("CHIP (Children's Health Insurance Program)", d.applyChip);
  s.checkbox("Medicaid - children under 19", d.applyMedicaidChildren);
  s.checkbox("Medicaid - adult (not caring for a child)", d.applyMedicaidAdult);
  s.checkbox("Medicaid - pregnant or postpartum", d.isPregnantForBenefits);
  s.down(4);

  // ── Applicant identification ───────────────────────────────────────────────
  s.sectionHead("Applicant Identification");

  s.field("First name",   d.firstName,   MARGIN,            COL_W * 0.38);
  s.field("Middle name",  d.middleName,  MARGIN + COL_W * 0.40, COL_W * 0.20);
  s.field("Last name",    d.lastName,    MARGIN + COL_W * 0.62, COL_W * 0.38);
  s.rowEnd(3);

  s.field("Date of birth (MM/DD/YYYY)", d.dateOfBirth,  MARGIN,            COL_W * 0.38);
  s.field("Social Security Number",     d.ssn,          MARGIN + COL_W * 0.40, COL_W * 0.38);
  s.rowEnd(2);

  // ── Address ───────────────────────────────────────────────────────────────
  s.sectionHead("Home Address");
  s.field("Street address", d.address, MARGIN, COL_W);
  s.rowEnd(1);

  s.field("City",   d.city,      MARGIN,                 COL_W * 0.45);
  s.field("State",  d.stateAbbr, MARGIN + COL_W * 0.47,  COL_W * 0.12);
  s.field("ZIP",    d.zipCode,   MARGIN + COL_W * 0.61,  COL_W * 0.17);
  s.field("County", d.county,    MARGIN + COL_W * 0.80,  COL_W * 0.20);
  s.rowEnd(4);

  s.field("Home phone",   d.phone,     MARGIN,                COL_W * 0.38);
  s.field("Cell phone",   d.cellPhone, MARGIN + COL_W * 0.40, COL_W * 0.38);
  s.field("Email address",d.email,     MARGIN + COL_W * 0.80, COL_W * 0.20);
  s.rowEnd(3);

  // ── Household ─────────────────────────────────────────────────────────────
  s.sectionHead("Household & Income");
  s.field("Number of people in household", d.householdSize,          MARGIN,                COL_W * 0.30);
  s.field("Est. monthly gross income",     d.estimatedMonthlyIncome, MARGIN + COL_W * 0.32, COL_W * 0.30);
  s.field("Est. monthly housing/rent",     d.estimatedHousing,       MARGIN + COL_W * 0.64, COL_W * 0.36);
  s.rowEnd(3);

  if (d.childrenNames) {
    s.field("Children in household (names & ages)", d.childrenNames, MARGIN, COL_W);
    s.rowEnd(1);
  }

  s.drawFooter("Page 1 of 2");
}

function buildPage2(s: Sheet, d: H1010Data) {
  s.addPage();

  // Blue page header
  s.page.drawRectangle({ x: 0, y: PAGE_H - 40, width: PAGE_W, height: 40, color: ACCENT });
  s.text("TEXAS HEALTH AND HUMAN SERVICES COMMISSION", MARGIN, PAGE_H - 16, 7.5, s.bold, WHITE);
  s.text("Form H1010 - Pre-filled Data Reference (continued)", MARGIN, PAGE_H - 30, 10, s.bold, WHITE);
  s.cursor = PAGE_H - 52;
  s.down(6);

  // ── Additional questions ──────────────────────────────────────────────────
  s.sectionHead("Additional Questions (Page 2 of H1010)");
  s.yesno("Is the applicant pregnant or postpartum?", d.isPregnantOrPostpartum);
  s.yesno("Is the applicant currently on active military duty?", d.isActiveDuty);
  s.yesno("Is the applicant a veteran of the U.S. Armed Forces?", d.isVeteran);
  s.yesno("Does the applicant have a disability or chronic condition?", d.hasDisability);
  s.yesno("Does the applicant need special help for an interview?", d.needsInterviewHelp);
  s.yesno("Does the applicant need an interpreter?", d.needsInterpreter);
  s.down(4);

  s.field("Interview language",   d.interviewLanguage,  MARGIN,                COL_W * 0.46);
  s.field("Interpreter language", d.interpreterLanguage, MARGIN + COL_W * 0.48, COL_W * 0.52);
  s.rowEnd(2);

  if (d.interviewHelpDetails) {
    s.memo("Special interview assistance details", d.interviewHelpDetails);
  }

  s.field("Preferred contact method", d.preferredContactMethod || "not specified", MARGIN, COL_W * 0.46);
  s.rowEnd(1);
  s.down(4);

  // ── Tax / Medicaid addendum (H1010-MR) ───────────────────────────────────
  s.sectionHead("Tax Filing Information (H1010-MR / Medicaid Addendum)");
  s.yesno("Plans to file taxes next year?",          d.plansToFileTaxes === "yes");
  s.yesno("Will file jointly with spouse?",          d.filesJointly === "yes");
  s.yesno("Will claim dependents on tax return?",    d.claimsDependents === "yes");
  s.yesno("Will be claimed as a dependent by another filer?", d.claimedAsDependent === "yes");
  s.down(4);

  s.field("Spouse name",         d.spouseName,      MARGIN,                COL_W * 0.46);
  s.field("Tax filer name",      d.taxFilerName,    MARGIN + COL_W * 0.48, COL_W * 0.52);
  s.rowEnd(2);
  s.field("Relationship to tax filer", d.taxRelationship, MARGIN, COL_W * 0.46);
  s.rowEnd(1);
  if (d.dependentNames) {
    s.memo("Dependent names", d.dependentNames);
  }
  s.down(4);

  // ── Program-specific extra fields ─────────────────────────────────────────
  const hasExtras = d.employmentStatus || d.employerName || d.monthlyRent ||
    d.currentInsurance || d.childDiagnosis;
  if (hasExtras) {
    s.sectionHead("Program-Specific Details");
    if (d.employmentStatus) {
      s.field("Employment status", d.employmentStatus, MARGIN, COL_W * 0.46);
      s.rowEnd(1);
    }
    if (d.employerName) {
      s.field("Employer name", d.employerName, MARGIN, COL_W * 0.46);
      s.rowEnd(1);
    }
    if (d.monthlyRent) {
      s.field("Monthly rent / mortgage", d.monthlyRent, MARGIN, COL_W * 0.46);
      s.rowEnd(1);
    }
    if (d.currentInsurance) {
      s.field("Current health insurance", d.currentInsurance, MARGIN, COL_W * 0.46);
      s.rowEnd(1);
    }
    if (d.childDiagnosis) {
      s.memo("Disability / condition description", d.childDiagnosis);
    }
  }

  if (d.notes) {
    s.sectionHead("Additional Notes");
    s.memo("", d.notes);
  }

  // ── Signature reminder ────────────────────────────────────────────────────
  s.needsPage(60);
  s.down(10);
  s.rule(0.6, ACCENT);
  s.down(14);
  s.text("SIGNATURE / FIRMA", MARGIN, s.cursor, 8, s.bold, ACCENT);
  s.down(14);
  s.text("I declare that all statements on this application are true and correct to the best of my knowledge.",
    MARGIN, s.cursor, 8, s.reg, DARK);
  s.down(14);
  s.rule(0.5, DARK);
  s.down(6);
  s.text("Applicant signature", MARGIN, s.cursor, 7.5, s.reg, MUTED);
  s.text("Date", MARGIN + COL_W * 0.55, s.cursor, 7.5, s.reg, MUTED);
  s.down(30);
  s.rule(0.5, DARK);
  s.down(6);
  s.text("Print name", MARGIN, s.cursor, 7.5, s.reg, MUTED);
  s.down(10);

  s.drawFooter("Page 2 of 2");
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL FORM LOADER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempts to load an official HHSC PDF form from the /forms/ path.
 * XFA data is stripped by pdf-lib; the static visual background survives.
 * Returns null silently if the file cannot be fetched.
 */
async function loadOfficialForm(path: string): Promise<PDFDocument | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return await PDFDocument.load(new Uint8Array(buf));
  } catch {
    return null;
  }
}

/**
 * Draws a separator page between the data sheet and the blank official form.
 */
async function addSeparatorPage(
  doc: PDFDocument,
  formTitle: string,
  formId: string,
  instruction: string,
): Promise<void> {
  const reg  = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  // Blue band
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: ACCENT });
  page.drawText("OFFICIAL FORM - " + formId, {
    x: MARGIN, y: PAGE_H - 28, size: 10, font: bold, color: WHITE,
  });
  page.drawText(formTitle, {
    x: MARGIN, y: PAGE_H - 46, size: 14, font: bold, color: WHITE,
  });
  page.drawText("Texas Health and Human Services Commission (HHSC)", {
    x: MARGIN, y: PAGE_H - 62, size: 8, font: reg, color: rgb(0.8, 0.9, 1),
  });

  // Center body
  const bodyY = PAGE_H / 2 + 60;
  page.drawText(instruction, {
    x: MARGIN, y: bodyY, size: 11, font: reg, color: DARK,
    maxWidth: COL_W,
  });

  const steps = [
    "1. Print this entire packet.",
    "2. Review the pre-filled data sheet (the pages before this divider).",
    "3. Fill in the official form pages that follow using your data sheet as a guide.",
    "4. Sign and date where required on the official form.",
    "5. Submit to HHSC by mail, fax, in person, or at YourTexasBenefits.com.",
  ];
  let y = bodyY - 32;
  for (const step of steps) {
    page.drawText(step, { x: MARGIN, y, size: 10, font: reg, color: BLACK, maxWidth: COL_W });
    y -= 18;
  }

  // Box at bottom
  const boxY = MARGIN + 10;
  page.drawRectangle({ x: MARGIN, y: boxY, width: COL_W, height: 46, borderColor: ACCENT, borderWidth: 1 });
  page.drawText("YourTexasBenefits.com  |  Call 2-1-1  |  Fax: 1-877-447-2839", {
    x: MARGIN + 10, y: boxY + 28, size: 9, font: bold, color: ACCENT,
  });
  page.drawText("Mail: HHSC, PO Box 149024, Austin, TX 78714-9968", {
    x: MARGIN + 10, y: boxY + 12, size: 9, font: reg, color: DARK,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/** Both a clean final PDF and a debug preview (same in this generator). */
export interface PdfPair {
  final: Uint8Array;
  preview: Uint8Array;
}

/**
 * Generates the full H1010 application packet:
 *   - 2-page pre-filled data reference sheet (all intake data)
 *   - Separator / instruction page
 *   - Official blank H1010 form pages (July 2025, static visual background)
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
  const data = extractData(intake, matches);
  const doc  = await PDFDocument.create();
  const reg  = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sheet = new Sheet(doc, reg, bold);

  // ── 1. Pre-filled data reference (2 pages) ──────────────────────────────────
  buildPage1(sheet, data);
  buildPage2(sheet, data);

  // ── 2. Try to append official H1010 (July 2025) blank pages ─────────────────
  const formDoc = await loadOfficialForm("/forms/H1010.pdf");
  if (formDoc && formDoc.getPageCount() > 0) {
    await addSeparatorPage(
      doc,
      "Texas Works Application for Assistance",
      "H1010",
      "The following pages are the official blank Form H1010 (July 2025). " +
      "Fill in these pages by hand using your pre-filled data sheet as a guide, then sign and submit.",
    );
    const count = formDoc.getPageCount();
    const indices = Array.from({ length: count }, (_, i) => i);
    const copied = await doc.copyPages(formDoc, indices);
    for (const p of copied) doc.addPage(p);
  }

  const bytes = await doc.save();
  return { final: bytes, preview: bytes };
}

/**
 * Generates the simplified SNAP packet (H0011 — for elderly or disabled
 * households with no earned income).
 */
export async function generateTexasH0011Pdf(
  intake: IntakeForm,
  matches: MatchResult[],
): Promise<Uint8Array> {
  const data  = extractData(intake, matches);
  const doc   = await PDFDocument.create();
  const reg   = await doc.embedFont(StandardFonts.Helvetica);
  const bold  = await doc.embedFont(StandardFonts.HelveticaBold);
  const sheet = new Sheet(doc, reg, bold);

  // Re-use same data sheet with TSAP title
  sheet.drawDocHeader(
    "Pre-filled Application Data - Form H0011 (TSAP)",
    "Texas Simplified Application Project  |  SNAP Food Benefits",
  );
  sheet.sectionHead("Applicant Information");
  sheet.field("First name",   data.firstName,   MARGIN,                COL_W * 0.38);
  sheet.field("Middle name",  data.middleName,  MARGIN + COL_W * 0.40, COL_W * 0.20);
  sheet.field("Last name",    data.lastName,    MARGIN + COL_W * 0.62, COL_W * 0.38);
  sheet.rowEnd(3);
  sheet.field("Home address", data.address,   MARGIN,                COL_W * 0.55);
  sheet.field("City",         data.city,      MARGIN + COL_W * 0.57, COL_W * 0.20);
  sheet.field("State",        data.stateAbbr, MARGIN + COL_W * 0.79, COL_W * 0.08);
  sheet.field("ZIP",          data.zipCode,   MARGIN + COL_W * 0.89, COL_W * 0.11);
  sheet.rowEnd(4);
  sheet.field("Phone number", data.phone, MARGIN, COL_W * 0.38);
  sheet.field("County",       data.county, MARGIN + COL_W * 0.40, COL_W * 0.38);
  sheet.rowEnd(2);
  sheet.sectionHead("Household Income & Assets");
  sheet.field("Est. monthly gross income",     data.estimatedMonthlyIncome, MARGIN,                COL_W * 0.38);
  sheet.field("Number of people in household", data.householdSize,          MARGIN + COL_W * 0.40, COL_W * 0.38);
  sheet.rowEnd(2);
  sheet.yesno("Does anyone in the home have money in the bank or cash?", false);
  sheet.yesno("Does anyone expect to receive money this month?",         false);
  sheet.yesno("Does anyone pay costs for housing and utilities?",        !!(data.estimatedHousing));
  sheet.drawFooter("TSAP data reference");

  // Append official H0011 blank form
  const formDoc = await loadOfficialForm("/forms/H0011.pdf");
  if (formDoc && formDoc.getPageCount() > 0) {
    await addSeparatorPage(
      doc,
      "Texas Simplified Application Project (TSAP)",
      "H0011",
      "The following pages are the official blank Form H0011 (July 2025) for SNAP benefits. " +
      "This shorter form is for households where everyone is 60+ or receives disability payments.",
    );
    const count = formDoc.getPageCount();
    const copied = await doc.copyPages(formDoc, Array.from({ length: count }, (_, i) => i));
    for (const p of copied) doc.addPage(p);
  }

  const bytes = await doc.save();
  return bytes;
}

/** Generates the H1010-MR addendum data sheet (included in main packet above). */
export async function generateTexasH1010MrPdf(intake: IntakeForm): Promise<Uint8Array> {
  return (await generateTexasH1010MrPdfPair(intake)).final;
}

export async function generateTexasH1010MrPdfPair(intake: IntakeForm): Promise<PdfPair> {
  const bytes = await generateTexasH1010Pdf(intake, []);
  return { final: bytes, preview: bytes };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function formatPhone(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value || "";
}

function formatSsn(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return value || "";
}

function incomeLabel(band: IntakeForm["monthlyIncomeBand"]): string {
  const map: Record<string, string> = {
    "under-1000": "Under $1,000",
    "1000-2000":  "$1,000 to $2,000",
    "2000-3500":  "$2,000 to $3,500",
    "3500-plus":  "$3,500+",
  };
  return map[band] ?? "";
}

function estimatedHousingFallback(intake: IntakeForm): string {
  if (intake.needsHousingHelp) return "~$800";
  if (intake.needsUtilityHelp) return "~$250";
  return "";
}

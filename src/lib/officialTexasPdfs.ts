import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { IntakeForm, MatchResult } from "./matching";

const FORM_URL = "/forms/H1010_Apr2024_3.pdf";
const MEDICAL_ADDENDUM_URL = "/forms/H1010-MR.pdf";

type PdfPage = Awaited<ReturnType<typeof loadPdf>>["pages"][number];
type Rect = { x: number; y: number; width: number; height: number };

export async function generateTexasH1010Pdf(
  intake: IntakeForm,
  matches: MatchResult[],
) {
  const { pdfDoc, pages } = await loadPdf(FORM_URL);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  fillH1010Page1(pages[4], intake, matches, font, boldFont);
  fillH1010Page2(pages[5], intake, font, boldFont);
  fillH1010Page16(pages[19], intake, font, boldFont);

  return pdfDoc.save();
}

export async function generateTexasH1010MrPdf(intake: IntakeForm) {
  const { pdfDoc, pages } = await loadPdf(MEDICAL_ADDENDUM_URL);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  fillH1010MrPage1(pages[0], intake, font, boldFont);

  return pdfDoc.save();
}

async function loadPdf(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load PDF template from ${url}`);
  }

  const pdfDoc = await PDFDocument.load(await response.arrayBuffer());
  return {
    pdfDoc,
    pages: pdfDoc.getPages(),
  };
}

function fillH1010Page1(
  page: PdfPage,
  intake: IntakeForm,
  matches: MatchResult[],
  font: StandardFonts.Helvetica extends never ? never : any,
  boldFont: StandardFonts.HelveticaBold extends never ? never : any,
) {
  const selected = new Set(matches.map(({ program }) => program.id));
  const black = rgb(0.08, 0.08, 0.08);
  const inputSize = 12;
  const smallSize = 11;

  if (selected.has("snap")) {
    drawMark(page, 207, 649, boldFont);
  }
  if (selected.has("tanf")) {
    drawMark(page, 351, 649, boldFont);
  }
  if (selected.has("chip")) {
    drawMark(page, 468, 681, boldFont);
  }
  if (selected.has("medicaid") && intake.childrenUnder19) {
    drawMark(page, 468, 656, boldFont);
  }
  if (selected.has("medicaid") && !intake.childrenUnder19) {
    drawMark(page, 468, 632, boldFont);
  }
  if (intake.pregnantOrPostpartum) {
    drawMark(page, 468, 608, boldFont);
  }

  drawField(page, intake.firstName, { x: 157, y: 526, width: 115, height: 18 }, inputSize, font, black, "center");
  drawField(page, intake.middleName, { x: 316, y: 526, width: 98, height: 18 }, inputSize, font, black, "center");
  drawField(page, intake.lastName, { x: 476, y: 526, width: 88, height: 18 }, inputSize, font, black, "center");
  drawField(page, formatSsn(intake.socialSecurityNumber), { x: 320, y: 479, width: 105, height: 18 }, inputSize, font, black, "center");
  drawField(page, formatDate(intake.dateOfBirth), { x: 443, y: 479, width: 118, height: 18 }, inputSize, font, black, "center");

  drawField(page, intake.address, { x: 320, y: 455, width: 243, height: 18 }, inputSize, font, black);
  drawField(page, intake.city, { x: 320, y: 407, width: 108, height: 18 }, inputSize, font, black, "center");
  drawField(page, "TX", { x: 430, y: 407, width: 59, height: 18 }, inputSize, boldFont, black, "center");
  drawField(page, intake.zipCode, { x: 541, y: 407, width: 36, height: 18 }, inputSize, font, black, "center");
  drawField(page, formatPhone(intake.phone), { x: 320, y: 359, width: 108, height: 18 }, inputSize, font, black, "center");
  drawField(page, formatPhone(intake.cellPhone || intake.phone), { x: 443, y: 359, width: 118, height: 18 }, inputSize, font, black, "center");
  drawField(page, intake.address, { x: 320, y: 310, width: 243, height: 18 }, inputSize, font, black);
  drawField(page, intake.county, { x: 430, y: 310, width: 133, height: 18 }, inputSize, font, black, "center");
  drawField(page, intake.city, { x: 320, y: 262, width: 108, height: 18 }, inputSize, font, black, "center");
  drawField(page, "TX", { x: 430, y: 262, width: 59, height: 18 }, inputSize, boldFont, black, "center");
  drawField(page, intake.zipCode, { x: 541, y: 262, width: 36, height: 18 }, inputSize, font, black, "center");

  drawYesNo(page, false, 438, 144, 481, 144, boldFont);
  drawYesNo(page, monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand) !== "", 438, 112, 474, 112, boldFont);
  drawField(
    page,
    monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand),
    { x: 515, y: 101, width: 53, height: 16 },
    smallSize,
    font,
    black,
    "center",
  );
  drawYesNo(page, monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand) !== "", 438, 82, 474, 82, boldFont);
  drawField(
    page,
    monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand),
    { x: 515, y: 70, width: 53, height: 16 },
    smallSize,
    font,
    black,
    "center",
  );
  drawYesNo(page, intake.needsHousingHelp || intake.needsUtilityHelp, 438, 49, 474, 49, boldFont);
  drawField(
    page,
    estimatedHousingAmount(intake),
    { x: 515, y: 38, width: 53, height: 16 },
    smallSize,
    font,
    black,
    "center",
  );

}

function fillH1010Page2(
  page: PdfPage,
  intake: IntakeForm,
  font: StandardFonts.Helvetica extends never ? never : any,
  boldFont: StandardFonts.HelveticaBold extends never ? never : any,
) {
  drawYesNo(page, intake.pregnantOrPostpartum, 512, 699, 554, 699, boldFont);

  drawYesNo(page, intake.isActiveDuty, 512, 470, 554, 470, boldFont);
  drawYesNo(page, intake.isVeteran, 512, 414, 554, 414, boldFont);

  drawYesNo(page, intake.needsInterviewHelp, 513, 213, 556, 213, boldFont);
  drawYesNo(page, intake.interviewHelpDetails.trim().length > 0, 513, 163, 556, 163, boldFont);
  drawField(
    page,
    intake.interviewLanguage || (intake.language === "es" ? "Spanish" : "English"),
    { x: 362, y: 86, width: 196, height: 18 },
    11,
    font,
    rgb(0.08, 0.08, 0.08),
    "center",
  );
  drawYesNo(page, intake.needsInterpreter, 514, 52, 556, 52, boldFont);
  if (intake.needsInterpreter) {
    if ((intake.interpreterLanguage || intake.language).toLowerCase().includes("span")) {
      drawMark(page, 179, 20, boldFont);
    } else {
      drawField(
        page,
        intake.interpreterLanguage,
        { x: 364, y: 6, width: 194, height: 18 },
        10.5,
        font,
        rgb(0.08, 0.08, 0.08),
        "center",
      );
    }
  }

  drawField(
    page,
    formatSsn(intake.socialSecurityNumber),
    { x: 63, y: 0, width: 131, height: 18 },
    11,
    font,
    rgb(0.08, 0.08, 0.08),
    "center",
  );
}

function fillH1010Page16(
  page: PdfPage,
  intake: IntakeForm,
  font: StandardFonts.Helvetica extends never ? never : any,
  boldFont: StandardFonts.HelveticaBold extends never ? never : any,
) {
  const black = rgb(0.08, 0.08, 0.08);

  drawField(
    page,
    fullName(intake),
    { x: 337, y: 320, width: 224, height: 18 },
    12,
    font,
    black,
    "center",
  );
  drawField(
    page,
    intake.interviewLanguage || (intake.language === "es" ? "Spanish" : "English"),
    { x: 336, y: 290, width: 225, height: 18 },
    12,
    font,
    black,
    "center",
  );

  if (intake.preferredContactMethod === "phone") {
    drawMark(page, 145, 247, boldFont);
    drawField(page, formatPhone(intake.phone), { x: 438, y: 246, width: 112, height: 18 }, 12, font, black, "center");
  }
  if (intake.preferredContactMethod === "text") {
    drawMark(page, 145, 196, boldFont);
    drawField(
      page,
      formatPhone(intake.cellPhone || intake.phone),
      { x: 438, y: 195, width: 112, height: 18 },
      12,
      font,
      black,
      "center",
    );
  }
  if (intake.preferredContactMethod === "email") {
    drawMark(page, 145, 145, boldFont);
    drawField(page, intake.email, { x: 332, y: 145, width: 228, height: 18 }, 11, font, black, "center");
  }

  drawField(page, formatSsn(intake.socialSecurityNumber), { x: 69, y: 16, width: 126, height: 18 }, 11, font, black, "center");
}

function fillH1010MrPage1(
  page: PdfPage,
  intake: IntakeForm,
  font: StandardFonts.Helvetica extends never ? never : any,
  boldFont: StandardFonts.HelveticaBold extends never ? never : any,
) {
  const black = rgb(0.08, 0.08, 0.08);

  drawField(page, intake.firstName, { x: 135, y: 390, width: 100, height: 16 }, 10.5, font, black, "center");
  drawField(page, intake.middleName, { x: 260, y: 390, width: 92, height: 16 }, 10.5, font, black, "center");
  drawField(page, intake.lastName, { x: 404, y: 390, width: 116, height: 16 }, 10.5, font, black, "center");
  drawField(page, intake.spouseName, { x: 136, y: 341, width: 386, height: 16 }, 10.5, font, black, "center");

  drawYesNo(page, intake.plansToFileTaxes === "yes", 521, 282, 560, 282, boldFont);
  drawYesNo(page, intake.filesJointly === "yes", 521, 246, 560, 246, boldFont);
  drawYesNo(page, intake.claimsDependents === "yes", 521, 211, 560, 211, boldFont);
  drawField(page, intake.dependentNames, { x: 136, y: 167, width: 388, height: 16 }, 9.5, font, black, "center");
  drawYesNo(page, intake.claimedAsDependent === "yes", 521, 136, 560, 136, boldFont);
  drawField(page, intake.taxFilerName, { x: 136, y: 106, width: 255, height: 16 }, 10.5, font, black, "center");
  drawField(page, intake.taxRelationship, { x: 414, y: 106, width: 120, height: 16 }, 10, font, black, "center");
}

function drawField(
  page: PdfPage,
  text: string,
  rect: Rect,
  size: number,
  font: any,
  color: ReturnType<typeof rgb>,
  align: "left" | "center" = "left",
) {
  const value = (text || "").trim();
  if (!value) {
    return;
  }

  const horizontalPadding = 4;
  const maxWidth = rect.width - horizontalPadding * 2;
  const content = truncateToWidth(value, maxWidth, size, font);
  const textWidth = font.widthOfTextAtSize(content, size);
  const x =
    align === "center"
      ? rect.x + Math.max((rect.width - textWidth) / 2, horizontalPadding)
      : rect.x + horizontalPadding;

  // Use Helvetica font metrics for accurate vertical centering:
  // ascent ≈ 0.718 × size (top of capitals above baseline)
  // descent ≈ 0.207 × size (descenders below baseline)
  // Centers the visible glyph range in the field box.
  const ascent = size * 0.718;
  const descent = size * 0.207;
  const y = rect.y + (rect.height - ascent - descent) / 2 + descent;

  page.drawText(content, { x, y, size, font, color });
}

function truncateToWidth(text: string, maxWidth: number, size: number, font: any) {
  let result = text.trim();
  while (result.length > 0 && font.widthOfTextAtSize(result, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result;
}

function drawMark(page: PdfPage, x: number, y: number, font: any) {
  page.drawText("X", {
    x,
    y,
    size: 13,
    font,
    color: rgb(0.08, 0.08, 0.08),
  });
}

function drawYesNo(
  page: PdfPage,
  yes: boolean,
  yesX: number,
  yesY: number,
  noX: number,
  noY: number,
  font: any,
) {
  drawMark(page, yes ? yesX : noX, yes ? yesY : noY, font);
}

function fullName(intake: IntakeForm) {
  return [intake.firstName, intake.middleName, intake.lastName].filter(Boolean).join(" ");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return value;
}

function formatDate(value: string) {
  return value;
}

function monthlyIncomeToEstimatedAmount(incomeBand: IntakeForm["monthlyIncomeBand"]) {
  const map = {
    "under-1000": "900",
    "1000-2000": "1500",
    "2000-3500": "2750",
    "3500-plus": "3500+",
  };
  return map[incomeBand];
}

function estimatedHousingAmount(intake: IntakeForm) {
  if (intake.needsHousingHelp || intake.needsUtilityHelp) {
    return intake.needsHousingHelp ? "800" : "250";
  }
  return "";
}

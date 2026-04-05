"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTexasH1010Pdf = generateTexasH1010Pdf;
exports.generateTexasH1010MrPdf = generateTexasH1010MrPdf;
const pdf_lib_1 = require("pdf-lib");
const FORM_URL = "/forms/H1010_Apr2024_3.pdf";
const MEDICAL_ADDENDUM_URL = "/forms/H1010-MR.pdf";
async function generateTexasH1010Pdf(intake, matches) {
    const { pdfDoc, pages } = await loadPdf(FORM_URL);
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    fillH1010Page1(pages[4], intake, matches, font, boldFont);
    fillH1010Page2(pages[5], intake, font, boldFont);
    fillH1010Page16(pages[19], intake, font, boldFont);
    return pdfDoc.save();
}
async function generateTexasH1010MrPdf(intake) {
    const { pdfDoc, pages } = await loadPdf(MEDICAL_ADDENDUM_URL);
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    fillH1010MrPage1(pages[0], intake, font, boldFont);
    return pdfDoc.save();
}
async function loadPdf(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to load PDF template from ${url}`);
    }
    const pdfDoc = await pdf_lib_1.PDFDocument.load(await response.arrayBuffer());
    return {
        pdfDoc,
        pages: pdfDoc.getPages(),
    };
}
function fillH1010Page1(page, intake, matches, font, boldFont) {
    const selected = new Set(matches.map(({ program }) => program.id));
    const black = (0, pdf_lib_1.rgb)(0.08, 0.08, 0.08);
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
    drawText(page, intake.firstName, 330, 538, inputSize, font, black);
    drawText(page, intake.middleName, 474, 538, inputSize, font, black);
    drawText(page, intake.lastName, 545, 538, inputSize, font, black);
    drawText(page, formatSsn(intake.socialSecurityNumber), 330, 491, inputSize, font, black);
    drawText(page, formatDate(intake.dateOfBirth), 452, 491, inputSize, font, black);
    drawText(page, intake.address, 330, 445, inputSize, font, black);
    drawText(page, intake.city, 330, 399, inputSize, font, black);
    drawText(page, "TX", 474, 399, inputSize, boldFont, black);
    drawText(page, intake.zipCode, 555, 399, inputSize, font, black);
    drawText(page, formatPhone(intake.phone), 330, 351, inputSize, font, black);
    drawText(page, formatPhone(intake.cellPhone || intake.phone), 474, 351, inputSize, font, black);
    drawText(page, intake.address, 330, 304, inputSize, font, black);
    drawText(page, intake.city, 330, 257, inputSize, font, black);
    drawText(page, "TX", 474, 257, inputSize, boldFont, black);
    drawText(page, intake.zipCode, 555, 257, inputSize, font, black);
    drawYesNo(page, false, 438, 144, 481, 144, boldFont);
    drawYesNo(page, monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand) !== "", 438, 112, 474, 112, boldFont);
    drawText(page, monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand), 523, 108, smallSize, font, black);
    drawYesNo(page, monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand) !== "", 438, 82, 474, 82, boldFont);
    drawText(page, monthlyIncomeToEstimatedAmount(intake.monthlyIncomeBand), 523, 77, smallSize, font, black);
    drawYesNo(page, intake.needsHousingHelp || intake.needsUtilityHelp, 438, 49, 474, 49, boldFont);
    drawText(page, estimatedHousingAmount(intake), 523, 45, smallSize, font, black);
    drawText(page, fullName(intake), 334, 18, 11, font, black);
    drawText(page, new Date().toLocaleDateString("en-US"), 458, 18, 11, font, black);
}
function fillH1010Page2(page, intake, font, boldFont) {
    const black = (0, pdf_lib_1.rgb)(0.08, 0.08, 0.08);
    drawYesNo(page, intake.pregnantOrPostpartum, 512, 699, 554, 699, boldFont);
    drawText(page, intake.pregnantOrPostpartum ? fullName(intake) : "", 333, 671, 11, font, black);
    drawYesNo(page, false, 351, 637, 397, 637, boldFont);
    drawText(page, "", 471, 644, 11, font, black);
    drawText(page, "", 329, 580, 11, font, black);
    drawYesNo(page, false, 512, 530, 554, 530, boldFont);
    drawYesNo(page, intake.isActiveDuty, 512, 470, 554, 470, boldFont);
    drawText(page, intake.isActiveDuty ? fullName(intake) : "", 332, 444, 11, font, black);
    drawYesNo(page, intake.isVeteran, 512, 414, 554, 414, boldFont);
    drawText(page, intake.isVeteran ? fullName(intake) : "", 332, 388, 11, font, black);
    drawYesNo(page, intake.needsInterviewHelp, 513, 213, 556, 213, boldFont);
    drawYesNo(page, intake.interviewHelpDetails.trim().length > 0, 513, 163, 556, 163, boldFont);
    drawText(page, intake.interviewHelpDetails, 374, 141, 10.5, font, black, 210);
    drawText(page, intake.interviewLanguage || (intake.language === "es" ? "Spanish" : "English"), 471, 94, 11, font, black);
    drawYesNo(page, intake.needsInterpreter, 514, 52, 556, 52, boldFont);
    if (intake.needsInterpreter) {
        if ((intake.interpreterLanguage || intake.language).toLowerCase().includes("span")) {
            drawMark(page, 179, 20, boldFont);
        }
        else {
            drawText(page, intake.interpreterLanguage, 376, 14, 10.5, font, black, 180);
        }
    }
    drawText(page, formatSsn(intake.socialSecurityNumber), 72, 4, 11, font, black);
}
function fillH1010Page16(page, intake, font, boldFont) {
    const black = (0, pdf_lib_1.rgb)(0.08, 0.08, 0.08);
    drawText(page, fullName(intake), 385, 332, 12, font, black, 380);
    drawText(page, intake.interviewLanguage || (intake.language === "es" ? "Spanish" : "English"), 379, 303, 12, font, black, 245);
    if (intake.preferredContactMethod === "phone") {
        drawMark(page, 307, 249, boldFont);
        drawText(page, formatPhone(intake.phone), 462, 264, 12, font, black, 200);
    }
    if (intake.preferredContactMethod === "text") {
        drawMark(page, 307, 199, boldFont);
        drawText(page, formatPhone(intake.cellPhone || intake.phone), 462, 213, 12, font, black, 200);
    }
    if (intake.preferredContactMethod === "email") {
        drawMark(page, 307, 149, boldFont);
        drawText(page, intake.email, 430, 164, 11, font, black, 260);
    }
    drawText(page, formatSsn(intake.socialSecurityNumber), 72, 28, 11, font, black);
}
function fillH1010MrPage1(page, intake, font, boldFont) {
    const black = (0, pdf_lib_1.rgb)(0.08, 0.08, 0.08);
    drawText(page, intake.firstName, 154, 396, 11, font, black, 115);
    drawText(page, intake.middleName, 287, 396, 11, font, black, 85);
    drawText(page, intake.lastName, 430, 396, 11, font, black, 120);
    drawText(page, intake.spouseName, 161, 348, 11, font, black, 360);
    drawYesNo(page, intake.plansToFileTaxes === "yes", 521, 282, 560, 282, boldFont);
    drawYesNo(page, intake.filesJointly === "yes", 521, 246, 560, 246, boldFont);
    drawYesNo(page, intake.claimsDependents === "yes", 521, 211, 560, 211, boldFont);
    drawText(page, intake.dependentNames, 165, 187, 11, font, black, 380);
    drawYesNo(page, intake.claimedAsDependent === "yes", 521, 136, 560, 136, boldFont);
    drawText(page, intake.taxFilerName, 166, 112, 11, font, black, 235);
    drawText(page, intake.taxRelationship, 440, 112, 10.5, font, black, 125);
}
function drawText(page, text, x, y, size, font, color, maxWidth) {
    const value = (text || "").trim();
    if (!value) {
        return;
    }
    const content = maxWidth ? truncateToWidth(value, maxWidth, size, font) : value;
    page.drawText(content, { x, y, size, font, color });
}
function truncateToWidth(text, maxWidth, size, font) {
    let result = text.trim();
    while (result.length > 0 && font.widthOfTextAtSize(result, size) > maxWidth) {
        result = result.slice(0, -1);
    }
    return result;
}
function drawMark(page, x, y, font) {
    page.drawText("X", {
        x,
        y,
        size: 13,
        font,
        color: (0, pdf_lib_1.rgb)(0.08, 0.08, 0.08),
    });
}
function drawYesNo(page, yes, yesX, yesY, noX, noY, font) {
    drawMark(page, yes ? yesX : noX, yes ? yesY : noY, font);
}
function fullName(intake) {
    return [intake.firstName, intake.middleName, intake.lastName].filter(Boolean).join(" ");
}
function formatPhone(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
}
function formatSsn(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 9) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }
    return value;
}
function formatDate(value) {
    return value;
}
function monthlyIncomeToEstimatedAmount(incomeBand) {
    const map = {
        "under-1000": "900",
        "1000-2000": "1500",
        "2000-3500": "2750",
        "3500-plus": "3500+",
    };
    return map[incomeBand];
}
function estimatedHousingAmount(intake) {
    if (intake.needsHousingHelp || intake.needsUtilityHelp) {
        return intake.needsHousingHelp ? "800" : "250";
    }
    return "";
}

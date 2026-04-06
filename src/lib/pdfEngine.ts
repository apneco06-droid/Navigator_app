/**
 * pdfEngine.ts — Generic PDF field rendering engine
 *
 * Responsibilities:
 *  - Detect whether a PDF has real fillable AcroForm fields
 *  - Fill AcroForm fields directly when present
 *  - Render text / checkbox marks via coordinate overlay when no AcroForm fields exist
 *  - Handle: bounding-box layout, top-left ↔ bottom-left conversion, page rotation,
 *            font autosizing, single-line / multiline, left/center/right alignment
 *  - Debug mode: draws visible field rectangles for visual coordinate calibration
 *
 * This module has NO knowledge of specific forms or user data.
 * All coordinate decisions live in the form templates (officialTexasPdfs.ts).
 */

import { PDFDocument, PDFPage, rgb } from "pdf-lib";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Coordinate system for a field's bounding box or point. */
export type CoordSystem = "bottom-left" | "top-left";

/** Horizontal text alignment inside a field. */
export type Align = "left" | "center" | "right";

/** A bounding box in points. */
export interface FieldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A text field definition.
 * `rect` defaults to bottom-left PDF coordinates unless `coords: "top-left"` is set.
 */
export interface TextFieldDef {
  kind: "text";
  /** Key into the flat data Record<string,string>. */
  key: string;
  /** 0-based page index. */
  page: number;
  /** Bounding box for the field. Text is clipped and aligned within this box. */
  rect: FieldRect;
  /** Coordinate system for rect. Default: "bottom-left" (native PDF). */
  coords?: CoordSystem;
  /** Horizontal alignment within rect. Default: "left". */
  align?: Align;
  /** Max number of wrapped lines. Default: 1 (single-line, truncated). */
  maxLines?: number;
  /**
   * Fixed font size. When omitted, autosizing is used (shrinks from maxFontSize
   * down to minFontSize until text fits the rect width).
   */
  fontSize?: number;
  /** Autosize lower bound. Default: 7. */
  minFontSize?: number;
  /** Autosize upper bound (also the starting size). Default: 12. */
  maxFontSize?: number;
  /** If true, converts the value to uppercase before rendering. */
  uppercase?: boolean;
}

/**
 * A mark field definition (checkbox / radio / "X" mark).
 * Rendered as a single character at a point. Uses boldFont.
 */
export interface MarkFieldDef {
  kind: "mark";
  /** Key into the flat data Record<string,string>. Value "true" triggers the mark. */
  key: string;
  /** 0-based page index. */
  page: number;
  /** X coordinate (points). */
  x: number;
  /** Y coordinate (points). */
  y: number;
  /** Coordinate system. Default: "bottom-left". */
  coords?: CoordSystem;
  /** Character to draw. Default: "X". */
  char?: string;
  /** Font size. Default: 13. */
  fontSize?: number;
}

export type FieldDef = TextFieldDef | MarkFieldDef;

/** Options for renderFields(). */
export interface RenderOptions {
  /**
   * Debug mode: draws a colored border around every field rect and prints
   * the field key above it. Use to visually calibrate coordinate templates.
   */
  debug?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BLACK             = rgb(0.08, 0.08, 0.08);
const DEBUG_TEXT_COLOR  = rgb(0.85, 0.07, 0.07);
const DEBUG_MARK_COLOR  = rgb(0.07, 0.07, 0.85);
/** Helvetica cap height as a fraction of the em size (for vertical centering). */
const CAP_HEIGHT_RATIO  = 0.72;
const HPAD              = 3;   // horizontal padding inside field rects

// ─────────────────────────────────────────────────────────────────────────────
// ACROFORM DETECTION + FILLING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the document has real, user-fillable AcroForm fields
 * beyond the QR/barcode-only fields that HHSC XFA forms expose after stripping.
 */
export function hasRealAcroFormFields(doc: PDFDocument): boolean {
  try {
    const form = doc.getForm();
    const fields = form.getFields();
    return fields.some((f) => {
      const name = f.getName().toLowerCase();
      const type = f.constructor.name;
      return (
        type !== "PDFSignature" &&
        !name.includes("qr") &&
        !name.includes("barcode") &&
        !name.includes("qrcode")
      );
    });
  } catch {
    return false;
  }
}

/**
 * Fills AcroForm text / checkbox / dropdown / radio fields from a flat data map.
 * Matches fields by their full name, then by the last path segment.
 */
export async function fillAcroFormFields(
  doc: PDFDocument,
  data: Record<string, string>,
  font?: unknown,
): Promise<void> {
  const form = doc.getForm();
  for (const field of form.getFields()) {
    const fullName  = field.getName();
    const shortName = fullName.split(/[.[\]]+/).filter(Boolean).pop() ?? fullName;
    const value     = data[fullName] ?? data[shortName];
    if (value === undefined) continue;

    const type = field.constructor.name;
    try {
      if (type === "PDFTextField") {
        (field as any).setText(value);
        if (font) {
          try { (field as any).updateAppearances(font); } catch { /* ignore */ }
        }
      } else if (type === "PDFCheckBox") {
        if (value === "true" || value === "yes" || value === "1") {
          (field as any).check();
        } else {
          (field as any).uncheck();
        }
      } else if (type === "PDFDropdown" || type === "PDFRadioGroup") {
        (field as any).select(value);
      }
    } catch { /* ignore unmapped or read-only fields */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a rect from top-left origin to pdf-lib's bottom-left origin,
 * accounting for page rotation.
 */
function rectToBottomLeft(
  page: PDFPage,
  rect: FieldRect,
  coords: CoordSystem = "bottom-left",
): FieldRect {
  if (coords === "bottom-left") return rect;

  const angle            = page.getRotation().angle % 360;
  const { width: pw, height: ph } = page.getSize();
  const { x, y, width, height } = rect;

  switch (angle) {
    case 0:
      // Standard: flip y axis
      return { x, y: ph - y - height, width, height };
    case 90:
      // Page appears portrait but is stored landscape; swap axes
      return { x: y, y: pw - x - width, width: height, height: width };
    case 180:
      return { x: pw - x - width, y: y, width, height };
    case 270:
      return { x: ph - y - height, y: x, width: height, height: width };
    default:
      return { x, y: ph - y - height, width, height };
  }
}

/**
 * Converts a single point from top-left origin to pdf-lib's bottom-left origin.
 */
function pointToBottomLeft(
  page: PDFPage,
  px: number,
  py: number,
  coords: CoordSystem = "bottom-left",
): { x: number; y: number } {
  if (coords === "bottom-left") return { x: px, y: py };
  const { height: ph } = page.getSize();
  return { x: px, y: ph - py };
}

// ─────────────────────────────────────────────────────────────────────────────
// FONT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function autoSize(
  font: any,
  text: string,
  maxWidth: number,
  fixed?: number,
  min = 7,
  max = 12,
): number {
  if (fixed !== undefined) return fixed;
  let size = max;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) {
    size = Math.max(min, size - 0.5);
  }
  return size;
}

function truncate(font: any, text: string, maxWidth: number, size: number): string {
  let s = text;
  while (s.length > 0 && font.widthOfTextAtSize(s, size) > maxWidth) {
    s = s.slice(0, -1);
  }
  return s;
}

function wordWrap(
  font: any,
  text: string,
  maxWidth: number,
  size: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line   = "";

  for (const word of words) {
    if (lines.length >= maxLines) break;
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function alignX(
  font: any,
  text: string,
  size: number,
  rect: FieldRect,
  align: Align,
): number {
  const tw = font.widthOfTextAtSize(text, size);
  if (align === "center") return rect.x + Math.max((rect.width - tw) / 2, HPAD);
  if (align === "right")  return rect.x + rect.width - tw - HPAD;
  return rect.x + HPAD;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

function renderTextField(
  page: PDFPage,
  font: any,
  field: TextFieldDef,
  data: Record<string, string>,
  debug: boolean,
): void {
  const rect = rectToBottomLeft(page, field.rect, field.coords);

  // ── Debug overlay ──────────────────────────────────────────────────────────
  if (debug) {
    page.drawRectangle({
      x: rect.x, y: rect.y,
      width: rect.width, height: rect.height,
      borderColor: DEBUG_TEXT_COLOR, borderWidth: 0.5,
    });
    try {
      page.drawText(field.key, {
        x: rect.x + 1,
        y: rect.y + rect.height + 1,
        size: 4.5,
        font,
        color: DEBUG_TEXT_COLOR,
        maxWidth: rect.width,
      });
    } catch { /* some key strings contain non-WinAnsi chars — ignore */ }
  }

  // ── Render value ───────────────────────────────────────────────────────────
  const raw   = data[field.key] ?? "";
  const value = field.uppercase ? raw.toUpperCase() : raw;
  if (!value) return;

  const maxLines = field.maxLines ?? 1;
  const maxWidth = rect.width - HPAD * 2;
  const align    = field.align ?? "left";

  if (maxLines === 1) {
    const size    = autoSize(font, value, maxWidth, field.fontSize, field.minFontSize, field.maxFontSize);
    const content = truncate(font, value, maxWidth, size);
    const capH    = size * CAP_HEIGHT_RATIO;
    const x       = alignX(font, content, size, rect, align);
    const y       = rect.y + (rect.height - capH) / 2;
    page.drawText(content, { x, y, size, font, color: BLACK });
  } else {
    const size       = field.fontSize ?? field.maxFontSize ?? 10;
    const lineHeight = size * 1.35;
    const lines      = wordWrap(font, value, maxWidth, size, maxLines);
    const totalH     = lines.length * lineHeight;
    // Top-align within rect (start from capHeight below top edge)
    let y = rect.y + rect.height - (rect.height - totalH) / 2 - size * 0.15;
    for (const line of lines) {
      const x = alignX(font, line, size, rect, align);
      page.drawText(line, { x, y, size, font, color: BLACK });
      y -= lineHeight;
    }
  }
}

function renderMarkField(
  page: PDFPage,
  boldFont: any,
  field: MarkFieldDef,
  data: Record<string, string>,
  debug: boolean,
): void {
  const value     = data[field.key] ?? "";
  const shouldMark = value === "true" || value === "yes" || value === "1";
  const size       = field.fontSize ?? 13;
  const char       = field.char     ?? "X";
  const pt         = pointToBottomLeft(page, field.x, field.y, field.coords);

  // ── Debug overlay ──────────────────────────────────────────────────────────
  if (debug) {
    page.drawRectangle({
      x: pt.x - 1, y: pt.y - 1,
      width: size + 2, height: size + 2,
      borderColor: DEBUG_MARK_COLOR, borderWidth: 0.5,
    });
    try {
      page.drawText(field.key, {
        x: pt.x,
        y: pt.y + size + 1,
        size: 4,
        font: boldFont,
        color: DEBUG_MARK_COLOR,
      });
    } catch { /* ignore */ }
  }

  if (!shouldMark) return;
  page.drawText(char, { x: pt.x, y: pt.y, size, font: boldFont, color: BLACK });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC RENDER ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders all fields from a template onto the given PDF pages.
 *
 * @param pages     Array of PDF pages (from pdfDoc.getPages()).
 * @param font      Regular (Helvetica) font embedded in the document.
 * @param boldFont  Bold (HelveticaBold) font embedded in the document.
 * @param fields    Coordinate template — an array of FieldDef objects.
 * @param data      Flat key→value map of user data.
 * @param options   RenderOptions (debug mode, etc.).
 */
export function renderFields(
  pages: PDFPage[],
  font: any,
  boldFont: any,
  fields: FieldDef[],
  data: Record<string, string>,
  options: RenderOptions = {},
): void {
  const { debug = false } = options;

  for (const field of fields) {
    const page = pages[field.page];
    if (!page) continue;

    if (field.kind === "text") {
      renderTextField(page, font, field, data, debug);
    } else {
      renderMarkField(page, boldFont, field, data, debug);
    }
  }
}

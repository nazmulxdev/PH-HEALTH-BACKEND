import PDFDocument from "pdfkit";
import { config } from "../../config/env";

interface IPrescriptionData {
  doctorName: string;
  doctorEmail: string;
  patientName: string;
  patientEmail: string;
  appointmentDate: Date;
  instructions: string;
  followUpDate: Date;
  prescriptionId: string;
  createdAt: Date;
}

// ── Color palette ──────────────────────────────────────────────────────────────
const C = {
  primary: "#1a6b8a", // deep teal
  primaryLight: "#e8f4f8", // teal tint
  accent: "#27ae60", // green accent
  accentLight: "#eafaf1",
  dark: "#1c2833",
  muted: "#7f8c8d",
  border: "#d5e8f0",
  white: "#ffffff",
  sectionBg: "#f7fbfd",
  footerBg: "#1a6b8a",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const hex2rgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const fill = (doc: PDFKit.PDFDocument, color: string) =>
  doc.fillColor(hex2rgb(color) as [number, number, number]);

const stroke = (doc: PDFKit.PDFDocument, color: string) =>
  doc.strokeColor(hex2rgb(color) as [number, number, number]);

const fmt = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// ── Main generator ─────────────────────────────────────────────────────────────
export const generatePrescriptionPDFV2 = async (
  data: IPrescriptionData,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = 595.28; // A4 width in points
      const margin = 48;
      const contentW = W - margin * 2;

      // ── 1. Header band ───────────────────────────────────────────────────────
      doc.rect(0, 0, W, 110).fill(hex2rgb(C.primary));

      // Logo circle
      doc.circle(margin + 24, 55, 24).fill(hex2rgb(C.white));

      fill(doc, C.primary);
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("PH", margin + 11, 47);

      // Hospital name
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("PH Healthcare Services", margin + 58, 32);

      fill(doc, hex2rgb("#b8dce8") as unknown as string);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text("Your Health, Our Priority", margin + 58, 56);

      // Prescription label pill (top-right)
      const pillX = W - margin - 120;
      doc.roundedRect(pillX, 30, 120, 28, 14).fill(hex2rgb(C.accent));
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("PRESCRIPTION", pillX, 39, { width: 120, align: "center" });

      // ── 2. Prescription ID strip ────────────────────────────────────────────
      doc.rect(0, 110, W, 28).fill(hex2rgb(C.primaryLight));
      fill(doc, C.primary);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(`Prescription ID:  ${data.prescriptionId}`, margin, 120, {
          width: contentW / 2,
        });
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(`Issued: ${fmt(data.createdAt)}`, margin + contentW / 2, 120, {
          width: contentW / 2,
          align: "right",
        });

      let y = 152; // current Y cursor

      // ── 3. Two-column info cards ─────────────────────────────────────────────
      const cardH = 90;
      const cardW = (contentW - 16) / 2;

      // Doctor card
      doc.roundedRect(margin, y, cardW, cardH, 8).fill(hex2rgb(C.sectionBg));
      doc
        .moveTo(margin, y + 8)
        .lineTo(margin, y + cardH - 8)
        .lineWidth(3)
        .stroke(hex2rgb(C.primary));

      fill(doc, C.primary);
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("DOCTOR", margin + 12, y + 10);

      fill(doc, C.dark);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(data.doctorName, margin + 12, y + 26, { width: cardW - 20 });

      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(data.doctorEmail, margin + 12, y + 46, { width: cardW - 20 });

      // Patient card
      const pCardX = margin + cardW + 16;
      doc.roundedRect(pCardX, y, cardW, cardH, 8).fill(hex2rgb(C.accentLight));
      doc
        .moveTo(pCardX, y + 8)
        .lineTo(pCardX, y + cardH - 8)
        .lineWidth(3)
        .stroke(hex2rgb(C.accent));

      fill(doc, C.accent);
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("PATIENT", pCardX + 12, y + 10);

      fill(doc, C.dark);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(data.patientName, pCardX + 12, y + 26, { width: cardW - 20 });

      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(data.patientEmail, pCardX + 12, y + 46, { width: cardW - 20 });

      y += cardH + 24;

      // ── 4. Appointment details row ───────────────────────────────────────────
      const details = [
        { label: "Appointment Date", value: fmt(data.appointmentDate) },
        { label: "Follow-up Date", value: fmt(data.followUpDate) },
        { label: "Status", value: "Completed" },
      ];

      const detailW = contentW / details.length;

      details.forEach((d, i) => {
        const dx = margin + i * detailW;
        doc.roundedRect(dx, y, detailW - 8, 52, 6).fill(hex2rgb(C.border));

        fill(doc, C.muted);
        doc
          .font("Helvetica")
          .fontSize(8)
          .text(d.label.toUpperCase(), dx + 10, y + 10, {
            width: detailW - 20,
          });

        fill(doc, C.dark);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(d.value, dx + 10, y + 26, { width: detailW - 20 });
      });

      y += 52 + 24;

      // ── 5. Instructions section ──────────────────────────────────────────────
      // Section header
      doc.roundedRect(margin, y, contentW, 26, 6).fill(hex2rgb(C.primary));
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Instructions & Medications", margin + 12, y + 7);

      y += 34;

      // Calculate text height for dynamic box
      const instrFontSize = 10;
      doc.font("Helvetica").fontSize(instrFontSize);
      const instrHeight = doc.heightOfString(data.instructions, {
        width: contentW - 32,
      });
      const instrBoxH = Math.max(instrHeight + 24, 60);

      doc
        .roundedRect(margin, y, contentW, instrBoxH, 6)
        .fill(hex2rgb(C.sectionBg));

      // Left accent bar
      doc.rect(margin, y, 4, instrBoxH).fill(hex2rgb(C.accent));

      fill(doc, C.dark);
      doc
        .font("Helvetica")
        .fontSize(instrFontSize)
        .text(data.instructions, margin + 16, y + 12, {
          width: contentW - 32,
          lineGap: 4,
        });

      y += instrBoxH + 32;

      // ── 6. Divider ───────────────────────────────────────────────────────────
      stroke(doc, C.border);
      doc
        .moveTo(margin, y)
        .lineTo(W - margin, y)
        .lineWidth(1)
        .dash(4, { space: 4 })
        .stroke();
      doc.undash();

      y += 16;

      // ── 7. Disclaimer ────────────────────────────────────────────────────────
      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          "This is an electronically generated prescription. Please follow all instructions provided by your doctor. " +
            "For medical emergencies, contact your nearest healthcare provider immediately.",
          margin,
          y,
          { width: contentW, align: "center", lineGap: 3 },
        );

      // ── 8. Footer band ───────────────────────────────────────────────────────
      const pageH = 841.89; // A4 height
      const footerY = pageH - 48;

      doc.rect(0, footerY, W, 48).fill(hex2rgb(C.footerBg));

      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("PH Healthcare Services", margin, footerY + 10);

      fill(doc, hex2rgb("#b8dce8") as unknown as string);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(config.FRONTEND_URL, margin, footerY + 24);

      fill(doc, C.white);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `© ${new Date().getFullYear()} PH Healthcare. All rights reserved.`,
          margin,
          footerY + 10,
          { width: contentW, align: "right" },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

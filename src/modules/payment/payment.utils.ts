import PDFDocument from "pdfkit";
import { config } from "../../config/env";

interface IInvoiceData {
  prescriptionId: string;
  invoiceId: string;
  doctorName: string;
  doctorEmail: string;
  patientName: string;
  patientEmail: string;
  appointmentDate: Date;
  amount: number;
  createdAt: Date;
  paymentStatus: string;
  paymentId: string;
  paymentDate: Date;
}

// ── Color palette ──────────────────────────────────────────────────────────────
const C = {
  primary: "#1a3c5e",
  primaryLight: "#e8f0f8",
  accent: "#e67e22",
  accentLight: "#fef5ec",
  green: "#27ae60",
  greenLight: "#eafaf1",
  dark: "#1c2833",
  muted: "#7f8c8d",
  border: "#d5dfe8",
  white: "#ffffff",
  sectionBg: "#f7f9fb",
  rowAlt: "#f0f4f8",
};

const hex2rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const fill = (doc: PDFKit.PDFDocument, color: string) =>
  doc.fillColor(hex2rgb(color) as unknown as string);

const fmt = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatCurrency = (amount: number) =>
  `BDT ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export const generateInvoicePdf = async (
  data: IInvoiceData,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = 595.28;
      const H = 841.89;
      const margin = 48;
      const contentW = W - margin * 2;

      // ── 1. Header band ───────────────────────────────────────────────────────
      doc.rect(0, 0, W, 120).fill(hex2rgb(C.primary));

      // Logo circle
      doc.circle(margin + 26, 60, 26).fill(hex2rgb(C.white));
      fill(doc, C.primary);
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("PH", margin + 13, 52);

      // Hospital name + tagline
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("PH Healthcare Services", margin + 64, 30);
      fill(doc, "#a8c4dc");
      doc
        .font("Helvetica")
        .fontSize(10)
        .text("Your Health, Our Priority", margin + 64, 56);

      // INVOICE badge (top-right)
      const badgeX = W - margin - 110;
      doc.roundedRect(badgeX, 28, 110, 32, 16).fill(hex2rgb(C.accent));
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("INVOICE", badgeX, 37, { width: 110, align: "center" });

      // ── 2. Invoice meta strip ────────────────────────────────────────────────
      doc.rect(0, 120, W, 32).fill(hex2rgb(C.primaryLight));
      fill(doc, C.primary);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(`Invoice ID:  ${data.invoiceId}`, margin, 132, {
          width: contentW / 2,
        });
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Date Issued: ${fmt(data.createdAt)}`,
          margin + contentW / 2,
          132,
          {
            width: contentW / 2,
            align: "right",
          },
        );

      let y = 168;

      // ── 3. Bill From / Bill To cards ─────────────────────────────────────────
      const cardW = (contentW - 16) / 2;
      const cardH = 100;

      // Bill From (Doctor)
      doc.roundedRect(margin, y, cardW, cardH, 8).fill(hex2rgb(C.sectionBg));
      doc.rect(margin, y + 8, 4, cardH - 16).fill(hex2rgb(C.primary));
      fill(doc, C.muted);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("BILL FROM", margin + 14, y + 12);
      fill(doc, C.dark);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(data.doctorName, margin + 14, y + 28, { width: cardW - 24 });
      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(data.doctorEmail, margin + 14, y + 50, { width: cardW - 24 });
      doc
        .font("Helvetica")
        .fontSize(9)
        .text("PH Healthcare Services", margin + 14, y + 65, {
          width: cardW - 24,
        });

      // Bill To (Patient)
      const pcX = margin + cardW + 16;
      doc.roundedRect(pcX, y, cardW, cardH, 8).fill(hex2rgb(C.accentLight));
      doc.rect(pcX, y + 8, 4, cardH - 16).fill(hex2rgb(C.accent));
      fill(doc, C.muted);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("BILL TO", pcX + 14, y + 12);
      fill(doc, C.dark);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(data.patientName, pcX + 14, y + 28, { width: cardW - 24 });
      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(data.patientEmail, pcX + 14, y + 50, { width: cardW - 24 });

      y += cardH + 24;

      // ── 4. Payment status badge ──────────────────────────────────────────────
      const isPaid = data.paymentStatus?.toUpperCase() === "PAID";
      const statusColor = isPaid ? C.green : C.accent;
      const statusBg = isPaid ? C.greenLight : C.accentLight;
      const statusLabel = isPaid ? "PAID" : data.paymentStatus.toUpperCase();

      doc.roundedRect(margin, y, contentW, 44, 8).fill(hex2rgb(statusBg));
      doc.rect(margin, y, 6, 44).fill(hex2rgb(statusColor));

      fill(doc, statusColor);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`Payment Status: ${statusLabel}`, margin + 18, y + 14, {
          width: contentW / 2,
        });

      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(`Payment ID: ${data.paymentId}`, margin + contentW / 2, y + 8, {
          width: contentW / 2,
          align: "right",
        });
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Payment Date: ${fmt(data.paymentDate)}`,
          margin + contentW / 2,
          y + 24,
          {
            width: contentW / 2,
            align: "right",
          },
        );

      y += 44 + 24;

      // ── 5. Line items table ──────────────────────────────────────────────────
      // Table header
      doc.roundedRect(margin, y, contentW, 30, 6).fill(hex2rgb(C.primary));
      fill(doc, C.white);
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("DESCRIPTION", margin + 12, y + 10);
      doc.text("APPOINTMENT DATE", margin + 200, y + 10);
      doc.text("PRESCRIPTION ID", margin + 360, y + 10);
      doc.text("AMOUNT", W - margin - 60, y + 10, {
        width: 60,
        align: "right",
      });

      y += 30;

      // Row 1
      doc.rect(margin, y, contentW, 36).fill(hex2rgb(C.white));
      fill(doc, C.dark);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Medical Consultation", margin + 12, y + 12);
      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(fmt(data.appointmentDate), margin + 200, y + 13);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(data.prescriptionId, margin + 360, y + 13, { width: 120 });
      fill(doc, C.dark);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(formatCurrency(data.amount), W - margin - 60, y + 12, {
          width: 60,
          align: "right",
        });

      // Bottom border of row
      doc
        .moveTo(margin, y + 36)
        .lineTo(W - margin, y + 36)
        .lineWidth(0.5)
        .strokeColor(hex2rgb(C.border) as unknown as string)
        .stroke();

      y += 36;

      // ── 6. Totals block ──────────────────────────────────────────────────────
      y += 12;
      const totalsX = W - margin - 200;
      const totalsW = 200;

      // Subtotal row
      doc.rect(totalsX, y, totalsW, 28).fill(hex2rgb(C.sectionBg));
      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text("Subtotal", totalsX + 12, y + 9);
      fill(doc, C.dark);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(formatCurrency(data.amount), totalsX, y + 9, {
          width: totalsW - 12,
          align: "right",
        });

      y += 28;

      // Tax row
      doc.rect(totalsX, y, totalsW, 28).fill(hex2rgb(C.white));
      fill(doc, C.muted);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text("Tax (0%)", totalsX + 12, y + 9);
      fill(doc, C.dark);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text("BDT 0.00", totalsX, y + 9, {
          width: totalsW - 12,
          align: "right",
        });

      y += 28;

      // Total row
      doc.rect(totalsX, y, totalsW, 36).fill(hex2rgb(C.primary));
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("TOTAL", totalsX + 12, y + 11);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(formatCurrency(data.amount), totalsX, y + 11, {
          width: totalsW - 12,
          align: "right",
        });

      y += 36 + 32;

      // ── 7. Notes section ─────────────────────────────────────────────────────
      doc.roundedRect(margin, y, contentW, 56, 6).fill(hex2rgb(C.sectionBg));
      doc.rect(margin, y, 4, 56).fill(hex2rgb(C.accent));
      fill(doc, C.muted);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("NOTES", margin + 14, y + 10);
      fill(doc, C.dark);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          "Thank you for choosing PH Healthcare Services. This invoice is electronically generated and is valid without a signature. " +
            "For billing inquiries, please contact our support team.",
          margin + 14,
          y + 24,
          { width: contentW - 28, lineGap: 3 },
        );

      // ── 8. Footer ────────────────────────────────────────────────────────────
      doc.rect(0, H - 50, W, 50).fill(hex2rgb(C.primary));
      fill(doc, C.white);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("PH Healthcare Services", margin, H - 36);
      fill(doc, "#a8c4dc");
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(config.FRONTEND_URL, margin, H - 22);
      fill(doc, C.white);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `© ${new Date().getFullYear()} PH Healthcare. All rights reserved.`,
          margin,
          H - 36,
          {
            width: contentW,
            align: "right",
          },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

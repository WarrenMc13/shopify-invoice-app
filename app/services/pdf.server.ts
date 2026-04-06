import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { InvoiceData } from './invoice.server';

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait
  const { height } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const grey = rgb(0.45, 0.45, 0.45);
  const black = rgb(0, 0, 0);
  const lightGrey = rgb(0.93, 0.93, 0.93);

  // ── Header ──────────────────────────────────────────────
  page.drawText('INVOICE', { x: 50, y: height - 60, size: 26, font: bold, color: black });
  page.drawText(invoice.orderNumber, { x: 50, y: height - 88, size: 12, font, color: grey });
  page.drawText(invoice.orderDate, { x: 50, y: height - 106, size: 11, font, color: grey });

  // ── Shop info (top right) ────────────────────────────────
  page.drawText(invoice.shop.name, { x: 370, y: height - 60, size: 12, font: bold, color: black });
  page.drawText(invoice.shop.email, { x: 370, y: height - 78, size: 10, font, color: grey });
  if (invoice.shop.address) {
    page.drawText(invoice.shop.address, { x: 370, y: height - 96, size: 10, font, color: grey });
  }
  if (invoice.shop.taxNumber) {
    page.drawText(`Tax No: ${invoice.shop.taxNumber}`, {
      x: 370,
      y: height - 114,
      size: 10,
      font,
      color: grey,
    });
  }

  // ── Bill To ──────────────────────────────────────────────
  page.drawText('Bill To', { x: 50, y: height - 155, size: 11, font: bold, color: black });
  page.drawText(invoice.customer.name, { x: 50, y: height - 173, size: 11, font, color: black });
  page.drawText(invoice.customer.email, { x: 50, y: height - 191, size: 10, font, color: grey });
  if (invoice.customer.address) {
    page.drawText(invoice.customer.address, { x: 50, y: height - 209, size: 10, font, color: grey });
  }

  // ── Line items table ─────────────────────────────────────
  let y = height - 265;

  // Table header background
  page.drawRectangle({ x: 50, y: y - 6, width: 495, height: 22, color: lightGrey });
  page.drawText('Description', { x: 56, y, size: 10, font: bold, color: black });
  page.drawText('Qty', { x: 340, y, size: 10, font: bold, color: black });
  page.drawText('Unit Price', { x: 375, y, size: 10, font: bold, color: black });
  page.drawText('Amount', { x: 490, y, size: 10, font: bold, color: black });
  y -= 26;

  for (const item of invoice.lineItems) {
    const title = item.title.length > 45 ? item.title.substring(0, 42) + '...' : item.title;
    page.drawText(title, { x: 56, y, size: 10, font, color: black });
    page.drawText(String(item.quantity), { x: 350, y, size: 10, font, color: black });
    page.drawText(`${invoice.currency} ${item.price}`, { x: 375, y, size: 10, font, color: black });
    page.drawText(`${invoice.currency} ${item.total}`, { x: 476, y, size: 10, font, color: black });
    y -= 22;
  }

  // ── Totals ───────────────────────────────────────────────
  y -= 8;
  page.drawLine({ start: { x: 370, y }, end: { x: 545, y }, thickness: 0.75, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;

  page.drawText('Subtotal', { x: 375, y, size: 10, font, color: grey });
  page.drawText(`${invoice.currency} ${invoice.subtotal}`, { x: 476, y, size: 10, font, color: black });
  y -= 18;

  page.drawText('Tax', { x: 375, y, size: 10, font, color: grey });
  page.drawText(`${invoice.currency} ${invoice.tax}`, { x: 476, y, size: 10, font, color: black });
  y -= 18;

  page.drawLine({ start: { x: 370, y }, end: { x: 545, y }, thickness: 0.75, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;

  page.drawText('Total', { x: 375, y, size: 12, font: bold, color: black });
  page.drawText(`${invoice.currency} ${invoice.total}`, { x: 476, y, size: 12, font: bold, color: black });

  return doc.save();
}

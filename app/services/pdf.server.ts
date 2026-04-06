import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import type { InvoiceData } from './invoice.server';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const MIN_Y = 80; // new page threshold

function drawPageHeader(
  page: PDFPage,
  invoice: InvoiceData,
  bold: PDFFont,
  font: PDFFont,
  grey: ReturnType<typeof rgb>,
  black: ReturnType<typeof rgb>,
) {
  const h = PAGE_HEIGHT;
  page.drawText('INVOICE', { x: MARGIN, y: h - 60, size: 26, font: bold, color: black });
  page.drawText(invoice.orderNumber, { x: MARGIN, y: h - 88, size: 12, font, color: grey });
  page.drawText(invoice.orderDate, { x: MARGIN, y: h - 106, size: 11, font, color: grey });

  page.drawText(invoice.shop.name, { x: 370, y: h - 60, size: 12, font: bold, color: black });
  page.drawText(invoice.shop.email, { x: 370, y: h - 78, size: 10, font, color: grey });
  if (invoice.shop.address) {
    page.drawText(invoice.shop.address, { x: 370, y: h - 96, size: 10, font, color: grey });
  }
  if (invoice.shop.taxNumber) {
    page.drawText(`Tax No: ${invoice.shop.taxNumber}`, { x: 370, y: h - 114, size: 10, font, color: grey });
  }

  page.drawText('Bill To', { x: MARGIN, y: h - 155, size: 11, font: bold, color: black });
  page.drawText(invoice.customer.name, { x: MARGIN, y: h - 173, size: 11, font, color: black });
  page.drawText(invoice.customer.email, { x: MARGIN, y: h - 191, size: 10, font, color: grey });
  if (invoice.customer.address) {
    page.drawText(invoice.customer.address, { x: MARGIN, y: h - 209, size: 10, font, color: grey });
  }
}

function drawTableHeader(
  page: PDFPage,
  y: number,
  bold: PDFFont,
  black: ReturnType<typeof rgb>,
  lightGrey: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x: MARGIN, y: y - 6, width: 495, height: 22, color: lightGrey });
  page.drawText('Description', { x: 56, y, size: 10, font: bold, color: black });
  page.drawText('Qty', { x: 340, y, size: 10, font: bold, color: black });
  page.drawText('Unit Price', { x: 375, y, size: 10, font: bold, color: black });
  page.drawText('Amount', { x: 480, y, size: 10, font: bold, color: black });
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const grey = rgb(0.45, 0.45, 0.45);
  const black = rgb(0, 0, 0);
  const lightGrey = rgb(0.93, 0.93, 0.93);

  // First page
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(page, invoice, bold, font, grey, black);

  // Table header on first page
  let y = PAGE_HEIGHT - 265;
  drawTableHeader(page, y, bold, black, lightGrey);
  y -= 26;

  // Line items — paginate when needed
  for (const item of invoice.lineItems) {
    if (y < MIN_Y) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 60;
      drawTableHeader(page, y, bold, black, lightGrey);
      y -= 26;
    }

    const title = item.title.length > 45 ? item.title.substring(0, 42) + '...' : item.title;
    page.drawText(title, { x: 56, y, size: 10, font, color: black });
    page.drawText(String(item.quantity), { x: 350, y, size: 10, font, color: black });
    page.drawText(`${invoice.currency} ${item.price}`, { x: 375, y, size: 10, font, color: black });
    page.drawText(`${invoice.currency} ${item.total}`, { x: 476, y, size: 10, font, color: black });
    y -= 22;
  }

  // Totals block — add new page if not enough room
  if (y < MIN_Y + 80) {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 60;
  }

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

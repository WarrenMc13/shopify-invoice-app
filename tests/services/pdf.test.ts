import { describe, it, expect } from 'vitest';
import { generateInvoicePdf } from '../../app/services/pdf.server';
import type { InvoiceData } from '../../app/services/invoice.server';

const mockInvoice: InvoiceData = {
  orderNumber: '#1001',
  orderDate: '05/04/2026',
  shop: { name: 'My Shop', email: 'shop@example.com', address: '123 Main St, SF, US' },
  customer: { name: 'John Doe', email: 'john@example.com', address: '456 Oak Ave, NY, US' },
  lineItems: [{ title: 'Blue T-Shirt', quantity: 2, price: '45.00', total: '90.00' }],
  subtotal: '90.00',
  tax: '10.00',
  total: '100.00',
  currency: 'USD',
};

describe('generateInvoicePdf', () => {
  it('returns a Uint8Array', async () => {
    const pdf = await generateInvoicePdf(mockInvoice);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(100);
  });

  it('starts with PDF magic bytes %PDF', async () => {
    const pdf = await generateInvoicePdf(mockInvoice);
    const header = String.fromCharCode(pdf[0], pdf[1], pdf[2], pdf[3]);
    expect(header).toBe('%PDF');
  });
});

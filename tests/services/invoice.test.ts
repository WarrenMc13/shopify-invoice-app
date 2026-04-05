import { describe, it, expect } from 'vitest';
import { buildInvoiceData } from '../../app/services/invoice.server';

const mockOrder = {
  name: '#1001',
  createdAt: '2026-04-05T10:00:00Z',
  email: 'customer@example.com',
  currencyCode: 'USD',
  subtotalPriceSet: { shopMoney: { amount: '90.00' } },
  totalTaxSet: { shopMoney: { amount: '10.00' } },
  totalPriceSet: { shopMoney: { amount: '100.00' } },
  lineItems: {
    edges: [
      {
        node: {
          title: 'Blue T-Shirt',
          quantity: 2,
          originalUnitPriceSet: { shopMoney: { amount: '45.00' } },
          originalTotalSet: { shopMoney: { amount: '90.00' } },
        },
      },
    ],
  },
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'New York',
    country: 'United States',
  },
};

const mockShop = {
  name: 'My Test Shop',
  email: 'shop@example.com',
  billingAddress: {
    address1: '456 Commerce St',
    city: 'San Francisco',
    country: 'United States',
  },
};

describe('buildInvoiceData', () => {
  it('maps order number', () => {
    const invoice = buildInvoiceData(mockOrder, mockShop);
    expect(invoice.orderNumber).toBe('#1001');
  });

  it('maps customer name from shipping address', () => {
    const invoice = buildInvoiceData(mockOrder, mockShop);
    expect(invoice.customer.name).toBe('John Doe');
  });

  it('falls back to email when no shipping address', () => {
    const order = { ...mockOrder, shippingAddress: null };
    const invoice = buildInvoiceData(order, mockShop);
    expect(invoice.customer.name).toBe('customer@example.com');
  });

  it('maps line items', () => {
    const invoice = buildInvoiceData(mockOrder, mockShop);
    expect(invoice.lineItems).toHaveLength(1);
    expect(invoice.lineItems[0]).toEqual({
      title: 'Blue T-Shirt',
      quantity: 2,
      price: '45.00',
      total: '90.00',
    });
  });

  it('maps totals and currency', () => {
    const invoice = buildInvoiceData(mockOrder, mockShop);
    expect(invoice.subtotal).toBe('90.00');
    expect(invoice.tax).toBe('10.00');
    expect(invoice.total).toBe('100.00');
    expect(invoice.currency).toBe('USD');
  });
});

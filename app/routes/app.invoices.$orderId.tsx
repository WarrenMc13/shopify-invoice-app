import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  Page, Layout, Card, Text, Divider, Button,
  InlineStack, BlockStack, Badge, Box,
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { buildInvoiceData } from '~/services/invoice.server';
import { getSettings } from '~/models/settings.server';
import type { LoaderFunctionArgs } from '@remix-run/node';

const ORDER_QUERY = `#graphql
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      email
      currencyCode
      subtotalPriceSet { shopMoney { amount } }
      totalTaxSet { shopMoney { amount } }
      totalPriceSet { shopMoney { amount } }
      lineItems(first: 50) {
        edges {
          node {
            title
            quantity
            originalUnitPriceSet { shopMoney { amount } }
            originalTotalSet { shopMoney { amount } }
          }
        }
      }
      shippingAddress {
        firstName lastName address1 city country
      }
    }
    shop {
      name
      email
      billingAddress { address1 city country }
    }
  }
`;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const orderId = decodeURIComponent(params.orderId!);

  const response = await admin.graphql(ORDER_QUERY, { variables: { id: orderId } });
  const { data } = await response.json();

  if (!data.order) {
    throw new Response('Order not found', { status: 404 });
  }

  const settings = await getSettings(session.shop);
  const shopWithSettings = {
    ...data.shop,
    name: settings.businessName || data.shop.name,
    taxNumber: settings.taxNumber,
  };
  const invoice = buildInvoiceData(data.order, shopWithSettings);

  return json({ invoice, orderId, settings });
};

export default function InvoicePage() {
  const { invoice, orderId, settings } = useLoaderData<typeof loader>();

  return (
    <Page
      title={`Invoice ${invoice.orderNumber}`}
      backAction={{ content: 'Orders', url: '/app' }}
      primaryAction={
        <a
          href={`/app/invoices/${encodeURIComponent(orderId)}/download`}
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="primary" size="large">Download PDF</Button>
        </a>
      }
    >
      <Layout>
        <Layout.Section>
          {/* Invoice Document */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(20,28,37,0.06), 0 10px 40px rgba(20,28,37,0.04)',
            overflow: 'hidden',
          }}>
            {/* Invoice Header */}
            <div style={{
              background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
              padding: '32px 40px',
              color: 'white',
            }}>
              <InlineStack align="space-between" blockAlign="start">
                <div>
                  <p style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px', color: 'white' }}>
                    INVOICE
                  </p>
                  <p style={{ fontSize: '16px', margin: '0 0 2px', color: 'rgba(255,255,255,0.85)' }}>
                    {invoice.orderNumber}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                    {invoice.orderDate}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px', color: 'white' }}>
                    {invoice.shop.name}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: '0 0 2px' }}>
                    {invoice.shop.email}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: '0 0 2px' }}>
                    {invoice.shop.address}
                  </p>
                  {invoice.shop.taxNumber && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                      Tax No: {invoice.shop.taxNumber}
                    </p>
                  )}
                </div>
              </InlineStack>
            </div>

            {/* Bill To */}
            <div style={{ padding: '28px 40px', background: '#f7f9ff' }}>
              <InlineStack align="space-between">
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e7a73', margin: '0 0 8px' }}>
                    Bill To
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#141c25', margin: '0 0 3px' }}>
                    {invoice.customer.name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#3e4944', margin: '0 0 3px' }}>
                    {invoice.customer.email}
                  </p>
                  {invoice.customer.address && (
                    <p style={{ fontSize: '13px', color: '#3e4944', margin: 0 }}>
                      {invoice.customer.address}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e7a73', margin: '0 0 8px' }}>
                    Amount Due
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: '#00654b', margin: 0 }}>
                    {invoice.currency} {invoice.total}
                  </p>
                </div>
              </InlineStack>
            </div>

            {/* Line Items Table */}
            <div style={{ padding: '0 40px 32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(189,201,194,0.25)' }}>
                    {['Item', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                      <th key={h} style={{
                        padding: '10px 0',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#6e7a73',
                        textAlign: i === 0 ? 'left' : 'right',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(189,201,194,0.15)' }}>
                      <td style={{ padding: '14px 0', fontSize: '14px', color: '#141c25' }}>
                        {item.title}
                      </td>
                      <td style={{ padding: '14px 0', fontSize: '14px', color: '#3e4944', textAlign: 'right' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '14px 0', fontSize: '14px', color: '#3e4944', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {invoice.currency} {item.price}
                      </td>
                      <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: '#141c25', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {invoice.currency} {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: '13px', color: '#6e7a73' }}>Subtotal</span>
                    <span style={{ fontSize: '13px', color: '#141c25', fontVariantNumeric: 'tabular-nums' }}>
                      {invoice.currency} {invoice.subtotal}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: '13px', color: '#6e7a73' }}>Tax</span>
                    <span style={{ fontSize: '13px', color: '#141c25', fontVariantNumeric: 'tabular-nums' }}>
                      {invoice.currency} {invoice.tax}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                    borderTop: '2px solid #00654b', marginTop: '4px',
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#141c25' }}>Total</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#00654b', fontVariantNumeric: 'tabular-nums' }}>
                      {invoice.currency} {invoice.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            {settings.footerNote && (
              <div style={{
                padding: '16px 40px',
                background: '#f7f9ff',
                borderTop: '1px solid rgba(189,201,194,0.2)',
              }}>
                <p style={{ fontSize: '13px', color: '#6e7a73', margin: 0, fontStyle: 'italic' }}>
                  {settings.footerNote}
                </p>
              </div>
            )}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

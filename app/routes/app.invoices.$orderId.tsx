import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import {
  Page, Layout, Card, Text, DataTable, Divider, Button, InlineStack, BlockStack,
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
  };
  const invoice = buildInvoiceData(data.order, shopWithSettings);

  return json({ invoice, orderId, settings });
};

export default function InvoicePage() {
  const { invoice, orderId, settings } = useLoaderData<typeof loader>();

  const lineItemRows = invoice.lineItems.map((item) => [
    item.title,
    String(item.quantity),
    `${invoice.currency} ${item.price}`,
    `${invoice.currency} ${item.total}`,
  ]);

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
          <Button variant="primary">Download PDF</Button>
        </a>
      }
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">Invoice {invoice.orderNumber}</Text>
                  <Text as="p" tone="subdued">{invoice.orderDate}</Text>
                </BlockStack>
                <BlockStack gap="100" inlineAlign="end">
                  <Text as="p" fontWeight="semibold">{invoice.shop.name}</Text>
                  <Text as="p" tone="subdued">{invoice.shop.email}</Text>
                  <Text as="p" tone="subdued">{invoice.shop.address}</Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              <BlockStack gap="100">
                <Text as="p" fontWeight="semibold">Bill To</Text>
                <Text as="p">{invoice.customer.name}</Text>
                <Text as="p" tone="subdued">{invoice.customer.email}</Text>
                {invoice.customer.address && (
                  <Text as="p" tone="subdued">{invoice.customer.address}</Text>
                )}
              </BlockStack>

              <Divider />

              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                headings={['Item', 'Qty', 'Unit Price', 'Total']}
                rows={lineItemRows}
                totals={['', '', 'Subtotal', `${invoice.currency} ${invoice.subtotal}`]}
                showTotalsInFooter
              />

              <InlineStack align="end">
                <BlockStack gap="100" inlineAlign="end">
                  <Text as="p" tone="subdued">Tax: {invoice.currency} {invoice.tax}</Text>
                  <Text as="p" variant="headingMd">
                    Total: {invoice.currency} {invoice.total}
                  </Text>
                </BlockStack>
              </InlineStack>

              {settings.footerNote && (
                <>
                  <Divider />
                  <Text as="p" tone="subdued">{settings.footerNote}</Text>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

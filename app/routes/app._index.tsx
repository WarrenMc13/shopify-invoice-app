import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { Page, Layout, Card, DataTable, Text, Badge, Button, EmptyState } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import type { LoaderFunctionArgs } from '@remix-run/node';

const ORDERS_QUERY = `#graphql
  query GetRecentOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          email
          totalPriceSet {
            shopMoney { amount currencyCode }
          }
          displayFulfillmentStatus
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(ORDERS_QUERY, { variables: { first: 25 } });
  const { data } = await response.json();
  return json({ orders: data.orders.edges.map((e: any) => e.node) });
};

export default function Dashboard() {
  const { orders } = useLoaderData<typeof loader>();

  if (orders.length === 0) {
    return (
      <Page title="Invoice Generator">
        <EmptyState
          heading="No orders yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Orders will appear here once customers start purchasing.</p>
        </EmptyState>
      </Page>
    );
  }

  const rows = orders.map((order: any) => [
    <Text as="span" fontWeight="semibold">{order.name}</Text>,
    new Date(order.createdAt).toLocaleDateString('en-ZA'),
    order.email,
    `${order.totalPriceSet.shopMoney.currencyCode} ${order.totalPriceSet.shopMoney.amount}`,
    <Badge>{order.displayFulfillmentStatus}</Badge>,
    <Link to={`/app/invoices/${encodeURIComponent(order.id)}`}>
      <Button size="slim">Generate Invoice</Button>
    </Link>,
  ]);

  return (
    <Page
      title="Invoice Generator"
      secondaryActions={[
        { content: 'Settings', url: '/app/settings' },
        { content: 'Billing', url: '/app/billing' },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text']}
              headings={['Order', 'Date', 'Customer', 'Total', 'Status', 'Action']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

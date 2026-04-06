import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import {
  Page, Layout, Card, Text, Badge, Button, EmptyState,
  IndexTable, BlockStack,
} from '@shopify/polaris';
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

function getBadgeTone(status: string): 'success' | 'warning' | 'info' | 'attention' {
  switch (status) {
    case 'FULFILLED': return 'success';
    case 'UNFULFILLED': return 'warning';
    case 'PARTIAL':
    case 'PARTIALLY_FULFILLED': return 'info';
    default: return 'attention';
  }
}

function formatStatus(status: string): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

export default function Dashboard() {
  const { orders } = useLoaderData<typeof loader>();

  const fulfilledCount = orders.filter((o: any) => o.displayFulfillmentStatus === 'FULFILLED').length;
  const pendingCount = orders.length - fulfilledCount;

  return (
    <Page
      title="Invoice Generator"
      secondaryActions={[
        { content: 'Settings', url: '/app/settings' },
        { content: 'Billing', url: '/app/billing' },
      ]}
    >
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '20px',
      }}>
        <BlockStack gap="400">
          <div>
            <p style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
              Invoice Generator
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: 0 }}>
              Generate professional PDF invoices for your orders
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Orders', value: orders.length },
              { label: 'Fulfilled', value: fulfilledCount },
              { label: 'Pending', value: pendingCount },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                padding: '14px 22px',
                textAlign: 'center',
                minWidth: '120px',
              }}>
                <p style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 2px' }}>
                  {stat.value}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </BlockStack>
      </div>

      <Layout>
        <Layout.Section>
          {orders.length === 0 ? (
            <Card>
              <EmptyState
                heading="No orders yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Orders will appear here once customers start purchasing.</p>
              </EmptyState>
            </Card>
          ) : (
            <Card padding="0">
              <IndexTable
                resourceName={{ singular: 'order', plural: 'orders' }}
                itemCount={orders.length}
                headings={[
                  { title: 'Order' },
                  { title: 'Date' },
                  { title: 'Customer' },
                  { title: 'Total', alignment: 'end' },
                  { title: 'Status' },
                  { title: 'Action' },
                ]}
                selectable={false}
              >
                {orders.map((order: any, index: number) => (
                  <IndexTable.Row id={order.id} key={order.id} position={index}>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {order.name}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        {new Date(order.createdAt).toLocaleDateString('en-ZA')}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd">
                        {order.email || '—'}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell flush>
                      <div style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {order.totalPriceSet.shopMoney.currencyCode}{' '}
                          {parseFloat(order.totalPriceSet.shopMoney.amount).toFixed(2)}
                        </Text>
                      </div>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Badge tone={getBadgeTone(order.displayFulfillmentStatus)}>
                        {formatStatus(order.displayFulfillmentStatus)}
                      </Badge>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Link to={`/app/invoices/${encodeURIComponent(order.id)}`}>
                        <Button size="slim" variant="primary">Generate Invoice</Button>
                      </Link>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

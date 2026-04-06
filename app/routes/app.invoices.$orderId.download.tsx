import { redirect } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { buildInvoiceData } from '~/services/invoice.server';
import { generateInvoicePdf } from '~/services/pdf.server';
import { getSettings } from '~/models/settings.server';
import { getActivePlan, getPlanLimits } from '~/services/billing.server';
import db from '~/db.server';
import type { LoaderFunctionArgs } from '@remix-run/node';

const ORDER_QUERY = `#graphql
  query GetOrderForPdf($id: ID!) {
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

  const activePlan = await getActivePlan(request);
  const { invoicesPerMonth } = getPlanLimits(activePlan);

  if (invoicesPerMonth !== Infinity) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const count = await db.invoiceLog.count({
      where: { shop: session.shop, generatedAt: { gte: startOfMonth } },
    });
    if (count >= invoicesPerMonth) {
      return redirect('/app/billing');
    }
  }

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

  const invoiceData = buildInvoiceData(data.order, shopWithSettings);
  const pdfBytes = await generateInvoicePdf(invoiceData);

  // Log the generation
  await db.invoiceLog.upsert({
    where: { shop_orderId: { shop: session.shop, orderId } },
    update: { generatedAt: new Date() },
    create: { shop: session.shop, orderId, orderNumber: data.order.name },
  });

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.order.name}.pdf"`,
    },
  });
};

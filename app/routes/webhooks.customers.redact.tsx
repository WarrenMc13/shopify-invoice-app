import { authenticate } from '~/shopify.server';
import db from '~/db.server';
import type { ActionFunctionArgs } from '@remix-run/node';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`Webhook received: ${topic} for ${shop}`);
  // customers/redact: remove any stored customer PII
  // InvoiceLog stores orderId/orderNumber but not customer PII directly — no action needed
  return new Response(null, { status: 200 });
};

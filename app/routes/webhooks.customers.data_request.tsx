import { authenticate } from '~/shopify.server';
import type { ActionFunctionArgs } from '@remix-run/node';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Webhook received: ${topic} for ${shop}`);
  // customers/data_request: acknowledge receipt
  // Full customer data export is not required unless you store PII beyond session data
  return new Response(null, { status: 200 });
};

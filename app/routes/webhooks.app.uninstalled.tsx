import { authenticate } from '~/shopify.server';
import db from '~/db.server';
import type { ActionFunctionArgs } from '@remix-run/node';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Webhook received: ${topic} for ${shop}`);

  await Promise.all([
    db.session.deleteMany({ where: { shop } }),
    db.shopSettings.deleteMany({ where: { shop } }),
    db.invoiceLog.deleteMany({ where: { shop } }),
  ]);

  return new Response(null, { status: 200 });
};

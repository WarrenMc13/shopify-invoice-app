import { redirect, json } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import {
  Page, Layout, Card, Text, Button, BlockStack, Badge, InlineStack, Divider,
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getActivePlan, requestSubscriptionUrl, PLANS } from '~/services/billing.server';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const activePlan = await getActivePlan(request);
  return json({ activePlan });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const plan = formData.get('plan');
  if (plan !== 'STARTER' && plan !== 'PRO') {
    return json({ error: 'Invalid plan selected' }, { status: 400 });
  }
  const confirmationUrl = await requestSubscriptionUrl(request, plan);
  return redirect(confirmationUrl);
};

export default function BillingPage() {
  const { activePlan } = useLoaderData<typeof loader>();

  const plans = [
    { key: 'FREE', label: 'Free', price: '$0/month', invoices: '10 invoices/month', highlight: false },
    { key: 'STARTER', label: 'Starter', price: '$9/month', invoices: '100 invoices/month', highlight: true },
    { key: 'PRO', label: 'Pro', price: '$29/month', invoices: 'Unlimited invoices', highlight: false },
  ] as const;

  return (
    <Page title="Billing" backAction={{ content: 'Orders', url: '/app' }}>
      <Layout>
        {plans.map((plan) => (
          <Layout.Section key={plan.key}>
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">{plan.label}</Text>
                  {activePlan === plan.key && <Badge tone="success">Current Plan</Badge>}
                </InlineStack>
                <Text as="p" variant="headingLg">{plan.price}</Text>
                <Text as="p" tone="subdued">{plan.invoices}</Text>
                <Divider />
                {plan.key !== 'FREE' && activePlan !== plan.key && (
                  <Form method="post">
                    <input type="hidden" name="plan" value={plan.key} />
                    <Button variant={plan.highlight ? 'primary' : 'secondary'} submit>
                      Upgrade to {plan.label}
                    </Button>
                  </Form>
                )}
                {activePlan === plan.key && (
                  <Text as="p" tone="success">You are on this plan.</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  );
}

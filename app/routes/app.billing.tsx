import { redirect, json } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { Page, Layout, Text, Button, BlockStack, Badge, InlineStack } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getActivePlan, requestSubscriptionUrl } from '~/services/billing.server';
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

const plans = [
  {
    key: 'FREE',
    label: 'Free',
    price: '$0',
    period: '/month',
    invoices: '10 invoices/month',
    features: ['PDF invoice generation', 'Basic templates', 'Email support'],
    accent: '#6e7a73',
    highlight: false,
  },
  {
    key: 'STARTER',
    label: 'Starter',
    price: '$9',
    period: '/month',
    invoices: '100 invoices/month',
    features: ['PDF invoice generation', 'Custom branding', 'Tax/VAT support', 'Priority support'],
    accent: '#7b1fa2',
    highlight: true,
  },
  {
    key: 'PRO',
    label: 'Pro',
    price: '$29',
    period: '/month',
    invoices: 'Unlimited invoices',
    features: ['Everything in Starter', 'Bulk downloads', 'Custom footer notes', 'Dedicated support'],
    accent: '#00654b',
    highlight: false,
  },
] as const;

export default function BillingPage() {
  const { activePlan } = useLoaderData<typeof loader>();

  return (
    <Page title="Billing & Plans" backAction={{ content: 'Orders', url: '/app' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
        borderRadius: '12px',
        padding: '28px 32px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <p style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: '0 0 6px' }}>
          Choose Your Plan
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: 0 }}>
          Upgrade to generate more invoices and unlock premium features
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {plans.map((plan) => {
          const isActive = activePlan === plan.key;
          return (
            <div key={plan.key} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: plan.highlight
                ? '0 8px 30px rgba(123,31,162,0.2), 0 2px 8px rgba(123,31,162,0.1)'
                : '0 4px 20px rgba(20,28,37,0.06)',
              position: 'relative',
              transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
            }}>
              {plan.highlight && (
                <div style={{
                  background: 'linear-gradient(135deg, #7b1fa2, #4a148c)',
                  color: 'white',
                  textAlign: 'center',
                  padding: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Most Popular
                </div>
              )}
              <div style={{ padding: '28px 24px' }}>
                <BlockStack gap="400">
                  <div>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingMd">{plan.label}</Text>
                      {isActive && <Badge tone="success">Current Plan</Badge>}
                    </InlineStack>
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ fontSize: '36px', fontWeight: '700', color: plan.accent }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: '14px', color: '#6e7a73' }}>{plan.period}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#3e4944', marginTop: '4px' }}>
                      {plan.invoices}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(189,201,194,0.3)', paddingTop: '16px' }}>
                    <BlockStack gap="200">
                      {plan.features.map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: plan.accent, fontWeight: '700', fontSize: '16px' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#3e4944' }}>{f}</span>
                        </div>
                      ))}
                    </BlockStack>
                  </div>

                  {plan.key !== 'FREE' && !isActive && (
                    <Form method="post">
                      <input type="hidden" name="plan" value={plan.key} />
                      <Button
                        variant={plan.highlight ? 'primary' : 'secondary'}
                        submit
                        fullWidth
                      >
                        Upgrade to {plan.label}
                      </Button>
                    </Form>
                  )}
                  {isActive && (
                    <div style={{
                      background: '#f7f9ff',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                    }}>
                      <Text as="p" variant="bodySm" tone="success">You are on this plan</Text>
                    </div>
                  )}
                  {plan.key === 'FREE' && !isActive && (
                    <div style={{ height: '36px' }} />
                  )}
                </BlockStack>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

import { json } from '@remix-run/node';
import { useLoaderData, Form, useNavigation, useActionData } from '@remix-run/react';
import { Page, Layout, Card, FormLayout, TextField, Button, BlockStack, Text, InlineStack } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getSettings, saveSettings } from '~/models/settings.server';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  await saveSettings(session.shop, {
    businessName: String(formData.get('businessName') ?? ''),
    taxNumber: String(formData.get('taxNumber') ?? ''),
    footerNote: String(formData.get('footerNote') ?? ''),
  });
  return json({ saved: true });
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';

  return (
    <Page title="Settings" backAction={{ content: 'Orders', url: '/app' }}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '20px',
      }}>
        <p style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>
          Invoice Settings
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: 0 }}>
          Customize how your business information appears on invoices
        </p>
      </div>

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              {actionData?.saved && (
                <div style={{
                  background: 'linear-gradient(135deg, #d6ffeb, #92f6cf)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ color: '#00654b', fontWeight: '700' }}>✓</span>
                  <Text as="p" variant="bodyMd" tone="success">Settings saved successfully.</Text>
                </div>
              )}

              <Form method="post">
                <BlockStack gap="400">
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e7a73', margin: '0 0 12px' }}>
                      Business Details
                    </p>
                    <FormLayout>
                      <TextField
                        label="Business Name"
                        name="businessName"
                        defaultValue={settings.businessName}
                        helpText="Overrides your Shopify store name on invoices."
                        autoComplete="organization"
                      />
                      <TextField
                        label="Tax / VAT Number"
                        name="taxNumber"
                        defaultValue={settings.taxNumber}
                        helpText="Printed on invoices if provided."
                        autoComplete="off"
                      />
                    </FormLayout>
                  </div>

                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e7a73', margin: '0 0 12px' }}>
                      Invoice Footer
                    </p>
                    <FormLayout>
                      <TextField
                        label="Footer Note"
                        name="footerNote"
                        defaultValue={settings.footerNote}
                        multiline={3}
                        helpText='E.g. "Thank you for your business! Payment due within 30 days."'
                        autoComplete="off"
                      />
                    </FormLayout>
                  </div>

                  <div style={{ paddingTop: '8px' }}>
                    <Button variant="primary" submit loading={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </BlockStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Preview</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Your business name and tax number will appear in the top-right corner of every invoice. The footer note appears at the bottom.
              </Text>
              <div style={{
                background: '#f7f9ff',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                color: '#3e4944',
                lineHeight: '1.6',
              }}>
                <p style={{ fontWeight: '600', color: '#141c25', margin: '0 0 4px' }}>
                  {settings.businessName || 'Your Business Name'}
                </p>
                {settings.taxNumber && (
                  <p style={{ margin: '0 0 4px' }}>Tax No: {settings.taxNumber}</p>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(189,201,194,0.3)', margin: '8px 0' }} />
                <p style={{ fontStyle: 'italic', color: '#6e7a73', margin: 0 }}>
                  {settings.footerNote || 'Your footer note will appear here.'}
                </p>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

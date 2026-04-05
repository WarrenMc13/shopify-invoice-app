import { json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import { Page, Layout, Card, FormLayout, TextField, Button, Banner } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getSettings, saveSettings } from '~/models/settings.server';
import { useState } from 'react';
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
  return redirect('/app/settings?saved=1');
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const saved = new URL(
    typeof window !== 'undefined' ? window.location.href : 'http://x/?saved=0'
  ).searchParams.get('saved') === '1';

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber);
  const [footerNote, setFooterNote] = useState(settings.footerNote);

  return (
    <Page title="Settings" backAction={{ content: 'Orders', url: '/app' }}>
      <Layout>
        <Layout.Section>
          {saved && (
            <Banner tone="success" title="Settings saved successfully." />
          )}
          <Card>
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Business Name"
                  name="businessName"
                  value={businessName}
                  onChange={setBusinessName}
                  helpText="Overrides your Shopify store name on invoices."
                  autoComplete="organization"
                />
                <TextField
                  label="Tax / VAT Number"
                  name="taxNumber"
                  value={taxNumber}
                  onChange={setTaxNumber}
                  helpText="Printed on invoices if provided."
                  autoComplete="off"
                />
                <TextField
                  label="Invoice Footer Note"
                  name="footerNote"
                  value={footerNote}
                  onChange={setFooterNote}
                  multiline={3}
                  helpText='E.g. "Thank you for your business!"'
                  autoComplete="off"
                />
                <Button
                  variant="primary"
                  submit
                  loading={navigation.state === 'submitting'}
                >
                  Save Settings
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

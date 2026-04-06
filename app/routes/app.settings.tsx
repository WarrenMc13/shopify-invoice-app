import { json } from '@remix-run/node';
import { useLoaderData, Form, useNavigation, useActionData } from '@remix-run/react';
import { Page, Layout, Card, FormLayout, TextField, Button, Banner } from '@shopify/polaris';
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

  return (
    <Page title="Settings" backAction={{ content: 'Orders', url: '/app' }}>
      <Layout>
        <Layout.Section>
          {actionData?.saved && (
            <Banner tone="success" title="Settings saved successfully." />
          )}
          <Card>
            <Form method="post">
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
                <TextField
                  label="Invoice Footer Note"
                  name="footerNote"
                  defaultValue={settings.footerNote}
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

import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 60%, #8e24aa 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px',
    }}>
      {/* Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px 40px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        {/* Logo / Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}>
          🧾
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: '700',
          color: '#141c25',
          margin: '0 0 10px',
        }}>
          Invoice Generator
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#6e7a73',
          margin: '0 0 32px',
          lineHeight: '1.5',
        }}>
          Generate professional PDF invoices for your Shopify orders — instantly.
        </p>

        {showForm && (
          <Form method="post" action="/auth/login" style={{ marginBottom: '32px' }}>
            <div style={{ textAlign: 'left', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#3e4944', display: 'block', marginBottom: '6px' }}>
                Shop Domain
              </label>
              <input
                type="text"
                name="shop"
                placeholder="my-shop.myshopify.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1.5px solid #e0e9f6',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#141c25',
                  background: '#f7f9ff',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '12px',
                background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Log in with Shopify
            </button>
          </Form>
        )}

        {/* Features */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'left',
        }}>
          {[
            { icon: '📄', title: 'PDF Invoices', desc: 'Generate branded PDF invoices for any order in one click.' },
            { icon: '🎨', title: 'Custom Branding', desc: 'Add your business name, VAT number, and footer notes.' },
            { icon: '⚡', title: 'Instant Download', desc: 'Merchants and customers can download invoices immediately.' },
          ].map((f) => (
            <div key={f.title} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              background: '#f7f9ff',
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#141c25', margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ fontSize: '12px', color: '#6e7a73', margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '24px' }}>
        Powered by Shopify
      </p>
    </div>
  );
}

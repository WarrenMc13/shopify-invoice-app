import { vi } from 'vitest';

vi.mock('~/shopify.server', () => ({
  authenticate: {
    admin: vi.fn(),
  },
  default: {},
  apiVersion: 'January25',
  addDocumentResponseHeaders: vi.fn(),
  unauthenticated: {},
  login: vi.fn(),
  registerWebhooks: vi.fn(),
  sessionStorage: {},
}));

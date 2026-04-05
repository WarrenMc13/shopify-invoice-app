import { describe, it, expect } from 'vitest';
import { PLANS, getPlanLimits } from '../../app/services/billing.server';

describe('getPlanLimits', () => {
  it('returns 10 for FREE', () => {
    expect(getPlanLimits('FREE').invoicesPerMonth).toBe(10);
  });

  it('returns 100 for STARTER', () => {
    expect(getPlanLimits('STARTER').invoicesPerMonth).toBe(100);
  });

  it('returns Infinity for PRO', () => {
    expect(getPlanLimits('PRO').invoicesPerMonth).toBe(Infinity);
  });
});

describe('PLANS', () => {
  it('has correct Shopify plan names', () => {
    expect(PLANS.STARTER.shopifyPlanName).toBe('Starter Plan');
    expect(PLANS.PRO.shopifyPlanName).toBe('Pro Plan');
  });
});

import { authenticate } from '~/shopify.server';

export const PLANS = {
  FREE: {
    shopifyPlanName: null,
    monthlyPrice: 0,
    invoicesPerMonth: 10,
  },
  STARTER: {
    shopifyPlanName: 'Starter Plan',
    monthlyPrice: 9,
    invoicesPerMonth: 100,
  },
  PRO: {
    shopifyPlanName: 'Pro Plan',
    monthlyPrice: 29,
    invoicesPerMonth: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: PlanKey) {
  return { invoicesPerMonth: PLANS[plan].invoicesPerMonth };
}

export async function getActivePlan(request: Request): Promise<PlanKey> {
  const { billing } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: [PLANS.STARTER.shopifyPlanName!, PLANS.PRO.shopifyPlanName!],
    isTest: process.env.NODE_ENV !== 'production',
  });
  if (!hasActivePayment) return 'FREE';
  const activeName = appSubscriptions[0]?.name;
  if (activeName === PLANS.PRO.shopifyPlanName) return 'PRO';
  return 'STARTER';
}

export async function requestSubscriptionUrl(
  request: Request,
  plan: Exclude<PlanKey, 'FREE'>
): Promise<string> {
  const { billing } = await authenticate.admin(request);
  const { confirmationUrl } = await billing.request({
    plan: PLANS[plan].shopifyPlanName!,
    isTest: process.env.NODE_ENV !== 'production',
  });
  return confirmationUrl;
}

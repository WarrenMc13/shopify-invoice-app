import db from '~/db.server';

export interface ShopSettings {
  businessName: string;
  taxNumber: string;
  footerNote: string;
}

export async function getSettings(shop: string): Promise<ShopSettings> {
  const record = await db.shopSettings.findUnique({ where: { shop } });
  return {
    businessName: record?.businessName ?? '',
    taxNumber: record?.taxNumber ?? '',
    footerNote: record?.footerNote ?? '',
  };
}

export async function saveSettings(
  shop: string,
  settings: ShopSettings
): Promise<void> {
  await db.shopSettings.upsert({
    where: { shop },
    update: settings,
    create: { shop, ...settings },
  });
}

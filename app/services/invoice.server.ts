export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  shop: {
    name: string;
    email: string;
    address: string;
    taxNumber: string;
  };
  customer: {
    name: string;
    email: string;
    address: string;
  };
  lineItems: Array<{
    title: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
}

export function buildInvoiceData(order: any, shopData: any): InvoiceData {
  const addr = order.shippingAddress;
  const customerName = addr
    ? `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim()
    : order.email;

  return {
    orderNumber: order.name,
    orderDate: new Date(order.createdAt).toLocaleDateString('en-ZA'),
    shop: {
      name: shopData.name,
      email: shopData.email,
      address: [
        shopData.billingAddress?.address1,
        shopData.billingAddress?.city,
        shopData.billingAddress?.country,
      ]
        .filter(Boolean)
        .join(', '),
      taxNumber: shopData.taxNumber ?? '',
    },
    customer: {
      name: customerName || order.email,
      email: order.email,
      address: addr
        ? [addr.address1, addr.city, addr.country].filter(Boolean).join(', ')
        : '',
    },
    lineItems: order.lineItems.edges.map((e: any) => ({
      title: e.node.title,
      quantity: e.node.quantity,
      price: e.node.originalUnitPriceSet.shopMoney.amount,
      total: e.node.originalTotalSet.shopMoney.amount,
    })),
    subtotal: order.subtotalPriceSet.shopMoney.amount,
    tax: order.totalTaxSet.shopMoney.amount,
    total: order.totalPriceSet.shopMoney.amount,
    currency: order.currencyCode,
  };
}

const axios = require('axios');
const config = require('../../config');

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function getInvoice(orderId) {
  const apiKey = process.env.SELLAUTH_API_KEY;
  const shopId = process.env.SELLAUTH_SHOP_ID;

  if (!apiKey || !shopId) {
    throw new Error('Sellauth API key or Shop ID is not configured in .env');
  }

  const { data } = await axios.get(`${config.sellauth.baseUrl}/shops/${shopId}/invoices/${orderId}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    timeout: 10000,
  });

  const items = Array.isArray(data.items) ? data.items : [];
  const item = items[0];
  const payment = Array.isArray(data.payments) ? data.payments[0] : null;
  const customer = data.customer ?? {};

  const product = items.length
    ? items.map((i) => i.product?.name ?? i.name ?? '?').join(', ')
    : data.product?.name ?? 'Unknown Product';

  const quantity = data.quantity ?? (items.length ? items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 1);
  const unitPrice = toNumber(data.price) ?? toNumber(item?.price);

  const amount =
    toNumber(item?.total_price) ??
    (unitPrice != null ? unitPrice * quantity : null) ??
    toNumber(data.paid) ??
    toNumber(data.total);

  return {
    id: data.id ?? orderId,
    status: data.status ?? 'unknown',
    product,
    variant: item?.variant?.name ?? data.variant?.name ?? null,
    quantity,
    amount,
    price: toNumber(data.price),
    paid: toNumber(data.paid),
    priceUsd: toNumber(data.price_usd),
    paidUsd: toNumber(data.paid_usd),
    currency: data.currency ?? 'EUR',
    customerCurrency: data.customer_currency ?? payment?.currency ?? null,
    paymentAmount: toNumber(payment?.amount) ?? toNumber(payment?.amount_usd),
    paymentCurrency: payment?.currency ?? data.customer_currency ?? null,
    paymentAmountUsd: toNumber(payment?.amount_usd),
    paymentStatus: payment?.status ?? null,
    paymentExternalId: payment?.external_id_value ?? null,
    gateway: data.gateway ?? null,
    customerName: customer.name ?? null,
    email: customer.email ?? data.email ?? null,
    discordId: customer.discord_id ?? data.discord_id ?? null,
    discordUsername: customer.discord_username ?? data.discord_username ?? null,
    createdAt: data.created_at ?? null,
    raw: data,
  };
}

module.exports = { getInvoice };

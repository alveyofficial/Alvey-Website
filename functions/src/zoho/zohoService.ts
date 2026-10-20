/**
 * functions/src/zoho/zohoService.ts
 *
 * Zoho Books API v3 service module.
 * Handles OAuth token refresh, contact upsert, invoice creation, and payment recording.
 * Uses the Clearing Account method (account_id on line items, no item_id).
 */

import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

export const ZOHO_CLIENT_ID = defineSecret("ZOHO_CLIENT_ID");
export const ZOHO_CLIENT_SECRET = defineSecret("ZOHO_CLIENT_SECRET");
export const ZOHO_REFRESH_TOKEN = defineSecret("ZOHO_REFRESH_TOKEN");
export const ZOHO_ORG_ID = defineSecret("ZOHO_ORG_ID");

// ---------------------------------------------------------------------------
// Hardcoded Zoho Books Account IDs
// ---------------------------------------------------------------------------

export const ZOHO_ACCOUNTS = {
  COURSE_FEE_CLEARING: "1542618000000147002", // Other Current Liability
  OTHER_CHARGES: "1542618000000010001",        // Other Charges (Income / Registration Fee Income)
  STC_PAY_BANK: "1542618000000114002",         // STC Pay bank account
} as const;

// ---------------------------------------------------------------------------
// Token cache (module-level, lives for the function instance lifetime)
// ---------------------------------------------------------------------------

let _cachedToken: string | null = null;
let _tokenExpiry = 0;

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  // Return cached token if still valid (5-minute buffer already baked in)
  if (_cachedToken && Date.now() < _tokenExpiry) {
    return _cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const resp = await fetch(
    `https://accounts.zoho.com/oauth/v2/token?${params.toString()}`,
    { method: "POST" },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Zoho token refresh failed (${resp.status}): ${text}`);
  }

  const json = (await resp.json()) as { access_token?: string; expires_in?: number; error?: string };

  if (!json.access_token) {
    throw new Error(`Zoho token refresh error: ${json.error ?? JSON.stringify(json)}`);
  }

  const expiresIn = json.expires_in ?? 3600;
  _cachedToken = json.access_token;
  _tokenExpiry = Date.now() + (expiresIn - 300) * 1000; // 5-minute buffer

  logger.info("Zoho access token refreshed successfully");
  return _cachedToken;
}

// ---------------------------------------------------------------------------
// Low-level Zoho Books API helper
// ---------------------------------------------------------------------------

async function zohoRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  orgId: string,
  token: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `https://books.zoho.com/api/v3${path}?organization_id=${orgId}`;
  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Zoho API ${method} ${path} → ${resp.status}: ${text}`);
  }

  const json = (await resp.json()) as { code: number; message?: string } & T;

  if (json.code !== 0) {
    throw new Error(`Zoho API error on ${path}: [${json.code}] ${json.message ?? JSON.stringify(json)}`);
  }

  return json;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZohoLineItem {
  description: string;
  account_id: string;
  quantity: number;
  rate: number;
}

export interface CreateInvoicePayload {
  contactId: string;
  lineItems: ZohoLineItem[];
  discountSAR: number;
  referenceNumber: string;
  notes?: string;
}

export interface RecordPaymentPayload {
  invoiceId: string;
  amountSAR: number;
  referenceNumber: string;
  paymentDate: string; // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Contact upsert — search first, create only if not found
// ---------------------------------------------------------------------------

export async function upsertContact(
  email: string,
  name: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  orgId: string,
): Promise<string> {
  const token = await refreshAccessToken(clientId, clientSecret, refreshToken);

  // Search for existing contact by email
  const searchResp = (await zohoRequest<{
    code: number;
    contacts?: Array<{ contact_id: string; email: string }>;
  }>("GET", `/contacts?email=${encodeURIComponent(email)}`, orgId, token)) as {
    code: number;
    contacts?: Array<{ contact_id: string; email: string }>;
  };

  if (searchResp.contacts && searchResp.contacts.length > 0) {
    logger.info(`Found existing Zoho contact for ${email}: ${searchResp.contacts[0].contact_id}`);
    return searchResp.contacts[0].contact_id;
  }

  // Create new contact
  const createResp = (await zohoRequest<{
    code: number;
    contact?: { contact_id: string };
  }>("POST", "/contacts", orgId, token, {
    contact_name: name,
    contact_type: "customer",
    email,
  })) as { code: number; contact?: { contact_id: string } };

  if (!createResp.contact?.contact_id) {
    throw new Error(`Failed to create Zoho contact for ${email}`);
  }

  logger.info(`Created Zoho contact for ${email}: ${createResp.contact.contact_id}`);
  return createResp.contact.contact_id;
}

// ---------------------------------------------------------------------------
// Create invoice (Clearing Account method — account_id on line items, no item_id)
// ---------------------------------------------------------------------------

export async function createInvoice(
  payload: CreateInvoicePayload,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  orgId: string,
): Promise<string> {
  const token = await refreshAccessToken(clientId, clientSecret, refreshToken);

  const lineItems = payload.lineItems.map((item) => ({
    description: item.description,
    account_id: item.account_id,
    quantity: item.quantity,
    rate: item.rate,
  }));

  const invoiceBody: Record<string, unknown> = {
    customer_id: payload.contactId,
    line_items: lineItems,
    reference_number: payload.referenceNumber,
    notes: payload.notes ?? "Alvey Education — STC Pay payment",
  };

  if (payload.discountSAR > 0) {
    invoiceBody.discount = payload.discountSAR;
    invoiceBody.is_discount_before_tax = true;
    invoiceBody.discount_type = "entity_level";
  }

  const resp = (await zohoRequest<{
    code: number;
    invoice?: { invoice_id: string };
  }>("POST", "/invoices?send=false", orgId, token, invoiceBody)) as {
    code: number;
    invoice?: { invoice_id: string };
  };

  if (!resp.invoice?.invoice_id) {
    throw new Error("Zoho createInvoice did not return invoice_id");
  }

  logger.info(`Created Zoho invoice: ${resp.invoice.invoice_id}`);
  return resp.invoice.invoice_id;
}

// ---------------------------------------------------------------------------
// Record payment against an invoice
// ---------------------------------------------------------------------------

export async function recordPayment(
  payload: RecordPaymentPayload,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  orgId: string,
): Promise<string> {
  const token = await refreshAccessToken(clientId, clientSecret, refreshToken);

  const resp = (await zohoRequest<{
    code: number;
    payment?: { payment_id: string };
  }>("POST", "/customerpayments", orgId, token, {
    customer_payment_id: payload.invoiceId,
    invoice_id: payload.invoiceId,
    amount: payload.amountSAR,
    payment_mode: "cash",
    account_id: ZOHO_ACCOUNTS.STC_PAY_BANK,
    reference_number: payload.referenceNumber,
    date: payload.paymentDate,
    invoices: [{ invoice_id: payload.invoiceId, amount_applied: payload.amountSAR }],
  })) as { code: number; payment?: { payment_id: string } };

  if (!resp.payment?.payment_id) {
    throw new Error("Zoho recordPayment did not return payment_id");
  }

  logger.info(`Recorded Zoho payment: ${resp.payment.payment_id}`);
  return resp.payment.payment_id;
}

/**
 * WhatsApp Cloud API Driver for ScienceLab Management System
 *
 * Implements Phase 7 optional extension for official Meta WhatsApp Cloud API.
 * Uses Graph API v18.0 / v19.0 to send official template messages or direct texts.
 *
 * Configuration via environment variables:
 * - WHATSAPP_CLOUD_API_TOKEN: Meta System User access token
 * - WHATSAPP_PHONE_NUMBER_ID: Sender phone number ID from WhatsApp Business Manager
 * - WHATSAPP_BUSINESS_ACCOUNT_ID: Optional WABA ID
 */

import { prisma } from "@/lib/prisma";
import { normalizeBdPhone } from "@/lib/phone";

export interface SendWhatsAppCloudOptions {
  to: string;
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParams?: string[];
  teacherId?: number;
  kind?: string; // DAILY_DIGEST, CHANGE, etc.
  forDate?: string;
  dedupeKey?: string;
}

export interface WhatsAppCloudResult {
  success: boolean;
  notConfigured?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Checks whether WhatsApp Cloud API credentials are fully configured.
 */
export function isWhatsAppCloudConfigured(): boolean {
  return !!(process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Sends a WhatsApp message via official Meta WhatsApp Cloud API.
 * If credentials are not set, returns notConfigured: true without throwing.
 */
export async function sendWhatsAppCloudMessage(
  options: SendWhatsAppCloudOptions
): Promise<WhatsAppCloudResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      success: false,
      notConfigured: true,
      error: "WhatsApp Cloud API credentials (WHATSAPP_CLOUD_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are not configured.",
    };
  }

  const normalized = normalizeBdPhone(options.to);
  if (!normalized || !normalized.isValid) {
    return {
      success: false,
      error: `Invalid recipient phone number: ${options.to}. ${normalized?.error || ""}`.trim(),
    };
  }

  // Meta expects international digits without plus (e.g. 88017...)
  const recipientDigits = normalized.waNumber;

  let requestBody: Record<string, any>;

  if (options.templateName) {
    requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientDigits,
      type: "template",
      template: {
        name: options.templateName,
        language: {
          code: options.templateLanguage || "en_US",
        },
        components: options.templateParams && options.templateParams.length > 0
          ? [
              {
                type: "body",
                parameters: options.templateParams.map((param) => ({
                  type: "text",
                  text: param,
                })),
              },
            ]
          : [],
      },
    };
  } else {
    requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientDigits,
      type: "text",
      text: {
        preview_url: false,
        body: options.text || "",
      },
    };
  }

  const endpoint = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `WhatsApp Cloud API error (status ${response.status})`;
      if (options.teacherId && options.forDate) {
        await logCloudNotificationAttempt({
          teacherId: options.teacherId,
          forDate: options.forDate,
          kind: options.kind || "DAILY_DIGEST",
          recipient: normalized.e164,
          status: "FAILED",
          error: errMsg,
          dedupeKey: options.dedupeKey,
        });
      }
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id || "cloud_msg_ok";

    if (options.teacherId && options.forDate) {
      await logCloudNotificationAttempt({
        teacherId: options.teacherId,
        forDate: options.forDate,
        kind: options.kind || "DAILY_DIGEST",
        recipient: normalized.e164,
        status: "SENT",
        providerMessageId: messageId,
        dedupeKey: options.dedupeKey,
      });
    }

    return { success: true, messageId };
  } catch (err: any) {
    const errMsg = err.name === "AbortError" ? "Request timeout calling WhatsApp Cloud API" : err.message;
    if (options.teacherId && options.forDate) {
      await logCloudNotificationAttempt({
        teacherId: options.teacherId,
        forDate: options.forDate,
        kind: options.kind || "DAILY_DIGEST",
        recipient: normalized.e164,
        status: "FAILED",
        error: errMsg,
        dedupeKey: options.dedupeKey,
      });
    }
    return { success: false, error: errMsg };
  }
}

async function logCloudNotificationAttempt(params: {
  teacherId: number;
  forDate: string;
  kind: string;
  recipient: string;
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  error?: string;
  dedupeKey?: string;
}) {
  try {
    const dedupeKey = params.dedupeKey || `teacher:${params.teacherId}:${params.forDate}:WHATSAPP_CLOUD:${params.kind}`;

    await prisma.notificationLog.upsert({
      where: { dedupeKey },
      update: {
        status: params.status,
        recipient: params.recipient,
        providerMessageId: params.providerMessageId ?? null,
        error: params.error ?? null,
        sentAt: params.status === "SENT" ? new Date() : undefined,
        attempts: { increment: 1 },
      },
      create: {
        teacherId: params.teacherId,
        channel: "WHATSAPP_CLOUD",
        kind: params.kind,
        forDate: params.forDate,
        status: params.status,
        recipient: params.recipient,
        providerMessageId: params.providerMessageId ?? null,
        error: params.error ?? null,
        sentAt: params.status === "SENT" ? new Date() : undefined,
        attempts: 1,
        dedupeKey,
      },
    });
  } catch (err: any) {
    console.error("[logCloudNotificationAttempt] Failed to log NotificationLog:", err);
  }
}

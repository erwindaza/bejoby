// src/lib/agent-fabric/channels/whatsapp.ts
// Cliente mínimo para WhatsApp Cloud API de Meta.

export interface WhatsAppMessage {
  from: string;
  text: string;
  timestamp: string;
  messageId: string;
  profileName?: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type?: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export function extractMessages(payload: WhatsAppWebhookPayload): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];

  if (payload.object !== "whatsapp_business_account") return messages;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      const contacts = value.contacts || [];

      for (const msg of value.messages || []) {
        if (msg.type !== "text" || !msg.text?.body) continue;

        const contact = contacts.find((c) => c.wa_id === msg.from);
        messages.push({
          from: msg.from,
          text: msg.text.body,
          timestamp: msg.timestamp,
          messageId: msg.id,
          profileName: contact?.profile?.name,
        });
      }
    }
  }

  return messages;
}

export interface SendWhatsAppTextInput {
  to: string;
  text: string;
  replyToMessageId?: string;
}

export async function sendWhatsAppText(input: SendWhatsAppTextInput): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.META_WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error("Missing WhatsApp credentials: WHATSAPP_PHONE_NUMBER_ID or META_WHATSAPP_TOKEN");
  }

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: input.to,
    type: "text",
    text: { body: input.text, preview_url: false },
  };

  if (input.replyToMessageId) {
    body.context = { message_id: input.replyToMessageId };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${errorText}`);
  }
}

export function verifyWhatsAppWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
): string | null {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }

  return null;
}

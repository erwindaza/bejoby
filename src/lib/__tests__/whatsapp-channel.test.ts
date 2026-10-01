import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractMessages,
  sendWhatsAppText,
  verifyWhatsAppWebhook,
  type WhatsAppWebhookPayload,
} from "../agent-fabric/channels/whatsapp";

describe("whatsapp channel", () => {
  beforeEach(() => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
    process.env.META_WHATSAPP_TOKEN = "test-token";
    process.env.WHATSAPP_VERIFY_TOKEN = "verify-123";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts text messages from webhook payload", () => {
    const payload: WhatsAppWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "entry-1",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "56900000000",
                  phone_number_id: "123456789",
                },
                contacts: [{ profile: { name: "Ana" }, wa_id: "56999999999" }],
                messages: [
                  {
                    from: "56999999999",
                    id: "msg-1",
                    timestamp: "1234567890",
                    type: "text",
                    text: { body: "Hola, quiero coaching laboral" },
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    const messages = extractMessages(payload);
    expect(messages).toHaveLength(1);
    expect(messages[0].from).toBe("56999999999");
    expect(messages[0].text).toBe("Hola, quiero coaching laboral");
    expect(messages[0].profileName).toBe("Ana");
  });

  it("ignores non-text messages", () => {
    const payload: WhatsAppWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "entry-1",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "56900000000",
                  phone_number_id: "123456789",
                },
                messages: [
                  {
                    from: "56999999999",
                    id: "msg-1",
                    timestamp: "1234567890",
                    type: "image",
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    const messages = extractMessages(payload);
    expect(messages).toHaveLength(0);
  });

  it("returns null when webhook verification fails", () => {
    expect(verifyWhatsAppWebhook("subscribe", "wrong-token", "challenge-123")).toBeNull();
  });

  it("returns challenge when webhook verification succeeds", () => {
    expect(verifyWhatsAppWebhook("subscribe", "verify-123", "challenge-123")).toBe("challenge-123");
  });

  it("sends WhatsApp text message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "{}",
    });
    global.fetch = fetchMock;

    await sendWhatsAppText({ to: "56999999999", text: "Hola, soy tu coach" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("123456789/messages");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-token");

    const body = JSON.parse(options.body as string);
    expect(body.to).toBe("56999999999");
    expect(body.text.body).toBe("Hola, soy tu coach");
  });

  it("throws when WhatsApp API returns error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad request",
    });

    await expect(sendWhatsAppText({ to: "56999999999", text: "Hola" })).rejects.toThrow(
      "WhatsApp API error 400",
    );
  });
});

// src/lib/validators/contact.ts
import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  message: z.string().min(1, "Message is required").max(5000),
  source: z.enum(["contact", "coaching", "subscribe"]).default("contact"),
});

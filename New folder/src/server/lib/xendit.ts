// File: src/server/lib/xendit.ts
import { Xendit } from "xendit-node";
import { env } from "~/env.js";

export const xenditClient = new Xendit({
  secretKey: env.XENDIT_SECRET_KEY,
});

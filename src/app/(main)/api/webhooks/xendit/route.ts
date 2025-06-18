// File: src/app/api/webhooks/xendit/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { env } from "~/env.js";

// Definisikan tipe untuk payload webhook dari Xendit
interface XenditWebhookPayload {
  id: string;
  external_id: string;
  status: string; // PAID, EXPIRED, etc.
  // Anda bisa tambahkan properti lain yang relevan di sini
}

export async function POST(req: NextRequest) {
  console.log("\n--- [XENDIT WEBHOOK] ---");
  const callbackToken = req.headers.get("x-callback-token");

  // 1. Verifikasi keamanan webhook token
  if (callbackToken !== env.XENDIT_WEBHOOK_TOKEN) {
    console.error("VERIFIKASI GAGAL: Callback token tidak valid.");
    return NextResponse.json(
      { message: "Invalid callback token" },
      { status: 401 },
    );
  }
  console.log("Verifikasi token berhasil.");

  try {
    // PERBAIKAN: Berikan tipe eksplisit pada body setelah di-parsing
    const body = (await req.json()) as XenditWebhookPayload;

    console.log("Request body diterima:", JSON.stringify(body, null, 2));

    // 2. Cek apakah status invoice adalah "PAID" (sekarang aman secara tipe)
    if (body.status === "PAID") {
      const orderId = body.external_id;
      console.log(
        `Memproses invoice yang sudah dibayar untuk Order ID: ${orderId}`,
      );

      // 3. Update status Order menjadi PAID
      const updatedOrder = await db.order.update({
        where: { id: orderId, status: "PENDING" },
        data: { status: "PAID" },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      console.log(`Order ${orderId} berhasil diupdate menjadi PAID.`);

      // 4. Buat UserInvitation untuk setiap item digital di dalam order
      if (updatedOrder) {
        for (const item of updatedOrder.items) {
          if (item.product.category === "DIGITAL" && item.subdomain) {
            await db.userInvitation.create({
              data: {
                userId: updatedOrder.userId,
                orderItemId: item.id,
                subdomain: item.subdomain,
                status: "DRAFT",
              },
            });
            console.log(
              `BERHASIL: UserInvitation telah dibuat untuk OrderItem ID: ${item.id}`,
            );
          }
        }
      }
    } else {
      console.log(
        `Event diabaikan (status bukan PAID, melainkan ${body.status}).`,
      );
    }

    // 5. Selalu kembalikan respons 200 OK ke Xendit
    return NextResponse.json(
      { message: "Webhook berhasil diterima dan diproses." },
      { status: 200 },
    );
  } catch (error) {
    console.error("!!! ERROR saat memproses webhook:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: errorMessage },
      { status: 500 },
    );
  }
}

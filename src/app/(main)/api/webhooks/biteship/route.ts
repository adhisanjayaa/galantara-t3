// File: src/app/api/webhooks/biteship/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { type ShippingStatus } from "@prisma/client";

export const runtime = "edge";

// Definisikan tipe untuk payload webhook dari Biteship
interface BiteshipWebhookPayload {
  event: string;
  courier_tracking_id?: string;
  order_id: string;
  status:
    | "allocated"
    | "picking_up"
    | "picked"
    | "dropping_off"
    | "delivered"
    | "rejected"
    | "disposed"
    | "returned";
}

// Fungsi untuk memetakan status Biteship ke Enum ShippingStatus kita
function mapBiteshipStatusToEnum(
  biteshipStatus: string,
): ShippingStatus | null {
  switch (biteshipStatus) {
    case "allocated":
    case "picking_up":
    case "picked":
      return "SHIPPED";
    case "dropping_off":
      return "IN_TRANSIT";
    case "delivered":
      return "DELIVERED";
    // --- PERBAIKAN DI SINI ---
    // Ubah "FAILED" menjadi "CANCELED" agar sesuai dengan enum Prisma Anda
    case "rejected":
    case "disposed":
      return "CANCELED";
    case "returned":
      return "RETURNED";
    default:
      return null; // Abaikan status yang tidak kita kenali
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BiteshipWebhookPayload;
    console.log("--- [BITESHIP WEBHOOK RECEIVED] ---");
    console.log("Payload:", JSON.stringify(body, null, 2));

    if (body.event !== "order.status_updated") {
      console.log(
        `Event diabaikan (bukan 'order.status_updated', melainkan '${body.event}').`,
      );
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const orderId = body.order_id.replace("GALANTARA-", "");
    if (!orderId) {
      throw new Error("OrderId tidak ditemukan dalam payload.");
    }

    const newShippingStatus = mapBiteshipStatusToEnum(body.status);

    if (newShippingStatus) {
      await db.order.update({
        where: { id: orderId },
        data: {
          shippingStatus: newShippingStatus,
          ...(body.courier_tracking_id && {
            trackingId: body.courier_tracking_id,
          }),
        },
      });
      console.log(
        `BERHASIL: Order ${orderId} diupdate statusnya menjadi ${newShippingStatus}`,
      );
    } else {
      console.log(
        `Status Biteship '${body.status}' diabaikan karena tidak ada pemetaan.`,
      );
    }

    return NextResponse.json(
      { message: "Webhook processed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("!!! ERROR saat memproses webhook Biteship:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: errorMessage },
      { status: 500 },
    );
  }
}

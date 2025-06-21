// File: src/app/(main)/checkout/components/CheckoutForm.tsx
"use client";

import { useState, useEffect } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// Definisikan tipe untuk satu opsi pengiriman dari API
type ShippingRate = RouterOutputs["shipping"]["getShippingRates"][number];

export function CheckoutForm() {
  const { data: cart, isLoading: isCartLoading } = api.cart.getCart.useQuery();
  const { data: savedAddresses } = api.profile.getAddresses.useQuery();
  const { user } = useUser();

  const [customerName, setCustomerName] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<
    string | undefined
  >();
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  const {
    data: shippingRates,
    isLoading: isFetchingRates,
    isError: isShippingError,
  } = api.shipping.getShippingRates.useQuery(
    { destinationAddressId: selectedAddressId! },
    { enabled: !!selectedAddressId, refetchOnWindowFocus: false, retry: 1 },
  );

  useEffect(() => {
    // Isi nama pelanggan dari data Clerk jika belum diisi
    if (user && !customerName) {
      setCustomerName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
    }
    // Pilih alamat utama sebagai default saat data alamat pertama kali dimuat
    if (savedAddresses && !selectedAddressId) {
      const primaryAddress =
        savedAddresses.find((a) => a.type === "PRIMARY") ?? savedAddresses[0];
      if (primaryAddress) {
        setSelectedAddressId(primaryAddress.id);
      }
    }
  }, [user, savedAddresses, customerName, selectedAddressId]);

  useEffect(() => {
    // Pilih ongkir termurah secara default saat daftar ongkir diterima
    if (shippingRates && shippingRates.length > 0) {
      // Urutkan berdasarkan harga termurah
      const sortedRates = [...shippingRates].sort((a, b) => a.price - b.price);
      setSelectedRate(sortedRates[0]!);
    } else {
      setSelectedRate(null);
    }
  }, [shippingRates]);

  const checkoutMutation = api.order.createOrderFromCart.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error("Gagal mendapatkan URL pembayaran.");
      }
    },
    onError: (error) => {
      toast.error(`Checkout gagal: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      toast.error("Nama pelanggan harus diisi.");
      return;
    }
    const hasPhysicalProduct = cart?.items.some(
      (item) => item.product.category === "PHYSICAL",
    );
    if (hasPhysicalProduct && !selectedRate) {
      toast.error("Silakan pilih metode pengiriman.");
      return;
    }

    // Panggil mutasi dengan data yang sudah diperbarui
    checkoutMutation.mutate({
      customerName,
      addressId: selectedAddressId,
      shippingProvider: selectedRate
        ? `${selectedRate.courier_name} - ${selectedRate.courier_service_name}`
        : undefined,
      shippingCost: selectedRate?.price,
      // Kirimkan kode-kode yang dibutuhkan oleh API
      courierCompany: selectedRate?.courier_code,
      courierService: selectedRate?.courier_service_code,
    });
  };

  if (isCartLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <h3 className="text-xl font-semibold">Keranjang Anda Kosong</h3>
        <Button asChild className="mt-4">
          <Link href="/themes">Mulai Belanja</Link>
        </Button>
      </div>
    );
  }

  const hasPhysicalProduct = cart.items.some(
    (item) => item.product.category === "PHYSICAL",
  );
  const subtotal = cart.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const total = subtotal + (selectedRate?.price ?? 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pelanggan & Pengiriman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="customerName">Nama Lengkap Penerima</Label>
              <input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border-input mt-1 w-full rounded-md border p-2"
                required
              />
            </div>

            {hasPhysicalProduct && (
              <div>
                <Label>Alamat Pengiriman</Label>
                {savedAddresses && savedAddresses.length > 0 ? (
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={(id) => {
                      setSelectedAddressId(id);
                      setSelectedRate(null);
                    }}
                    className="mt-2 space-y-2"
                  >
                    {savedAddresses.map((address) => (
                      <Label
                        key={address.id}
                        htmlFor={address.id}
                        className="hover:bg-accent has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-md border p-4"
                      >
                        <RadioGroupItem value={address.id} id={address.id} />
                        <div className="text-sm">
                          <p className="font-medium">
                            {address.type === "PRIMARY"
                              ? "Alamat Utama"
                              : "Alamat Sekunder"}
                          </p>
                          <p className="text-muted-foreground">
                            {address.street}, {address.city}, {address.province}{" "}
                            {address.postalCode}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="mt-2 rounded-md border-2 border-dashed p-4 text-center text-sm">
                    <p>Anda belum memiliki alamat tersimpan.</p>
                    <Button variant="link" asChild className="mt-1 h-auto p-0">
                      <Link href="/profile">Tambah Alamat di Profil</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {hasPhysicalProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Metode Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAddressId ? (
                <p className="text-muted-foreground text-sm">
                  Pilih alamat untuk melihat ongkos kirim.
                </p>
              ) : isFetchingRates ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mencari ongkos kirim...</span>
                </div>
              ) : isShippingError ? (
                <p className="text-destructive text-sm">
                  Gagal memuat ongkos kirim.
                </p>
              ) : shippingRates && shippingRates.length > 0 ? (
                <RadioGroup
                  value={selectedRate?.courier_service_code}
                  onValueChange={(code) => {
                    setSelectedRate(
                      shippingRates.find(
                        (r) => r.courier_service_code === code,
                      ) ?? null,
                    );
                  }}
                  className="space-y-2"
                >
                  {shippingRates.map((rate) => (
                    <Label
                      key={`${rate.courier_code}-${rate.courier_service_code}`}
                      className="hover:bg-accent has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary flex cursor-pointer items-center justify-between rounded-md border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {rate.courier_name} - {rate.courier_service_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p>
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(rate.price)}
                        </p>
                        <RadioGroupItem
                          value={rate.courier_service_code}
                          id={`${rate.courier_code}-${rate.courier_service_code}`}
                        />
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Tidak ada metode pengiriman yang tersedia untuk alamat ini.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4 lg:col-start-2">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(selectedRate?.price ?? 0)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>Total Pembayaran</span>
              <span>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(total)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? "Memproses..." : "Lanjut ke Pembayaran"}
        </Button>
      </div>
    </form>
  );
}

// File: src/app/(dashboard)/my-designs/page.tsx [NEW]

import { MyDesignsList } from "./components/MyDesignsList";

export default function MyDesignsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Desain Saya</h1>
        <p className="text-muted-foreground">
          Kelola semua desain yang telah Anda simpan. Lanjutkan mengedit atau
          tambahkan ke keranjang.
        </p>
      </div>
      <MyDesignsList />
    </div>
  );
}

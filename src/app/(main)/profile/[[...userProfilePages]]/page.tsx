// File: src/app/profile/[[...userProfilePages]]/page.tsx

import { UserProfile } from "@clerk/nextjs";
import { AddressManager } from "../components/AddressManager"; // <-- Impor komponen baru

export default function CustomProfilePage() {
  return (
    <div className="container mx-auto max-w-4xl divide-y divide-gray-200 px-4 py-12">
      {/* Ganti AddressForm dengan AddressManager */}
      <div className="py-8">
        <AddressManager />
      </div>

      <div className="py-8">
        <h2 className="mb-6 text-2xl font-bold">Pengaturan Akun & Keamanan</h2>
        <UserProfile path="/profile" routing="path" />
      </div>
    </div>
  );
}

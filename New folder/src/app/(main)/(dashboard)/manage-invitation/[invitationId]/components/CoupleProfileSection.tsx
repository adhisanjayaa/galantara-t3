// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/components/CoupleProfileSection.tsx

"use client";

import { useFormContext } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { PhotoUpload } from "./PhotoUpload";
import { type WeddingFormData } from "~/lib/formSchemas";

export function CoupleProfileSection() {
  // Ambil metode yang diperlukan dari form induk
  const { register, watch } = useFormContext<WeddingFormData>();

  const userPhoto = watch("user_photo_url");
  const partnerPhoto = watch("partner_photo_url");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Data Mempelai</h3>
      <Accordion
        type="multiple"
        // defaultValue membuat kedua item terbuka saat pertama kali dimuat
        defaultValue={["mempelai-1", "mempelai-2"]}
        className="w-full"
      >
        {/* Data Mempelai 1 */}
        <AccordionItem value="mempelai-1">
          <AccordionTrigger>Profil Mempelai Pertama</AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div>
              <Label htmlFor="user_full_name">Nama Lengkap</Label>
              <Input
                id="user_full_name"
                placeholder="cth. Budi Setiawan"
                {...register("user_full_name")}
              />
            </div>
            <div>
              <Label htmlFor="user_nickname">Nama Panggilan</Label>
              <Input
                id="user_nickname"
                placeholder="cth. Budi"
                {...register("user_nickname")}
              />
            </div>
            <div>
              <Label htmlFor="user_profile_brief">Profil Singkat</Label>
              <Textarea
                id="user_profile_brief"
                {...register("user_profile_brief")}
                placeholder="cth. Putra pertama dari Bpk. Sujatmiko dan Ibu Sri Rahayu"
              />
            </div>
            <PhotoUpload
              fieldName="user_photo_url"
              label="Foto Profil Mempelai Pertama"
              currentValue={userPhoto}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Data Mempelai 2 */}
        <AccordionItem value="mempelai-2">
          <AccordionTrigger>Profil Mempelai Kedua</AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div>
              <Label htmlFor="partner_full_name">Nama Lengkap</Label>
              <Input
                id="partner_full_name"
                placeholder="cth. Ani Lestari"
                {...register("partner_full_name")}
              />
            </div>
            <div>
              <Label htmlFor="partner_nickname">Nama Panggilan</Label>
              <Input
                id="partner_nickname"
                placeholder="cth. Ani"
                {...register("partner_nickname")}
              />
            </div>
            <div>
              <Label htmlFor="partner_profile_brief">Profil Singkat</Label>
              <Textarea
                id="partner_profile_brief"
                {...register("partner_profile_brief")}
                placeholder="cth. Putri kedua dari Bpk. Santoso dan Ibu Wati Ningsih"
              />
            </div>
            <PhotoUpload
              fieldName="partner_photo_url"
              label="Foto Profil Mempelai Kedua"
              currentValue={partnerPhoto}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

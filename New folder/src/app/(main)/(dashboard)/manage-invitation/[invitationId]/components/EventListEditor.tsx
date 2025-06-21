// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/components/EventListEditor.tsx

"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
// [FIX] Impor tipe dari lokasi yang benar (file skema terpusat)
import { type WeddingFormData } from "~/lib/formSchemas";
import { DateTimePicker } from "~/components/ui/date-time-picker";

export function EventListEditor() {
  // [FIX] Gunakan tipe WeddingFormData yang diimpor
  const { control, register } = useFormContext<WeddingFormData>();

  const { fields, append, remove } = useFieldArray<WeddingFormData, "events">({
    control,
    name: "events",
  });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Rangkaian Acara</h3>
      <div className="space-y-4">
        {fields.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Acara #{index + 1}</CardTitle>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nama Acara</Label>
                <Input
                  placeholder="cth. Akad Nikah"
                  {...register(`events.${index}.name`)}
                />
              </div>

              <Controller
                control={control}
                name={`events.${index}.datetime`}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <div>
                <Label>Link Google Maps</Label>
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  {...register(`events.${index}.gmaps_url`)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            name: "",
            datetime: new Date().toISOString(),
            gmaps_url: "",
          })
        }
        disabled={fields.length >= 3}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Acara (Maks. 3)
      </Button>
    </div>
  );
}

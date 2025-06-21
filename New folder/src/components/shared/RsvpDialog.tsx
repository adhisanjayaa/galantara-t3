// File: src/components/shared/RsvpDialog.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form"; // <-- Impor Controller
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RsvpStatus } from "@prisma/client";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2 } from "lucide-react";

const rsvpFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi."),
  guests: z.coerce.number().min(1, "Jumlah tamu minimal 1."),
  status: z.nativeEnum(RsvpStatus, {
    errorMap: () => ({ message: "Status kehadiran wajib dipilih." }),
  }),
  message: z.string().optional(),
});

type RsvpFormData = z.infer<typeof rsvpFormSchema>;

interface RsvpDialogProps {
  invitationId: string;
}

export function RsvpDialog({ invitationId }: RsvpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // `setValue` tidak lagi diperlukan di sini karena kita menggunakan Controller
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpFormSchema),
  });

  const createRsvpMutation = api.rsvp.create.useMutation({
    onSuccess: () => {
      toast.success("Terima kasih! Konfirmasi Anda telah kami terima.");
      reset();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  const onSubmit = (data: RsvpFormData) => {
    createRsvpMutation.mutate({ ...data, invitationId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="rounded-full bg-gray-800 px-8 py-6 text-white hover:bg-gray-700"
        >
          Konfirmasi Kehadiran (RSVP)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Kehadiran</DialogTitle>
            <DialogDescription>
              Mohon isi form di bawah ini untuk mengonfirmasi kehadiran Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Nama Anda</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="guests">Jumlah Tamu (termasuk Anda)</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                {...register("guests")}
              />
              {errors.guests && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.guests.message}
                </p>
              )}
            </div>
            <div>
              <Label>Status Kehadiran</Label>
              {/* --- PERBAIKAN DI SINI --- */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RsvpStatus.ATTENDING}>
                        Hadir
                      </SelectItem>
                      <SelectItem value={RsvpStatus.NOT_ATTENDING}>
                        Tidak Hadir
                      </SelectItem>
                      <SelectItem value={RsvpStatus.TENTATIVE}>
                        Masih Ragu
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.status.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="message">Pesan & Ucapan (Opsional)</Label>
              <Textarea id="message" {...register("message")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createRsvpMutation.isPending}>
              {createRsvpMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kirim Konfirmasi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

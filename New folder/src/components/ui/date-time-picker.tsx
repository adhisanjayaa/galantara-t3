// File: src/components/ui/date-time-picker.tsx

"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, setHours, setMinutes, setSeconds } from "date-fns";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Label } from "./label";

interface DateTimePickerProps {
  value?: string; // Menerima ISO string
  onChange: (value?: string) => void; // Mengirim kembali ISO string
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Ubah ISO string menjadi objek Date, atau null jika tidak valid
  const date = value ? new Date(value) : undefined;

  // Handler saat tanggal di kalender dipilih
  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (!selectedDay) {
      onChange(undefined);
      return;
    }
    // Pertahankan jam dan menit dari tanggal sebelumnya jika ada
    const newDate = setSeconds(
      setMinutes(
        setHours(selectedDay, date?.getHours() ?? 0),
        date?.getMinutes() ?? 0,
      ),
      0,
    );
    onChange(newDate.toISOString());
    setOpen(false); // Tutup popover setelah memilih
  };

  // Handler saat nilai waktu di input berubah
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    const [hours, minutes] = timeValue.split(":").map(Number);

    // Ambil tanggal yang ada, atau gunakan hari ini sebagai basis
    const baseDate = date ? new Date(date) : new Date();
    const newDate = setSeconds(
      setMinutes(setHours(baseDate, hours ?? 0), minutes ?? 0),
      0,
    );
    onChange(newDate.toISOString());
  };

  // Format waktu untuk ditampilkan di input
  const timeValue = date ? format(date, "HH:mm") : "";

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1.5">
        <Label>Tanggal</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-1.5">
        <Label>Waktu</Label>
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="w-[120px]"
        />
      </div>
    </div>
  );
}

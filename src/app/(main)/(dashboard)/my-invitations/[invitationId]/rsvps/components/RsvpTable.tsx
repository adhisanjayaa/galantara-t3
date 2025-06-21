// File: src/app/(main)/(dashboard)/my-invitations/[invitationId]/rsvps/components/RsvpTable.tsx
"use client";

import { type RouterOutputs } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RsvpStatus } from "@prisma/client";
import { MessageSquare } from "lucide-react";

type RsvpData = RouterOutputs["rsvp"]["getForInvitation"];

// Helper untuk styling & teks status
const statusMap = {
  [RsvpStatus.ATTENDING]: { text: "Hadir", variant: "default" as const },
  [RsvpStatus.NOT_ATTENDING]: {
    text: "Tidak Hadir",
    variant: "destructive" as const,
  },
  [RsvpStatus.TENTATIVE]: { text: "Ragu-ragu", variant: "secondary" as const },
};

export function RsvpTable({ data }: { data: RsvpData }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <h3 className="text-xl font-semibold">Belum Ada RSVP</h3>
        <p className="text-muted-foreground mt-2">
          Belum ada tamu yang melakukan konfirmasi kehadiran.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Tamu</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Jml. Tamu</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead className="text-right">Pesan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((rsvp) => (
            <TableRow key={rsvp.id}>
              <TableCell className="font-medium">{rsvp.name}</TableCell>
              <TableCell>
                <Badge variant={statusMap[rsvp.status].variant}>
                  {statusMap[rsvp.status].text}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{rsvp.guests}</TableCell>
              <TableCell>
                {format(rsvp.createdAt, "dd MMM yyyy, HH:mm", { locale: id })}
              </TableCell>
              <TableCell className="text-right">
                {rsvp.message ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Lihat
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pesan dari {rsvp.name}</DialogTitle>
                      </DialogHeader>
                      <div className="text-muted-foreground py-4 whitespace-pre-wrap">
                        {rsvp.message}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

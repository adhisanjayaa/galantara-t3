// File: src/app/admin/templates/components/TemplateClient.tsx [NEW]
"use client";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TemplateTable } from "./TemplateTable";
import Link from "next/link";

type Template = RouterOutputs["admin"]["getDesignTemplates"][number];

export function TemplateClient({
  initialTemplates,
}: {
  initialTemplates: Template[];
}) {
  const { data: templates } = api.admin.getDesignTemplates.useQuery(undefined, {
    initialData: initialTemplates,
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/admin/templates/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Template Baru
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border">
        {templates && <TemplateTable templates={templates} />}
      </div>
    </>
  );
}

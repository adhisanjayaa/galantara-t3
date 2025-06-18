// File: src/app/admin/templates/page.tsx [NEW]
import { api } from "~/trpc/server";
import { TemplateClient } from "./components/TemplateClient";

export default async function AdminTemplatesPage() {
  const templates = await api.admin.getDesignTemplates();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Manajemen Template Desain</h1>
      <TemplateClient initialTemplates={templates} />
    </div>
  );
}

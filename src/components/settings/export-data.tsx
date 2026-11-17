import { FileSpreadsheetIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Translator } from "@/lib/i18n";

/** Plain download links: the route handler streams the file with Content-Disposition. */
export function ExportData({ t }: { t: Translator }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild>
        <a href="/api/export/csv" download>
          <FileSpreadsheetIcon /> {t("settings.exportCsv")}
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href="/api/export/pdf" download>
          <FileTextIcon /> {t("settings.exportPdf")}
        </a>
      </Button>
    </div>
  );
}

import { Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/shared/components/ui/table";

type TableLoadingRowProps = {
  colSpan: number;
  text?: string;
};

export function TableLoadingRow({
  colSpan,
  text = "Cargando información...",
}: TableLoadingRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{text}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
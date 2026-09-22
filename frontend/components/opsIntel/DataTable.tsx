import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  onRowClick?: (row: T) => void;
  /** When set, sorting is driven by the parent (server-side) instead of TanStack's client model. */
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  rowKey?: (row: T, index: number) => string;
  dense?: boolean;
}

export default function DataTable<T>({ columns, data, onRowClick, manualSorting, sorting: controlledSorting, onSortingChange, rowKey, dense }: DataTableProps<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = manualSorting ? controlledSorting ?? [] : internalSorting;

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: manualSorting
      ? (updater) => {
          const next = typeof updater === "function" ? updater(sorting) : updater;
          onSortingChange?.(next);
        }
      : setInternalSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
  });

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[13px] border-collapse min-w-[640px]">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={`text-left text-[10.5px] uppercase tracking-wide font-bold text-slate-400 px-2.5 py-2 border-b-2 border-slate-100 whitespace-nowrap ${canSort ? "cursor-pointer select-none hover:text-slate-600" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (sortDir === "asc" ? <ChevronUp size={11} /> : sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronsUpDown size={11} className="opacity-40" />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row.original, i) : row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={`border-b border-slate-50 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={`px-2.5 ${dense ? "py-1.5" : "py-2.5"} text-slate-700 whitespace-nowrap`}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center text-slate-400 text-sm py-8">
                No rows match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

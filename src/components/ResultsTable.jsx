import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";

export default function ResultsTable({ rows, loading = false }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: "student_name",
        header: "Student",
        cell: ({ row }) => (
          <div className="font-semibold text-slate-700 pl-4">
            {row.getValue("student_name")}
          </div>
        ),
      },
      {
        accessorKey: "class",
        header: "Class",
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-white/50">
            {row.original.quiz_classes?.class_name ?? "-"}
          </Badge>
        ),
      },
      {
        accessorKey: "total_score",
        header: "Score",
        cell: ({ row }) => (
          <div className="font-bold text-purple-600">
            {Number(row.getValue("total_score") ?? 0).toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "correct",
        header: "Correct",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 border-none font-bold"
          >
            {row.getValue("correct")}
          </Badge>
        ),
      },
      {
        accessorKey: "wrong",
        header: "Wrong",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 border-none font-bold"
          >
            {row.getValue("wrong")}
          </Badge>
        ),
      },
      {
        accessorKey: "skipped",
        header: "Skipped",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-slate-400 font-bold">
            {row.getValue("skipped")}
          </Badge>
        ),
      },
      {
        accessorKey: "submitted_at",
        header: "Submitted",
        cell: ({ row }) => (
          <div className="text-slate-500 text-xs pr-4">
            {row.getValue("submitted_at")
              ? new Date(row.getValue("submitted_at")).toLocaleString()
              : "-"}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="overflow-hidden">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-purple-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs uppercase tracking-wider font-bold text-slate-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-purple-50/20 transition-colors`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${
                        cell.column.id === "student_name"
                          ? "pl-0"
                          : cell.column.id === "class"
                            ? "pl-5"
                            : cell.column.id === "total_score"
                              ? "pl-[18px]"
                              : cell.column.id === "correct"
                                ? "pl-8"
                                : cell.column.id === "wrong"
                                  ? "pl-7"
                                  : cell.column.id === "skipped"
                                    ? "pl-8"
                                    : cell.column.id === "submitted_at"
                                      ? "pl-4"
                                      : "pl-0"
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  No results found yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end space-x-2 py-4 px-1">
          <div className="flex-1 text-xs text-slate-500">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl h-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl h-8"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

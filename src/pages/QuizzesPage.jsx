import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { CloneQuizDialog } from "./quizzes/CloneQuizModals";
import { createQuizzesColumns } from "./quizzes/quizzesTableColumns";
import { getQuizStatus } from "./quizzes/quizStatus";
import { notify } from "../lib/notify";
import { useConfirm } from "../contexts/ConfirmDialogContext";

export default function QuizzesPage() {
  const { session } = useAuth();
  const teacherId = session?.user?.id;
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [cloneSource, setCloneSource] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const load = useCallback(async () => {
    if (!teacherId) {
      setQuizzes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id,title,start_at,end_at,public_token,is_paused,quiz_classes(class_name),submissions(id),questions(id)",
      )
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) {
      notify.error("Failed to load quizzes.");
      setQuizzes([]);
      setLoading(false);
      return;
    }

    const enriched = (data ?? []).map((q) => ({
      ...q,
      computedStatus: getQuizStatus(q),
      classNames: q.quiz_classes?.map((c) => c.class_name).join(", ") ?? "",
    }));

    setQuizzes(enriched);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(
    async (q) => {
      const status = getQuizStatus(q);
      if (status !== "upcoming" && status !== "ended") {
        notify.error("You cannot delete an active or paused quiz.");
        return;
      }
      const confirmed = await confirm({
        title: "Delete quiz?",
        description:
          "Are you sure you want to delete this quiz? This action cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "destructive",
      });
      if (!confirmed) return;
      const { error } = await supabase.from("quizzes").delete().eq("id", q.id);
      if (error) {
        notify.error(`Failed to delete quiz: ${error.message}`);
        return;
      }
      notify.success("Quiz deleted.");
      load();
    },
    [load, confirm],
  );

  const stopQuiz = useCallback(
    async (id) => {
      const confirmed = await confirm({
        title: "Stop quiz?",
        description:
          "This will end the quiz immediately. Students will no longer be able to submit.",
        confirmLabel: "Stop quiz",
        cancelLabel: "Cancel",
        variant: "destructive",
      });
      if (!confirmed) return;
      const { error } = await supabase
        .from("quizzes")
        .update({ end_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        notify.error(`Failed to stop quiz: ${error.message}`);
        return;
      }
      notify.success("Quiz stopped.");
      load();
    },
    [load, confirm],
  );

  const togglePause = useCallback(
    async (id, currentlyPaused) => {
      const action = currentlyPaused ? "resume" : "pause";
      const confirmed = await confirm({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} quiz?`,
        description: `Are you sure you want to ${action} this quiz?`,
        confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
        cancelLabel: "Cancel",
        variant: currentlyPaused ? "default" : "destructive",
      });
      if (!confirmed) return;
      const { error } = await supabase
        .from("quizzes")
        .update({ is_paused: !currentlyPaused })
        .eq("id", id);
      if (error) {
        notify.error(`Failed to ${action} quiz: ${error.message}`);
        return;
      }
      notify.success(`Quiz ${currentlyPaused ? "resumed" : "paused"}.`);
      load();
    },
    [load, confirm],
  );

  const columns = useMemo(
    () =>
      createQuizzesColumns({
        navigate,
        setCloneSource,
        togglePause,
        stopQuiz,
        remove,
      }),
    [navigate, togglePause, stopQuiz, remove],
  );

  const allClassNames = useMemo(() => {
    const names = new Set();
    quizzes.forEach((q) => {
      q.quiz_classes?.forEach((c) => names.add(c.class_name));
    });
    return Array.from(names).sort();
  }, [quizzes]);

  const table = useReactTable({
    data: quizzes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {cloneSource && (
        <CloneQuizDialog
          sourceQuiz={cloneSource}
          onClose={() => setCloneSource(null)}
          onSuccess={(newId, newTitle) => {
            setCloneSource(null);
            load();
            notify.success(`"${newTitle}" cloned successfully.`, {
              action: {
                label: "View quiz",
                onClick: () => navigate(`/dashboard/quiz/${newId}`),
              },
            });
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-700">
            Quizzes
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage your quizzes.
          </p>
        </div>
        <Link
          to="/dashboard/quiz/create"
          className=" bg-purple-600 flex items-center gap-1 hover:bg-purple-700 text-white rounded-full px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Quiz
        </Link>
      </div>

      <div className="min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by title..."
              value={table.getColumn("title")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="pl-8 w-full rounded-xl border-slate-200 clay-element"
            />
          </div>
              <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-lg clay-element border-slate-200 text-slate-600 font-medium"
              >
                <Filter className="h-4 w-4 text-slate-400" />
                Status:{" "}
                <span className="text-purple-600 ml-1 capitalize">
                  {table.getColumn("computedStatus")?.getFilterValue() || "All"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-lg">
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("computedStatus")?.setFilterValue("")
                }
              >
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("computedStatus")?.setFilterValue("active")
                }
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("computedStatus")?.setFilterValue("upcoming")
                }
              >
                Upcoming
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("computedStatus")?.setFilterValue("ended")
                }
              >
                Ended
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("computedStatus")?.setFilterValue("paused")
                }
              >
                Paused
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl clay-element border-slate-200 text-slate-600 font-medium"
              >
                <Filter className="h-4 w-4 text-slate-400" />
                Class:{" "}
                <span className="text-purple-600 ml-1">
                  {table.getColumn("classNames")?.getFilterValue() || "All"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="rounded-lg max-h-[300px] overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("classNames")?.setFilterValue("")
                }
              >
                All Classes
              </DropdownMenuItem>
              {allClassNames.map((name) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() =>
                    table.getColumn("classNames")?.setFilterValue(name)
                  }
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
          {(table.getColumn("title")?.getFilterValue() ||
            table.getColumn("computedStatus")?.getFilterValue() ||
            table.getColumn("classNames")?.getFilterValue()) && (
            <Button
              variant="ghost"
              onClick={() => {
                table.getColumn("title")?.setFilterValue("");
                table.getColumn("computedStatus")?.setFilterValue("");
                table.getColumn("classNames")?.setFilterValue("");
              }}
              className="text-slate-400 hover:text-red-500 text-xs px-2"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="min-w-0 max-w-full p-0">
          <Table>
            <TableHeader className="bg-purple-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs uppercase tracking-wider font-bold"
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
              {loading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell className="pl-4">
                        <div className="h-4 bg-slate-200/80 rounded-md w-40" />
                      </TableCell>
                      <TableCell className="pl-[22px]">
                        <div className="h-5 bg-slate-200/80 rounded-full w-16" />
                      </TableCell>
                      <TableCell className="pl-[10px]">
                        <div className="space-y-1.5">
                          <div className="h-3 bg-slate-200/80 rounded w-36" />
                          <div className="h-3 bg-slate-200/80 rounded w-28 opacity-60" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 bg-slate-200/80 rounded-full w-8 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 bg-slate-200/80 rounded-full w-8 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 bg-slate-200/80 rounded-full w-10 mx-auto" />
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="h-8 w-8 bg-slate-200/80 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-purple-50/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "title"
                            ? "pl-4"
                            : cell.column.id === "actions"
                              ? "pr-6"
                              : cell.column.id === "status"
                                ? "pl-[22px]"
                                : cell.column.id === "window"
                                  ? "pl-[10px]"
                                  : ""
                        }
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
                    No quizzes found. Create one to get started.
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
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

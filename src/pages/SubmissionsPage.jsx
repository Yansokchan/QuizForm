import { useEffect, useState, useMemo } from "react";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Search,
  BookOpen,
  Users,
  Award,
  Activity,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Button } from "../components/ui/button";

export default function SubmissionsPage() {
  const { session } = useAuth();
  const teacherId = session?.user?.id;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!teacherId) {
        setSubmissions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.from("submissions").select(`
          *,
          quizzes!inner (
            title,
            teacher_id
          ),
          quiz_classes (
            class_name
          ),
          answers (
            time_taken
          )
        `)
        .eq("quizzes.teacher_id", teacherId);

      if (data) {
        // Calculate duration for each submission
        const formattedData = data.map((sub) => {
          const totalTimeSeconds =
            sub.answers?.reduce(
              (acc, ans) => acc + Number(ans.time_taken || 0),
              0,
            ) || 0;
          const minutes = Math.floor(totalTimeSeconds / 60);
          const seconds = totalTimeSeconds % 60;

          return {
            id: sub.id,
            studentName: sub.student_name,
            quizTitle: sub.quizzes?.title || "Deleted Quiz",
            className: sub.quiz_classes?.class_name || "No Class",
            score: Number(sub.total_score || 0),
            duration: totalTimeSeconds,
            durationDisplay: `${minutes}m ${seconds}s`,
            date: sub.submitted_at || sub.created_at,
          };
        });
        setSubmissions(formattedData);
      }
      setLoading(false);
    };

    fetchSubmissions();
  }, [teacherId]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "studentName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
          >
            Student
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-slate-700">
            {row.getValue("studentName")}
          </div>
        ),
      },
      {
        accessorKey: "quizTitle",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
          >
            Quiz
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-slate-600 truncate max-w-[200px]">
            {row.getValue("quizTitle")}
          </div>
        ),
      },
      {
        accessorKey: "className",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
          >
            Class
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="font-normal border-purple-100 bg-purple-50/30 text-purple-700"
          >
            {row.getValue("className")}
          </Badge>
        ),
      },
      {
        accessorKey: "score",
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider mx-auto"
            >
              Score
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const score = row.getValue("score");
          return (
            <div className="text-center">
              <span
                className={`font-bold ${score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500"}`}
              >
                {score.toFixed(1)}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "duration",
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider mx-auto"
            >
              Duration
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center text-slate-500 font-mono text-xs">
            {row.original.durationDisplay}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
            >
              Submitted At
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-slate-400 text-xs">
            {new Date(row.getValue("date")).toLocaleString()}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: submissions,
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

  const allQuizzes = useMemo(() => {
    const names = new Set();
    submissions.forEach((s) => names.add(s.quizTitle));
    return Array.from(names).sort();
  }, [submissions]);

  const allClasses = useMemo(() => {
    const names = new Set();
    submissions.forEach((s) => names.add(s.className));
    return Array.from(names).sort();
  }, [submissions]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const avgScore = total
      ? (submissions.reduce((acc, s) => acc + s.score, 0) / total).toFixed(1)
      : 0;
    const avgDurationSeconds = total
      ? Math.round(submissions.reduce((acc, s) => acc + s.duration, 0) / total)
      : 0;
    const avgDurationDisplay = `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`;

    return { total, avgScore, avgDurationDisplay };
  }, [submissions]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
          Submissions
        </h2>
        <p className="text-slate-500 mt-1">
          Monitor all quiz attempts and student performance in real-time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          [Activity, Award, Clock].map((Icon, i) => (
            <Card key={i} className="border-none clay-element bg-card/50 backdrop-blur-sm animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-3.5 bg-slate-200/80 rounded w-28" />
                <div className="h-4 w-4 bg-slate-200/80 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200/80 rounded w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-none clay-element bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Submissions</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-none clay-element bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Average Score</CardTitle>
                <Award className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-700">{stats.avgScore}%</div>
              </CardContent>
            </Card>
            <Card className="border-none clay-element bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Avg. Duration</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-700">{stats.avgDurationDisplay}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="border-none">
        <div className="flex flex-col sm:flex-row pb-6 items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8 w-full rounded-xl clay-element border-slate-200"
              value={table.getColumn("studentName")?.getFilterValue() ?? ""}
              onChange={(e) =>
                table.getColumn("studentName")?.setFilterValue(e.target.value)
              }
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-lg clay-element border-slate-200 text-slate-600 font-medium"
              >
                <Filter className="h-4 w-4 text-slate-400" />
                Quiz:{" "}
                <span className="text-purple-600 ml-1 truncate max-w-[100px]">
                  {table.getColumn("quizTitle")?.getFilterValue() || "All"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="rounded-lg max-h-[300px] overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => table.getColumn("quizTitle")?.setFilterValue("")}
              >
                All Quizzes
              </DropdownMenuItem>
              {allQuizzes.map((name) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() =>
                    table.getColumn("quizTitle")?.setFilterValue(name)
                  }
                >
                  {name}
                </DropdownMenuItem>
              ))}
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
                  {table.getColumn("className")?.getFilterValue() || "All"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="rounded-lg max-h-[300px] overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => table.getColumn("className")?.setFilterValue("")}
              >
                All Classes
              </DropdownMenuItem>
              {allClasses.map((name) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() =>
                    table.getColumn("className")?.setFilterValue(name)
                  }
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(table.getColumn("studentName")?.getFilterValue() ||
            table.getColumn("quizTitle")?.getFilterValue() ||
            table.getColumn("className")?.getFilterValue()) && (
            <Button
              variant="ghost"
              onClick={() => {
                table.getColumn("studentName")?.setFilterValue("");
                table.getColumn("quizTitle")?.setFilterValue("");
                table.getColumn("className")?.setFilterValue("");
              }}
              className="text-slate-400 hover:text-red-500 text-xs px-2"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="p-0">
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
                  {[...Array(8)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {/* Student */}
                      <TableCell className="pl-[18px]">
                        <div className="h-4 bg-slate-200/80 rounded w-32" />
                      </TableCell>
                      {/* Quiz */}
                      <TableCell className="pl-[18px]">
                        <div className="h-4 bg-slate-200/80 rounded w-44" />
                      </TableCell>
                      {/* Class */}
                      <TableCell className="pl-8">
                        <div className="h-5 bg-slate-200/80 rounded-full w-20" />
                      </TableCell>
                      {/* Score */}
                      <TableCell className="text-center">
                        <div className="h-4 bg-slate-200/80 rounded w-12 mx-auto" />
                      </TableCell>
                      {/* Duration */}
                      <TableCell className="text-center">
                        <div className="h-4 bg-slate-200/80 rounded w-14 mx-auto" />
                      </TableCell>
                      {/* Submitted At */}
                      <TableCell className="pr-6">
                        <div className="h-4 bg-slate-200/80 rounded w-32 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-purple-50/20 transition-colors border-slate-100/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "studentName"
                            ? "pl-[18px]"
                            : cell.column.id === "date"
                              ? "pr-6"
                              : cell.column.id === "quizTitle"
                                ? "pl-[18px]"
                                : cell.column.id === "className"
                                  ? "pl-8"
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
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4 px-6 border-t border-slate-100/50">
            <div className="text-xs text-slate-400 mr-auto">
              Showing {table.getRowModel().rows.length} of {submissions.length}{" "}
              submissions
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-xl border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl border-slate-200"
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

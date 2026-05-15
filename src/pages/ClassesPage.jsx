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
  Users,
  Award,
  BookOpen,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
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

export default function ClassesPage() {
  const { session } = useAuth();
  const teacherId = session?.user?.id;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!teacherId) {
        setSubmissions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase.from("submissions").select(`
          id,
          student_name,
          total_score,
          quiz_class_id,
          quiz_classes (
            class_name
          ),
          quizzes!inner (
            teacher_id
          )
        `)
        .eq("quizzes.teacher_id", teacherId);

      if (data) {
        setSubmissions(data);
      }
      setLoading(false);
    };

    fetchSubmissions();
  }, [teacherId]);

  const studentData = useMemo(() => {
    const map = {};
    submissions.forEach((sub) => {
      const key = `${sub.student_name}-${sub.quiz_classes?.class_name || "No Class"}`;
      if (!map[key]) {
        map[key] = {
          name: sub.student_name,
          className: sub.quiz_classes?.class_name || "No Class",
          submissions: 0,
          totalScore: 0,
        };
      }
      map[key].submissions += 1;
      map[key].totalScore += Number(sub.total_score || 0);
    });

    return Object.values(map)
      .map((s) => ({
        ...s,
        avgScore: (s.totalScore / s.submissions).toFixed(2),
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [submissions]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
          >
            Student Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">{row.getValue("name")}</div>
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
          <Badge variant="outline" className="font-normal">
            {row.getValue("className")}
          </Badge>
        ),
      },
      {
        accessorKey: "submissions",
        header: () => (
          <div className="text-center font-bold text-xs uppercase tracking-wider">
            Submissions
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("submissions")}</div>
        ),
      },
      {
        accessorKey: "avgScore",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
            >
              Avg. Grade
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const avgScore = row.getValue("avgScore");
          const scoreNum = Number(avgScore);
          return (
            <div className="text-right">
              <span
                className={`font-bold ${scoreNum >= 70 ? "text-green-500" : scoreNum >= 50 ? "text-yellow-500" : "text-red-500"}`}
              >
                {avgScore}%
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: studentData,
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

  const allClassNames = useMemo(() => {
    const names = new Set();
    studentData.forEach((s) => names.add(s.className));
    return Array.from(names).sort();
  }, [studentData]);

  const stats = useMemo(() => {
    const totalStudents = studentData.length;
    const totalSubmissions = submissions.length;
    const avgGrade = studentData.length
      ? (
          studentData.reduce((acc, s) => acc + Number(s.avgScore), 0) /
          studentData.length
        ).toFixed(2)
      : 0;
    return { totalStudents, totalSubmissions, avgGrade };
  }, [studentData, submissions]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Classes & Students
        </h2>
        <p className="text-muted-foreground mt-1">
          View student performance and engagement across all classes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          [Users, BookOpen, Award].map((Icon, i) => (
            <Card key={i} className="clay-element bg-card/50 backdrop-blur-sm animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-3.5 bg-slate-200/80 rounded w-28" />
                <div className="h-4 w-4 bg-slate-200/80 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200/80 rounded w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="clay-element bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>
            <Card className="clay-element bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <BookOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              </CardContent>
            </Card>
            <Card className="clay-element bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Student Grade</CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgGrade}%</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8 rounded-xl clay-element border-slate-200"
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onChange={(e) =>
              table.getColumn("name")?.setFilterValue(e.target.value)
            }
          />
        </div>

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
            {allClassNames.map((name) => (
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

        {(table.getColumn("name")?.getFilterValue() ||
          table.getColumn("className")?.getFilterValue()) && (
          <Button
            variant="ghost"
            onClick={() => {
              table.getColumn("name")?.setFilterValue("");
              table.getColumn("className")?.setFilterValue("");
            }}
            className="text-slate-400 hover:text-red-500 text-xs px-2"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="border-none overflow-hidden">
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
                    {/* Student Name */}
                    <TableCell className="pl-5">
                      <div className="h-4 bg-slate-200/80 rounded w-36" />
                    </TableCell>
                    {/* Class */}
                    <TableCell className="pl-8">
                      <div className="h-5 bg-slate-200/80 rounded-full w-24" />
                    </TableCell>
                    {/* Submissions */}
                    <TableCell className="text-center">
                      <div className="h-4 bg-slate-200/80 rounded w-8 mx-auto" />
                    </TableCell>
                    {/* Avg. Grade */}
                    <TableCell className="pr-6">
                      <div className="h-4 bg-slate-200/80 rounded w-14 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-purple-50/20 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "name"
                          ? "pl-5"
                          : cell.column.id === "avgScore"
                            ? "pr-6"
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
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end space-x-2 py-4 px-1 border-t border-slate-100/50">
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
  );
}

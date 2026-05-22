import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import ClassTabs from "../components/ClassTabs";
import ResultsTable from "../components/ResultsTable";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { Button, buttonVariants } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import "./AppPages.css";
import { answerHasSelection } from "../lib/answerRecord";
import { notify } from "../lib/notify";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const teacherId = session?.user?.id;
  const [classes, setClasses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState("");

  useDocumentTitle(quizTitle ? `Results · ${quizTitle}` : "Results");

  useEffect(() => {
    (async () => {
      if (!teacherId || !id) {
        setQuizTitle("");
        setClasses([]);
        setQuestions([]);
        setSubmissions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: quizRow, error: quizError } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("id", id)
        .eq("teacher_id", teacherId)
        .maybeSingle();
      if (quizError) {
        notify.error("Failed to load quiz results.");
        setLoading(false);
        navigate("/dashboard/quizzes", { replace: true });
        return;
      }
      if (!quizRow) {
        notify.error("Quiz not found.");
        setLoading(false);
        navigate("/dashboard/quizzes", { replace: true });
        return;
      }
      const { data: cData, error: classError } = await supabase
        .from("quiz_classes")
        .select("*")
        .eq("quiz_id", id);
      const { data: qData, error: questionError } = await supabase
        .from("questions")
        .select("id, question_text, order_index")
        .eq("quiz_id", id)
        .order("order_index");
      const { data: sData, error: submissionError } = await supabase
        .from("submissions")
        .select("*, quiz_classes(class_name), answers(*)")
        .eq("quiz_id", id);
      const fetchError = classError || questionError || submissionError;
      if (fetchError) {
        notify.error("Failed to load quiz results.");
        setClasses([]);
        setQuestions([]);
        setSubmissions([]);
        setLoading(false);
        return;
      }
      setQuizTitle(quizRow.title ?? "");
      setClasses(cData ?? []);
      setQuestions(qData ?? []);
      setSubmissions(sData ?? []);
      setLoading(false);
    })();
  }, [id, teacherId, navigate]);

  const filteredSubs = useMemo(() => {
    return submissions.filter(
      (s) => active === "all" || s.quiz_class_id === active,
    );
  }, [active, submissions]);

  const startedCount = filteredSubs.length;
  const submittedCount = filteredSubs.filter((s) => s.submitted_at).length;

  const rows = useMemo(() => {
    return filteredSubs
      .map((s) => {
        const correct = (s.answers ?? []).filter(
          (a) => Number(a.score) > 0,
        ).length;
        const skipped = (s.answers ?? []).filter((a) => !answerHasSelection(a)).length;
        const totalAns = (s.answers ?? []).length;
        return { ...s, correct, skipped, wrong: totalAns - correct - skipped };
      })
      .sort((a, b) => Number(b.total_score ?? 0) - Number(a.total_score ?? 0));
  }, [filteredSubs]);

  const questionAnalysis = useMemo(() => {
    return questions.map((q, qi) => {
      const ansList = filteredSubs.flatMap((s) =>
        (s.answers ?? []).filter((a) => a.question_id === q.id),
      );
      const correct = ansList.filter((a) => Number(a.score) > 0).length;
      const skipped = ansList.filter((a) => !answerHasSelection(a)).length;
      const wrong = ansList.length - correct - skipped;
      const withChoice = ansList.filter((a) => answerHasSelection(a));
      const avgTime = withChoice.length
        ? withChoice.reduce((acc, a) => acc + Number(a.time_taken ?? 0), 0) /
          withChoice.length
        : 0;
      return {
        order: qi + 1,
        question_text: q.question_text,
        correct,
        wrong,
        skipped,
        avgTime: Number(avgTime.toFixed(2)),
      };
    });
  }, [filteredSubs, questions]);

  const analysisColumns = useMemo(
    () => [
      {
        accessorKey: "order",
        header: "#",
        cell: ({ row }) => (
          <div className="font-bold text-slate-400 pl-4">
            {row.getValue("order")}
          </div>
        ),
      },
      {
        accessorKey: "question_text",
        header: "Question",
        cell: ({ row }) => (
          <div className="font-medium text-slate-700 max-w-md truncate">
            {row.getValue("question_text")}
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
        accessorKey: "avgTime",
        header: "Avg time (s)",
        cell: ({ row }) => (
          <div className="font-mono text-slate-500 pr-4">
            {row.getValue("avgTime")}s
          </div>
        ),
      },
    ],
    [],
  );

  const analysisTable = useReactTable({
    data: questionAnalysis,
    columns: analysisColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const exportXlsx = () => {
    if (rows.length === 0) {
      notify.info("No submission data to export.");
      return;
    }
    const wb = XLSX.utils.book_new();

    const summaryRows = (
      active === "all" ? classes : classes.filter((c) => c.id === active)
    ).map((c) => {
      const classSubs = rows.filter((r) => r.quiz_class_id === c.id);
      const scores = classSubs.map((r) => Number(r.total_score ?? 0));
      return {
        Class: c.class_name,
        TotalStudents: classSubs.length,
        AvgScore: scores.length
          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
          : "0",
        HighestScore: scores.length ? Math.max(...scores) : 0,
        LowestScore: scores.length ? Math.min(...scores) : 0,
      };
    });
    const summary = XLSX.utils.json_to_sheet(
      summaryRows.length
        ? summaryRows
        : [
            {
              Class: "-",
              TotalStudents: 0,
              AvgScore: "0",
              HighestScore: 0,
              LowestScore: 0,
            },
          ],
    );

    const qHeaders = questions.map((_, i) => `Q${i + 1} Score`);
    const studentRows = rows.map((r) => {
      const byQ = {};
      questions.forEach((q, i) => {
        const ans = (r.answers ?? []).find((a) => a.question_id === q.id);
        byQ[`Q${i + 1} Score`] = ans ? Number(ans.score ?? 0).toFixed(2) : "";
      });
      return {
        StudentName: r.student_name,
        Class: r.quiz_classes?.class_name ?? "",
        ...Object.fromEntries(qHeaders.map((h) => [h, byQ[h] ?? ""])),
        TotalScore: Number(r.total_score ?? 0).toFixed(2),
        SubmittedAt: r.submitted_at,
      };
    });
    const student = XLSX.utils.json_to_sheet(studentRows);

    const analysisSheet = XLSX.utils.json_to_sheet(
      questionAnalysis.map((r) => ({
        QuestionNo: r.order,
        QuestionText: r.question_text,
        Correct: r.correct,
        Wrong: r.wrong,
        Skipped: r.skipped,
        AvgTimeUsed: r.avgTime,
      })),
    );

    XLSX.utils.book_append_sheet(wb, summary, "Summary");
    XLSX.utils.book_append_sheet(wb, student, "Student Results");
    XLSX.utils.book_append_sheet(wb, analysisSheet, "Question Analysis");
    XLSX.writeFile(wb, "quiz-results.xlsx");
    notify.success("Results exported to Excel.");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to={`/dashboard/quiz/${id}`}
          className="text-slate-500 flex text-sm gap-1 items-center cursor-pointer  hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to quiz
        </Link>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          onClick={exportXlsx}
        >
          Export to Excel
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-slate-700">
          Results of Quiz {submissions.title}
        </h2>
        <p className="text-sm text-slate-500">
          View and export student performance data.
        </p>
      </div>

      <ClassTabs classes={classes} active={active} onChange={setActive} />

      <div className="grid gap-6 md:grid-cols-3">
        {loading ? (
          ["Started", "Submitted", "Completion Rate"].map((label) => (
            <Card key={label} className="border-none shadow-sm clay-element bg-white/60 backdrop-blur-sm animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-3.5 bg-slate-200/80 rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-9 bg-slate-200/80 rounded w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-none shadow-sm clay-element bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-700">{startedCount}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm clay-element bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Submitted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{submittedCount}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm clay-element bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-700">
                  {startedCount ? Math.round((submittedCount / startedCount) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ResultsTable rows={rows} loading={loading} />

      <div className="min-w-0 max-w-full">
        <div className="pb-4">
          <div className="text-lg font-bold text-slate-700">
            Question Analysis
          </div>
          <div className="text-xs text-slate-500">
            Detailed performance breakdown per question.
          </div>
        </div>
        <div>
          <Table>
            <TableHeader className="bg-purple-100">
              {analysisTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`text-xs uppercase tracking-wider font-bold text-slate-700
                          ${header.id === "question_text" ? "pl-0" : ""}`}
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
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {/* # */}
                      <TableCell className="pl-0">
                        <div className="h-4 bg-slate-200/80 rounded w-5 ml-4" />
                      </TableCell>
                      {/* Question */}
                      <TableCell className="pl-0">
                        <div className="h-4 bg-slate-200/80 rounded w-64" />
                      </TableCell>
                      {/* Correct */}
                      <TableCell className="pl-[30px]">
                        <div className="h-5 bg-slate-200/80 rounded-full w-8" />
                      </TableCell>
                      {/* Wrong */}
                      <TableCell className="pl-7">
                        <div className="h-5 bg-slate-200/80 rounded-full w-8" />
                      </TableCell>
                      {/* Skipped */}
                      <TableCell className="pl-8">
                        <div className="h-5 bg-slate-200/80 rounded-full w-8" />
                      </TableCell>
                      {/* Avg time */}
                      <TableCell className="pl-10">
                        <div className="h-4 bg-slate-200/80 rounded w-12 pr-4" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : analysisTable.getRowModel().rows?.length ? (
                analysisTable.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-purple-50/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "correct"
                            ? "pl-[30px]"
                            : cell.column.id === "wrong"
                              ? "pl-7"
                              : cell.column.id === "skipped"
                                ? "pl-8"
                                : cell.column.id === "avgTime"
                                  ? "pl-10"
                                  : "pl-0"
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
                    colSpan={6}
                    className="text-center py-12 text-slate-400 font-medium"
                  >
                    No questions for this quiz.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4 px-1">
            <div className="flex-1 text-xs text-slate-500">
              Page {analysisTable.getState().pagination.pageIndex + 1} of{" "}
              {analysisTable.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => analysisTable.previousPage()}
              disabled={!analysisTable.getCanPreviousPage()}
              className="rounded-xl h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => analysisTable.nextPage()}
              disabled={!analysisTable.getCanNextPage()}
              className="rounded-xl h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

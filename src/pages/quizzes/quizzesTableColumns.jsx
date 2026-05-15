import { Button, buttonVariants } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Eye,
  BarChart,
  Trash2,
  Pause,
  Play,
  StopCircle,
  Copy,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import QuizStatusBadge from "./QuizStatusBadge";
import { getQuizStatus } from "./quizStatus";

export function createQuizzesColumns({
  navigate,
  setCloneSource,
  togglePause,
  stopQuiz,
  remove,
}) {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
          className="p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wider"
        >
          Title
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-slate-700">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "computedStatus",
      header: "Status",
      cell: ({ row }) => <QuizStatusBadge quiz={row.original} />,
    },
    {
      accessorKey: "window",
      header: "Window",
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="flex flex-col text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3" />{" "}
              {new Date(q.start_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1 opacity-70">
              to {new Date(q.end_at).toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "classNames",
      header: () => <div className="text-center">Classes</div>,
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="text-center">
            <Badge variant="outline" className="bg-white/50">
              {q.quiz_classes?.length ?? 0}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "questions",
      header: () => <div className="text-center">Questions</div>,
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="text-center">
            <Badge variant="outline" className="bg-white/50">
              {q.questions?.length ?? 0}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "submissions",
      header: () => <div className="text-center">Submissions</div>,
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="text-center">
            <Badge
              variant="secondary"
              className="bg-purple-100/50 text-purple-700 border-none"
            >
              {q.submissions?.length ?? 0}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const q = row.original;
        const status = getQuizStatus(q);
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({
                  variant: "ghost",
                  className: "h-8 w-8 p-0 text-slate-400 hover:text-purple-600",
                })}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-md border-purple-100"
              >
                <DropdownMenuItem
                  onClick={() => navigate(`/dashboard/quiz/${q.id}`)}
                  className="cursor-pointer rounded-sm gap-2 py-2"
                >
                  {status === "upcoming" ? (
                    <>
                      <Edit className="h-4 w-4 text-slate-600" /> Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 text-slate-600" /> View
                    </>
                  )}
                </DropdownMenuItem>
                {status !== "upcoming" && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/dashboard/quiz/${q.id}/results`)
                    }
                    className="cursor-pointer rounded-sm gap-2 py-2"
                  >
                    <BarChart className="h-4 w-4 text-slate-600" />
                    Results
                  </DropdownMenuItem>
                )}
                {(status === "active" || status === "paused") && (
                  <DropdownMenuItem
                    onClick={() => togglePause(q.id, q.is_paused)}
                    className="cursor-pointer gap-2 py-2 text-amber-600 focus:text-amber-600"
                  >
                    {q.is_paused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                    {q.is_paused ? "Resume" : "Pause"}
                  </DropdownMenuItem>
                )}
                {status === "active" && (
                  <DropdownMenuItem
                    onClick={() => stopQuiz(q.id)}
                    className="cursor-pointer gap-2 py-2 text-red-600"
                  >
                    <StopCircle className="h-4 w-4 text-red-600" />
                    Stop
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setCloneSource(q)}
                  className="cursor-pointer rounded-sm gap-2 py-2 text-purple-600 focus:text-purple-700"
                >
                  <Copy className="h-4 w-4" />
                  Clone
                </DropdownMenuItem>
                {(status === "upcoming" || status === "ended") && (
                  <DropdownMenuItem
                    onClick={() => remove(q)}
                    className="text-red-500 focus:text-red-600 cursor-pointer rounded-sm gap-2 py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

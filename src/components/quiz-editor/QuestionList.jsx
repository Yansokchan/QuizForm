import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, ArrowUp, ArrowDown, Edit2, Trash2 } from "lucide-react";

export function QuestionList({
  questions,
  isLocked,
  moveQuestion,
  startEditQuestion,
  removeQuestion,
}) {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-bold text-slate-700">
          Current Questions
        </Label>
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 border-none font-bold"
        >
          {questions.length} Total
        </Badge>
      </div>
      {questions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-slate-100 border-dashed rounded-2xl bg-slate-50/30">
          No questions added yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((q, qi) => (
            <div
              key={q.id}
              className={`group clay-element flex flex-col ${
                !isLocked ? "sm:flex-row sm:items-center" : ""
              } justify-between p-2 rounded-xl border border-slate-100 bg-white gap-1 transition-all`}
            >
              <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-purple-50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-purple-500 transition-colors shrink-0">
                    {qi + 1}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-slate-700 text-sm line-clamp-2">
                      {q.question_text}
                    </span>
                  </div>
                </div>
                <span className="flex items-center mr-[10px] text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full">
                  <Clock className="mr-1 h-3 w-3" /> {q.time_limit}s
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto transition-opacity">
                {!isLocked && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                      onClick={() => moveQuestion(qi, -1)}
                      disabled={qi === 0 || isLocked}
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                      onClick={() => moveQuestion(qi, 1)}
                      disabled={qi === questions.length - 1 || isLocked}
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-slate-100 mx-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                      onClick={() => startEditQuestion(q)}
                      disabled={isLocked}
                      title="Edit Question"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-lg"
                      onClick={() => removeQuestion(q.id)}
                      disabled={isLocked || questions.length <= 1}
                      title="Delete Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              {/* Show options in view mode */}
              {isLocked && q.options && q.options.length > 0 && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pr-2 pb-2">
                  {[...q.options]
                    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
                    .map((opt, oi) => (
                      <div
                        key={opt.id ?? oi}
                        className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
                          opt.is_correct
                            ? "bg-green-50 text-green-700 border border-green-200 font-semibold"
                            : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}
                      >
                        <span
                          className={`font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ${
                            opt.is_correct
                              ? "bg-green-200 text-green-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt.option_text}
                        {opt.is_correct && (
                          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-green-600">
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

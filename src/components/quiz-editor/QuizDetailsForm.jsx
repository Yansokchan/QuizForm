import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus, X, Lock, Eye } from "lucide-react";

export function QuizDetailsForm({
  quiz,
  setQuiz,
  classes,
  classInput,
  setClassInput,
  addClass,
  removeClass,
  classError,
  isLocked,
  quizEnded,
  isEdit,
  error,
}) {
  return (
    <div className="p-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-3xl font-bold text-slate-700 flex items-center gap-2">
          {isLocked ? quiz.title : isEdit ? "Edit Quiz" : "Create Quiz"}
        </h3>
        <p className="text-slate-500 text-sm">
          {isLocked
            ? `This quiz is currently ${quizEnded ? "ended" : "active"}. You can view its configuration below.`
            : "Configure the basic details and time window for your quiz."}
        </p>
      </div>

      <div className="space-y-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Quiz Title</Label>
            <Input
              placeholder="E.g. Midterm Exam"
              value={quiz.title}
              disabled={isLocked}
              className="rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Description</Label>
            <Input
              placeholder="Optional instructions or details"
              value={quiz.description ?? ""}
              disabled={isLocked}
              className="rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
              onChange={(e) =>
                setQuiz({ ...quiz, description: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 items-start md:grid-cols-3 gap-6">
          <div className="space-y-2 mt-[5px]">
            <Label className="text-slate-600 font-semibold">Classes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="E.g. E4"
                value={classInput}
                disabled={isLocked}
                className="rounded-xl border-slate-200"
                onChange={(e) => setClassInput(e.target.value)}
              />
              <Button
                onClick={addClass}
                disabled={!classInput.trim() || isLocked}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {classError && (
              <p className="text-sm font-medium text-destructive">
                {classError}
              </p>
            )}
            {classes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {classes.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="bg-purple-100/50 clay-element text-purple-700 border-none py-1.5 px-3 flex items-center gap-2 rounded-full font-medium"
                  >
                    {c.class_name}
                    <button
                      onClick={() => removeClass(c.id)}
                      disabled={isLocked}
                      className="hover:text-destructive focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Remove Class"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold text-sm">
              Start Window
            </Label>
            <Input
              type="datetime-local"
              disabled={isLocked}
              className="rounded-xl border-slate-200"
              value={quiz.start_at?.slice(0, 16) ?? ""}
              onChange={(e) => setQuiz({ ...quiz, start_at: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold text-sm">
              End Window
            </Label>
            <Input
              type="datetime-local"
              disabled={isLocked}
              className="rounded-xl border-slate-200"
              value={quiz.end_at?.slice(0, 16) ?? ""}
              onChange={(e) => setQuiz({ ...quiz, end_at: e.target.value })}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm font-medium text-destructive mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}

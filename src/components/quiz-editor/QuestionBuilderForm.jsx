import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Plus, Save } from "lucide-react";

export function QuestionBuilderForm({
  draft,
  setDraft,
  isLocked,
  editingQuestionId,
  questionError,
  addQuestion,
  resetDraft,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
        <div className="space-y-2 md:col-span-3">
          <Label className="text-slate-600 font-semibold text-sm">
            Question
          </Label>
          <Input
            placeholder="What is the capital of France?"
            disabled={isLocked}
            className="rounded-xl border-slate-200 bg-white"
            value={draft.question_text}
            onChange={(e) =>
              setDraft({ ...draft, question_text: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-600 font-semibold text-sm">
            Time (seconds)
          </Label>
          <Input
            type="number"
            min={10}
            max={300}
            disabled={isLocked}
            className="rounded-xl border-slate-200 bg-white"
            value={draft.time_limit}
            onChange={(e) => setDraft({ ...draft, time_limit: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-slate-600 font-semibold text-sm">
            Options & Correct Answer
          </Label>
          <div className="flex items-center gap-1 bg-slate-50 rounded-full p-0.5">
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  answerMode: "single",
                  correctSet: draft.correctSet.slice(0, 1),
                })
              }
              disabled={isLocked}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                draft.answerMode === "single"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Single Answer
            </button>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, answerMode: "multi" })}
              disabled={isLocked}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                draft.answerMode === "multi"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Multi Answer
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {draft.options.map((opt, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 bg-white border rounded-2xl p-[2px] transition-all ${
                draft.correctSet.includes(idx)
                  ? "border-purple-400 ring-2 ring-purple-400/10"
                  : "border-slate-100 hover:border-purple-200"
              }`}
            >
              <div className="relative flex items-center">
                <input
                  type={draft.answerMode === "single" ? "radio" : "checkbox"}
                  name="correctOpt"
                  className="w-4 h-4 ml-2 text-purple-600 focus:ring-purple-600 accent-purple-600 cursor-pointer"
                  checked={draft.correctSet.includes(idx)}
                  disabled={isLocked}
                  onChange={() => {
                    if (draft.answerMode === "single") {
                      setDraft({ ...draft, correctSet: [idx] });
                    } else {
                      const newSet = draft.correctSet.includes(idx)
                        ? draft.correctSet.filter((i) => i !== idx)
                        : [...draft.correctSet, idx];
                      setDraft({ ...draft, correctSet: newSet });
                    }
                  }}
                  title="Mark as correct answer"
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    draft.correctSet.includes(idx)
                      ? "bg-purple-100 text-purple-600"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <Input
                  className="h-9 border-none bg-transparent shadow-none px-1 text-sm font-medium text-slate-700 focus-visible:ring-0 focus-visible:border-transparent"
                  placeholder={`Option ${String.fromCharCode(65 + idx)}...`}
                  value={opt}
                  disabled={isLocked}
                  onChange={(e) => {
                    const copy = [...draft.options];
                    copy[idx] = e.target.value;
                    setDraft({ ...draft, options: copy });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {questionError && (
        <p className="text-sm font-medium text-destructive">{questionError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={addQuestion}
          disabled={isLocked}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
        >
          {editingQuestionId ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {editingQuestionId ? "Save Edits" : "Add Question"}
        </Button>
        {editingQuestionId && (
          <Button
            variant="ghost"
            onClick={resetDraft}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

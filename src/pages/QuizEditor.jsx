import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { toDatetimeLocalValue } from "../lib/datetime";
import { Button } from "../components/ui/button";
import { Save, CirclePlus } from "lucide-react";
import { QuizDetailsForm } from "../components/quiz-editor/QuizDetailsForm";
import { QuestionBuilderForm } from "../components/quiz-editor/QuestionBuilderForm";
import { QuestionList } from "../components/quiz-editor/QuestionList";
import { QuizLinkShare } from "../components/quiz-editor/QuizLinkShare";

const emptyQuestion = {
  question_text: "",
  time_limit: 30,
  options: ["", "", "", ""],
  correctSet: [0],
  answerMode: "single",
};

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const teacherId = session?.user?.id;
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
  });
  const [classes, setClasses] = useState([]);
  const [initialClasses, setInitialClasses] = useState([]);
  const [classInput, setClassInput] = useState("");
  const [questions, setQuestions] = useState([]);
  const [initialQuestions, setInitialQuestions] = useState([]);
  const [draft, setDraft] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [error, setError] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [classError, setClassError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyHint, setCopyHint] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);

  const isEdit = id && id !== "create";
  const isLocked = (quizStarted || quizEnded) && isEdit;

  const loadQuizData = useCallback(async () => {
    if (!isEdit) {
      setLoading(false);
      return;
    }
    if (!teacherId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (!data) {
      navigate("/dashboard/quizzes", { replace: true });
      return;
    }
    const { data: classData } = await supabase
      .from("quiz_classes")
      .select("*")
      .eq("quiz_id", id);
    const { data: qData } = await supabase
      .from("questions")
      .select("*, options(*)")
      .eq("quiz_id", id)
      .order("order_index");
    setQuiz({
      ...data,
      start_at: toDatetimeLocalValue(data.start_at),
      end_at: toDatetimeLocalValue(data.end_at),
    });
    setQuizStarted(new Date() >= new Date(data.start_at));
    setQuizEnded(new Date() > new Date(data.end_at));
    setClasses(classData ?? []);
    setInitialClasses(classData ?? []);
    const sorted = (qData ?? []).map((q) => ({
      ...q,
      options: [...(q.options ?? [])].sort((a, b) =>
        String(a.id).localeCompare(String(b.id)),
      ),
    }));
    setQuestions(sorted);
    setInitialQuestions(sorted);
    setLoading(false);
  }, [id, isEdit, teacherId, navigate]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  const saveQuiz = async () => {
    setError("");
    if (!quiz.title.trim()) {
      setError("Quiz title is required.");
      return;
    }
    if (!quiz.start_at || !quiz.end_at) {
      setError("Start and end date/time are required.");
      return;
    }
    const startAt = new Date(quiz.start_at);
    const endAt = new Date(quiz.end_at);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setError("Invalid date/time format.");
      return;
    }
    if (startAt >= endAt) {
      setError("Start time must be before end time.");
      return;
    }

    setSaving(true);
    if (!isEdit) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setSaving(false);
        setError("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const payload = {
        title: quiz.title.trim(),
        description: quiz.description?.trim() || null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        teacher_id: userId,
      };
      const { data, error: insertError } = await supabase
        .from("quizzes")
        .insert(payload)
        .select()
        .single();
      if (insertError) {
        setSaving(false);
        setError(`Unable to create quiz: ${insertError.message}`);
        return;
      }
      if (data?.id) {
        // Insert any classes added during creation
        if (classes.length > 0) {
          const toInsert = classes.map((c) => ({
            quiz_id: data.id,
            class_name: c.class_name,
          }));
          await supabase.from("quiz_classes").insert(toInsert);
        }

        // Insert Questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const { data: newQData } = await supabase
            .from("questions")
            .insert({
              quiz_id: data.id,
              question_text: q.question_text,
              time_limit: q.time_limit,
              order_index: i,
            })
            .select()
            .single();

          if (newQData) {
            const dbQid = newQData.id;
            const optsToInsert = q.options.map((opt) => ({
              question_id: dbQid,
              option_text: opt.option_text,
              is_correct: opt.is_correct,
            }));
            await supabase.from("options").insert(optsToInsert);
          }
        }

        navigate(`/dashboard/quiz/${data.id}`);
      }
      setSaving(false);
      return;
    }
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        title: quiz.title.trim(),
        description: quiz.description?.trim() || null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setSaving(false);
      setError(`Unable to update quiz: ${updateError.message}`);
    } else {
      // Sync classes
      const initialIds = initialClasses.map((c) => c.id);
      const currentIds = classes.map((c) => c.id);

      const toDelete = initialIds.filter((cid) => !currentIds.includes(cid));
      const toInsert = classes
        .filter((c) => c.isNew)
        .map((c) => ({ quiz_id: id, class_name: c.class_name }));

      if (toDelete.length > 0) {
        await supabase.from("quiz_classes").delete().in("id", toDelete);
      }
      if (toInsert.length > 0) {
        await supabase.from("quiz_classes").insert(toInsert);
      }

      // Sync Questions
      const initialQIds = initialQuestions.map((q) => q.id);
      const currentQIds = questions.map((q) => q.id);

      const qsToDelete = initialQIds.filter(
        (qid) => !currentQIds.includes(qid),
      );
      if (qsToDelete.length > 0) {
        await supabase.from("questions").delete().in("id", qsToDelete);
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const isNewQ = String(q.id).startsWith("temp-");
        let dbQid = q.id;

        if (isNewQ) {
          const { data: newQData } = await supabase
            .from("questions")
            .insert({
              quiz_id: id,
              question_text: q.question_text,
              time_limit: q.time_limit,
              order_index: i,
            })
            .select()
            .single();

          if (newQData) {
            dbQid = newQData.id;
            const optsToInsert = q.options.map((opt) => ({
              question_id: dbQid,
              option_text: opt.option_text,
              is_correct: opt.is_correct,
            }));
            await supabase.from("options").insert(optsToInsert);
          }
        } else {
          await supabase
            .from("questions")
            .update({
              question_text: q.question_text,
              time_limit: q.time_limit,
              order_index: i,
            })
            .eq("id", dbQid);

          // Update existing options
          for (let opt of q.options) {
            if (opt.id) {
              await supabase
                .from("options")
                .update({
                  option_text: opt.option_text,
                  is_correct: opt.is_correct,
                })
                .eq("id", opt.id);
            } else {
              await supabase.from("options").insert({
                question_id: dbQid,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
              });
            }
          }
        }
      }

      setSaving(false);
      await loadQuizData();
    }
  };

  const addClass = () => {
    setClassError("");
    const name = classInput.trim();
    if (!name) return;
    const dup = classes.some(
      (c) => c.class_name.toLowerCase() === name.toLowerCase(),
    );
    if (dup) {
      setClassError("That class is already added for this quiz.");
      return;
    }
    setClasses([
      ...classes,
      { id: `temp-${Date.now()}`, class_name: name, isNew: true },
    ]);
    setClassInput("");
  };

  const removeClass = (classId) => {
    setClassError("");
    setClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  const validateDraft = () => {
    if (!draft.question_text.trim()) return "Question text is required.";
    const tl = Number(draft.time_limit);
    if (!Number.isInteger(tl) || tl < 10 || tl > 300)
      return "Time limit must be an integer between 10 and 300 seconds.";
    for (let i = 0; i < draft.options.length; i += 1) {
      if (!draft.options[i].trim())
        return "All four answer options are required.";
    }
    if (!draft.correctSet || draft.correctSet.length === 0)
      return "Select at least one correct answer.";
    return "";
  };

  const resetDraft = () => {
    setDraft(emptyQuestion);
    setEditingQuestionId(null);
    setQuestionError("");
  };

  const startEditQuestion = (q) => {
    const opts = [...(q.options ?? [])].sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    );
    const correctIndices = opts
      .map((o, i) => (o.is_correct ? i : -1))
      .filter((i) => i >= 0);
    const mode = correctIndices.length > 1 ? "multi" : "single";
    setDraft({
      question_text: q.question_text,
      time_limit: q.time_limit,
      options:
        opts.length === 4
          ? opts.map((o) => o.option_text)
          : [...opts.map((o) => o.option_text), "", "", "", ""].slice(0, 4),
      correctSet: correctIndices.length > 0 ? correctIndices : [0],
      answerMode: mode,
    });
    setEditingQuestionId(q.id);
    setQuestionError("");
  };

  const addQuestion = () => {
    setQuestionError("");
    const msg = validateDraft();
    if (msg) {
      setQuestionError(msg);
      return;
    }

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === editingQuestionId) {
            return {
              ...q,
              question_text: draft.question_text.trim(),
              time_limit: Number(draft.time_limit),
              options: draft.options.map((opt, idx) => ({
                id: q.options && q.options[idx] ? q.options[idx].id : undefined,
                option_text: opt.trim(),
                is_correct: draft.correctSet.includes(idx),
              })),
            };
          }
          return q;
        }),
      );
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          id: `temp-q-${Date.now()}`,
          quiz_id: id,
          question_text: draft.question_text.trim(),
          time_limit: Number(draft.time_limit),
          order_index: prev.length,
          options: draft.options.map((opt, idx) => ({
            option_text: opt.trim(),
            is_correct: draft.correctSet.includes(idx),
          })),
        },
      ]);
    }
    resetDraft();
  };

  const removeQuestion = (questionId) => {
    setQuestionError("");
    if (questions.length <= 1) {
      setQuestionError("A quiz must have at least one question.");
      return;
    }
    if (editingQuestionId === questionId) resetDraft();
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const moveQuestion = (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= questions.length) return;
    setQuestions((prev) => {
      const reordered = [...prev];
      const [removed] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, removed);
      return reordered.map((q, i) => ({ ...q, order_index: i }));
    });
  };

  const copyPublicLink = async () => {
    if (questions.length === 0 || !quiz.public_token) return;
    const url = `${window.location.origin}/q/${quiz.public_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyHint("Copied!");
      setTimeout(() => setCopyHint(""), 2000);
    } catch {
      setCopyHint("Copy failed — select the link manually.");
    }
  };

  const publicUrl =
    questions.length > 0 && quiz.public_token
      ? `${window.location.origin}/q/${quiz.public_token}`
      : "";

  const hasRequiredFields =
    quiz.title.trim().length > 0 &&
    quiz.start_at &&
    quiz.end_at &&
    classes.length > 0 &&
    questions.length > 0;

  // ── Skeleton UI ────────────────────────────────────────────────────
  const Sk = ({ className = "" }) => (
    <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />
  );

  if (loading && isEdit) {
    return (
      <div className="space-y-6 pb-12">
        {/* Quiz Details Card skeleton */}
        <div className="rounded-2xl bg-card/50 backdrop-blur-sm space-y-5">
          <div className="space-y-1">
            <Sk className="h-5 w-32" />
            <Sk className="h-3 w-64" />
          </div>
          {/* Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Sk className="h-3.5 w-20" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Sk className="h-3.5 w-20" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
          </div>
          {/* Dates row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Sk className="h-3.5 w-20" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Sk className="h-3.5 w-20" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Sk className="h-3.5 w-20" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
          </div>
          {/* Classes */}
          <div className="space-y-2">
            <Sk className="h-3.5 w-16" />
            <div className="flex gap-2">
              <Sk className="h-6 w-20 rounded-full" />
              <Sk className="h-6 w-24 rounded-full" />
              <Sk className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>

        {/* Question section header */}
        <div className="border-t border-slate-100 pt-6 space-y-1">
          <Sk className="h-5 w-40" />
          <Sk className="h-3.5 w-72" />
        </div>

        {/* Question cards */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-card/50 p-4 animate-pulse"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Sk className="h-4 w-3/4" />
                  <Sk className="h-3 w-24" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Sk className="h-8 w-8 rounded-lg" />
                  <Sk className="h-8 w-8 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[...Array(4)].map((_, j) => (
                  <Sk key={j} className="h-8 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <QuizDetailsForm
        quiz={quiz}
        setQuiz={setQuiz}
        classes={classes}
        classInput={classInput}
        setClassInput={setClassInput}
        addClass={addClass}
        removeClass={removeClass}
        classError={classError}
        isLocked={isLocked}
        quizEnded={quizEnded}
        isEdit={isEdit}
        error={error}
      />

      <div className="border-t border-slate-100">
        <div className="pt-6 flex flex-col gap-1">
          <h3 className="text-lg font-bold text-slate-700">
            {isLocked ? "Questions" : "Question Builder"}
          </h3>
          <p className="text-slate-500 text-sm">
            {isLocked
              ? "Review the questions configured for this quiz."
              : "Draft questions with 4 options. Choose single or multiple correct answers."}
          </p>
        </div>
        <div className="space-y-4 pb-6">
          {!isLocked && (
            <QuestionBuilderForm
              draft={draft}
              setDraft={setDraft}
              isLocked={isLocked}
              editingQuestionId={editingQuestionId}
              questionError={questionError}
              addQuestion={addQuestion}
              resetDraft={resetDraft}
            />
          )}
          <QuestionList
            questions={questions}
            isLocked={isLocked}
            moveQuestion={moveQuestion}
            startEditQuestion={startEditQuestion}
            removeQuestion={removeQuestion}
          />
        </div>
        <div className="border-b border-slate-100"></div>
        {isEdit && (
          <QuizLinkShare
            questions={questions}
            publicUrl={publicUrl}
            copyPublicLink={copyPublicLink}
          />
        )}
      </div>

      {!isLocked && (
        <div className="py-6">
          <Button
            onClick={saveQuiz}
            disabled={saving || !hasRequiredFields}
            className="w-full py-5 px-9 sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50"
          >
            {isEdit ? (
              <Save className="h-4 w-4 mr-1" />
            ) : (
              <CirclePlus className="h-4 w-4 mr-1" />
            )}{" "}
            {saving ? "Saving..." : isEdit ? "Update Quiz" : "Create Quiz"}
          </Button>
        </div>
      )}
    </div>
  );
}

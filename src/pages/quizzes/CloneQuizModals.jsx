import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, X, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { notify } from "../../lib/notify";
import "../AppPages.css";

function showFormError(setFormError, message) {
  setFormError(message);
  notify.error(message);
}

export function CloneQuizDialog({ sourceQuiz, onClose, onSuccess }) {
  const [title, setTitle] = useState(`Copy of ${sourceQuiz.title}`);
  const [description, setDescription] = useState(sourceQuiz.description || "");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [classes, setClasses] = useState(
    (sourceQuiz.quiz_classes || []).map((c) => ({
      name: c.class_name,
      isExisting: true,
    })),
  );
  const [classInput, setClassInput] = useState("");
  const [classError, setClassError] = useState("");
  const [cloning, setCloning] = useState(false);
  const [formError, setFormError] = useState("");
  const overlayRef = useRef(null);

  const addNewClass = () => {
    setClassError("");
    const name = classInput.trim();
    if (!name) return;
    if (classes.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      const msg = "Class already added.";
      setClassError(msg);
      notify.error(msg);
      return;
    }
    setClasses((p) => [...p, { name, isExisting: false }]);
    setClassInput("");
  };

  const removeClz = (name) =>
    setClasses((p) => p.filter((c) => c.name !== name));

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleClone = async () => {
    setFormError("");
    if (!title.trim()) {
      showFormError(setFormError, "Quiz title is required.");
      return;
    }
    if (!startAt || !endAt) {
      showFormError(setFormError, "Start and end date/time are required.");
      return;
    }
    const s = new Date(startAt);
    const en = new Date(endAt);
    if (s >= en) {
      showFormError(setFormError, "Start time must be before end time.");
      return;
    }
    if (classes.length === 0) {
      showFormError(setFormError, "Add at least one class.");
      return;
    }

    setCloning(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        showFormError(setFormError, "Session expired. Please log in.");
        setCloning(false);
        return;
      }

      const { data: newQuiz, error: quizErr } = await supabase
        .from("quizzes")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          start_at: s.toISOString(),
          end_at: en.toISOString(),
          teacher_id: userId,
        })
        .select()
        .single();
      if (quizErr) throw new Error(quizErr.message);

      if (classes.length > 0) {
        await supabase.from("quiz_classes").insert(
          classes.map((c) => ({ quiz_id: newQuiz.id, class_name: c.name })),
        );
      }

      const { data: origQuestions } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", sourceQuiz.id)
        .order("order_index");

      for (const q of origQuestions || []) {
        const { data: newQ } = await supabase
          .from("questions")
          .insert({
            quiz_id: newQuiz.id,
            question_text: q.question_text,
            time_limit: q.time_limit,
            order_index: q.order_index,
          })
          .select()
          .single();
        if (newQ && q.options?.length) {
          await supabase.from("options").insert(
            q.options.map((o) => ({
              question_id: newQ.id,
              option_text: o.option_text,
              is_correct: o.is_correct,
            })),
          );
        }
      }

      onSuccess(newQuiz.id, title.trim());
    } catch (err) {
      showFormError(
        setFormError,
        err.message || "Clone failed. Please try again.",
      );
      setCloning(false);
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="cq-overlay"
    >
      <div className="cq-dialog">
        <div className="cq-header">
          <div className="cq-icon">
            <Copy size={17} />
          </div>
          <div className="cq-h-text">
            <h2>Clone quiz</h2>
            <p>
              Duplicating: <em>{sourceQuiz.title}</em>
            </p>
          </div>
          <button className="cq-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="cq-body">
          <div>
            <label className="cq-label" htmlFor="cq-title">
              Quiz title<span className="cq-req">*</span>
            </label>
            <input
              id="cq-title"
              className="cq-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter new quiz title"
            />
          </div>

          <div>
            <label className="cq-label" htmlFor="cq-desc">
              Description
            </label>
            <textarea
              id="cq-desc"
              className="cq-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this quiz about?"
            />
          </div>

          <div>
            <label className="cq-label">
              Classes<span className="cq-req">*</span>
            </label>
            <div className="cq-tags">
              {classes.length === 0 ? (
                <span className="cq-tag-empty">No classes added yet.</span>
              ) : (
                classes.map((c) => (
                  <span key={c.name} className="cq-tag">
                    {c.name}
                    <button
                      type="button"
                      onClick={() => removeClz(c.name)}
                      aria-label={`Remove ${c.name}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="cq-add-row">
              <input
                className="cq-input"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addNewClass())
                }
                placeholder="Add class name…"
              />
              <button type="button" className="cq-add-btn" onClick={addNewClass}>
                Add
              </button>
            </div>
            {classError && <p className="cq-err-inline">{classError}</p>}
          </div>

          <div className="flex flex-col md:flex-row gap-2 justify-between">
            <div>
              <label className="cq-label" htmlFor="cq-start">
                Start window<span className="cq-req">*</span>
              </label>
              <input
                type="datetime-local"
                id="cq-start"
                className="cq-input"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className="cq-label" htmlFor="cq-end">
                End window<span className="cq-req">*</span>
              </label>
              <input
                type="datetime-local"
                id="cq-end"
                className="cq-input"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <div className="cq-err-block">
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{formError}</span>
            </div>
          )}
        </div>

        <div className="cq-footer">
          <button
            type="button"
            className="cq-btn-cancel"
            onClick={onClose}
            disabled={cloning}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cq-btn-primary"
            onClick={handleClone}
            disabled={cloning}
          >
            {cloning ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Cloning…
              </>
            ) : (
              <>
                <Copy size={15} /> Clone quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

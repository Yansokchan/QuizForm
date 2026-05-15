import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";

export function QuizLinkShare({ questions, publicUrl, copyPublicLink }) {
  return (
    <div>
      <div className="py-6 flex flex-col gap-1">
        <h3 className="text-lg font-bold text-slate-700">Quiz Link</h3>
        <p className="text-slate-500 text-sm">
          Share this link with your students. They will need to select their
          class to take it.
        </p>
      </div>
      <div className="border-b border-slate-100 pb-6">
        {questions.length > 0 ? (
          <div className="flex gap-2 items-center">
            <div className="relative flex-[0.7]">
              <Input
                readOnly
                value={publicUrl}
                className="bg-slate-50 clay-element border-slate-100 font-mono text-[13px] rounded-xl pr-10 focus-visible:ring-0"
              />
            </div>
            <Button
              onClick={copyPublicLink}
              className="rounded-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
          </div>
        ) : (
          <div className="text-center py-10 px-6 border border-slate-100 border-dashed rounded-2xl bg-slate-50/50">
            <p className="text-sm text-slate-400 font-medium">
              Add at least one question to generate a shareable link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

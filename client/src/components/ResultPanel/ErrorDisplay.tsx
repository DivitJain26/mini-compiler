import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CompilerError } from "../../types/compiler";

interface ErrorDisplayProps {
  errors: CompilerError[];
  wasCompiled: boolean;
}

export default function ErrorDisplay({ errors, wasCompiled }: ErrorDisplayProps) {
  if (!wasCompiled) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
        <AlertTriangle className="w-12 h-12 opacity-30" />
        <p className="text-sm">Compile your code to check for errors</p>
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <CheckCircle2 className="w-12 h-12 text-green-500/60" />
        <p className="text-sm text-green-600 dark:text-green-400">No errors found — compilation successful</p>
      </div>
    );
  }

  const lexicalErrors = errors.filter((e) => e.kind === "Lexical");
  const syntaxErrors = errors.filter((e) => e.kind === "Syntax");
  const semanticErrors = errors.filter((e) => e.kind === "Semantic");

  return (
    <div className="overflow-auto h-full p-4 space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900/50">
        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
        <span className="text-red-700 dark:text-red-300 text-sm font-medium">
          {errors.length} error{errors.length > 1 ? "s" : ""} detected
        </span>
        <div className="flex gap-3 ml-auto text-xs">
          {lexicalErrors.length > 0 && (
            <span className="text-amber-600 dark:text-amber-400">{lexicalErrors.length} Lexical</span>
          )}
          {syntaxErrors.length > 0 && (
            <span className="text-rose-600 dark:text-rose-400">{syntaxErrors.length} Syntax</span>
          )}
          {semanticErrors.length > 0 && (
            <span className="text-amber-600 dark:text-amber-400">{semanticErrors.length} Semantic</span>
          )}
        </div>
      </div>

      {/* Error list */}
      <div className="space-y-2">
        {errors.map((err, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${
              err.kind === "Lexical"
                ? "bg-amber-50 border-amber-200 hover:border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/40 dark:hover:border-amber-800/50"
                : err.kind === "Syntax"
                ? "bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-950/30 dark:border-red-900/40 dark:hover:border-red-800/50"
                : "bg-amber-50 border-amber-200 hover:border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/40 dark:hover:border-amber-800/50"
            }`}
          >
            {/* Kind badge */}
            <span
              className={`mt-0.5 shrink-0 inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono border ${
                err.kind === "Lexical"
                  ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
                  : err.kind === "Syntax"
                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
                  : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
              }`}
            >
              {err.kind}
            </span>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-mono ${
                  err.kind === "Lexical" ? "text-amber-800 dark:text-amber-200" 
                  : err.kind === "Syntax" ? "text-red-800 dark:text-red-200" 
                  : "text-amber-800 dark:text-amber-200"
                }`}
              >
                {err.message}
              </p>
            </div>

            {/* Line number pill */}
            <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 text-xs font-mono">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              {err.line}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

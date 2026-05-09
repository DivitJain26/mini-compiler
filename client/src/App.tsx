import { useState, useEffect } from "react";
import Editor, { SAMPLE_CODE } from "./components/Editor";
import ResultPanel from "./components/ResultPanel";
import Header from "./components/Header";
import { useCompiler } from "./hooks/useCompiler";

type Theme = "dark" | "light";

export default function App() {
  const [code, setCode] = useState<string>(SAMPLE_CODE);
  const { result, status, networkError, compile } = useCompiler();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("minilang-theme");
    return (saved as Theme) || "dark";
  });

  useEffect(() => {
    localStorage.setItem("minilang-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const wasCompiled = status === "success" || status === "error";
  const hasErrors =
    (result?.errors.length ?? 0) > 0 || status === "error";

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 overflow-hidden transition-colors">
      <Header
        onCompile={() => compile(code)}
        isLoading={status === "loading"}
        hasErrors={hasErrors}
        wasCompiled={wasCompiled}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Network / server error banner */}
      {networkError && (
        <div className="shrink-0 flex items-center gap-3 px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-600 dark:bg-red-950/60 dark:border-red-900/60 dark:text-red-300 text-sm">
          <svg className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97l-6.94-12a2 2 0 00-3.5 0l-6.94 12A2 2 0 005.07 19z" />
          </svg>
          <span className="font-medium">Backend unreachable —</span>
          <span className="text-red-500/90 dark:text-red-400/80">{networkError}</span>
          <span className="ml-auto text-red-400/70 dark:text-red-500/60 text-xs">
            Make sure the Flask server is running on port 5000
          </span>
        </div>
      )}

      {/* Main layout */}
      <main className="flex-1 flex gap-0 overflow-hidden">
        {/* Left: editor */}
        <div className="flex flex-col w-1/2 border-r border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <span className="text-slate-500 text-xs font-mono ml-2">main.mini</span>
            <span className="ml-auto text-slate-400 dark:text-slate-600 text-xs">MiniLang</span>
          </div>
          <div className="flex-1 overflow-hidden bg-white dark:bg-[#0f172a]">
            <Editor value={code} onChange={setCode} theme={theme} />
          </div>
        </div>

        {/* Right: result panel */}
        <div className="flex flex-col w-1/2 p-3 bg-slate-50 dark:bg-slate-950">
          <ResultPanel result={result} wasCompiled={wasCompiled} />
        </div>
      </main>

      {/* Status bar */}
      <footer className="shrink-0 flex items-center justify-between px-5 py-1.5 bg-sky-600 text-white text-xs">
        <div className="flex items-center gap-4">
          <span className="font-medium opacity-90">MiniLang v1.0</span>
          <span className="opacity-60">·</span>
          <span className="opacity-90">6-Stage Compiler Pipeline</span>
        </div>
        <div className="flex items-center gap-4 opacity-90">
          {result && (
            <>
              <span>{result.tokens.length} tokens</span>
              <span className="opacity-40">·</span>
              <span>{result.tac.length} TAC</span>
              <span className="opacity-40">·</span>
              <span>{result.optimized_tac.length} Opt TAC</span>
              <span className="opacity-40">·</span>
              <span>{result.machine_code.length} ASM</span>
              <span className="opacity-40">·</span>
              <span className={result.errors.length > 0 ? "text-red-200 font-medium" : "text-green-200 font-medium"}>
                {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

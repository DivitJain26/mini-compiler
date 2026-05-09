import { Terminal, Cpu, Sun, Moon } from "lucide-react";

interface HeaderProps {
  onCompile: () => void;
  isLoading: boolean;
  hasErrors: boolean;
  wasCompiled: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export default function Header({ onCompile, isLoading, hasErrors, wasCompiled, theme, toggleTheme }: HeaderProps) {
  return (
    <header className="shrink-0 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700/60 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20">
          <Terminal className="w-5 h-5 text-sky-500 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 font-bold text-lg leading-tight tracking-tight">
            MiniLang<span className="text-sky-500 dark:text-sky-400"> Compiler</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-xs leading-none mt-0.5">
            Toy language · 6 Stages
          </p>
        </div>
      </div>

      {/* Status pill + toggle + compile */}
      <div className="flex items-center gap-3">
        {wasCompiled && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              hasErrors
                ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/50 dark:border-red-800/50 dark:text-red-400"
                : "bg-green-50 border-green-200 text-green-600 dark:bg-green-950/50 dark:border-green-800/50 dark:text-green-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasErrors ? "bg-red-500 dark:bg-red-400" : "bg-green-500 dark:bg-green-400 animate-pulse"
              }`}
            />
            {hasErrors ? "Compilation failed" : "Compilation successful"}
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={onCompile}
          disabled={isLoading}
          className="flex items-center gap-2.5 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-400/30"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Compiling…
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              Compile
            </>
          )}
        </button>
      </div>
    </header>
  );
}

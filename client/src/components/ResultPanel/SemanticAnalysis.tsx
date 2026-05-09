import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { SymbolEntry, CompilerError } from "../../types/compiler";

interface SemanticAnalysisProps {
  symbolTable: SymbolEntry[];
  semanticErrors: CompilerError[];
  wasCompiled: boolean;
}

const SCOPE_BADGE: Record<string, string> = {
  global: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700",
  block: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700",
  for: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
};

const TYPE_BADGE: Record<string, string> = {
  int: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  float: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  bool: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700",
};

export default function SemanticAnalysis({ symbolTable, semanticErrors, wasCompiled }: SemanticAnalysisProps) {
  if (!wasCompiled) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">Compile your code to see semantic analysis</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4 space-y-4">
      {/* Symbol Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Symbol Table</span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-600">{symbolTable.length} entries</span>
        </div>
        {symbolTable.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">No symbols declared</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Type</th>
                <th className="text-left px-4 py-2.5 font-medium">Scope</th>
                <th className="text-left px-4 py-2.5 font-medium w-16">Line</th>
              </tr>
            </thead>
            <tbody>
              {symbolTable.map((sym, i) => (
                <tr key={i} className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${i % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/50 dark:bg-transparent"}`}>
                  <td className="px-4 py-2 font-mono font-medium text-slate-800 dark:text-slate-200">{sym.name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium border ${TYPE_BADGE[sym.type] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"}`}>
                      {sym.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium border ${SCOPE_BADGE[sym.scope] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"}`}>
                      {sym.scope}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400 dark:text-slate-500 tabular-nums">{sym.declared_line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Semantic Errors / Success */}
      {semanticErrors.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {semanticErrors.length} semantic error{semanticErrors.length > 1 ? "s" : ""}
            </span>
          </div>
          {semanticErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40">
              <span className="mt-0.5 shrink-0 inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono border bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
                Semantic
              </span>
              <p className="flex-1 text-sm font-mono text-amber-800 dark:text-amber-200">{err.message}</p>
              <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-mono">
                L{err.line}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/40">
          <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-500/60" />
          <span className="text-sm text-green-700 dark:text-green-400">Semantic analysis passed — no type errors</span>
        </div>
      )}
    </div>
  );
}

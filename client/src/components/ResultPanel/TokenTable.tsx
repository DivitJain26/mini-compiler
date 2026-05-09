import type { Token, TokenType } from "../../types/compiler";

const TYPE_BADGE: Record<TokenType, string> = {
  KEYWORD:       "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/60 dark:text-sky-300 dark:border-sky-700",
  IDENTIFIER:    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/60 dark:text-slate-200 dark:border-slate-600",
  INT_LITERAL:   "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/60 dark:text-orange-300 dark:border-orange-700",
  FLOAT_LITERAL: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700",
  BOOL_LITERAL:  "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/60 dark:text-teal-300 dark:border-teal-700",
  OPERATOR:      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/60 dark:text-rose-300 dark:border-rose-700",
  DELIMITER:     "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-600",
  EOF:           "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-500 dark:border-zinc-700",
};

interface TokenTableProps {
  tokens: Token[];
}

export default function TokenTable({ tokens }: TokenTableProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">Compile your code to see tokens</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-2.5 font-medium w-10">#</th>
            <th className="text-left px-4 py-2.5 font-medium">Token Type</th>
            <th className="text-left px-4 py-2.5 font-medium">Value</th>
            <th className="text-left px-4 py-2.5 font-medium w-16">Line</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tok, i) => (
            <tr
              key={i}
              className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                i % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/50 dark:bg-transparent"
              }`}
            >
              <td className="px-4 py-2 text-slate-400 dark:text-slate-600 tabular-nums">{i + 1}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                    TYPE_BADGE[tok.type] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                  }`}
                >
                  {tok.type}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200 font-medium">
                {tok.value === "" ? (
                  <span className="text-slate-300 dark:text-slate-600 italic">∅</span>
                ) : (
                  tok.value
                )}
              </td>
              <td className="px-4 py-2 text-slate-400 dark:text-slate-500 tabular-nums">{tok.line}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

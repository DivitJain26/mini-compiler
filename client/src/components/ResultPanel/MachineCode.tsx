import type { ReactNode } from "react";

interface MachineCodeProps {
  instructions: string[];
}

function colorize(line: string): ReactNode {
  const trimmed = line.trim();

  // Comment
  if (trimmed.startsWith(";")) {
    return <span className="text-slate-400 dark:text-slate-600 italic">{line}</span>;
  }

  // LABEL
  if (trimmed.startsWith("LABEL ")) {
    const label = trimmed.slice(6);
    return (
      <>
        <span className="text-slate-400 dark:text-slate-500 font-semibold">LABEL </span>
        <span className="text-amber-500 dark:text-amber-400 font-bold">{label}</span>
      </>
    );
  }

  // Split into mnemonic + operands
  const parts = trimmed.split(/\s+/);
  const mnemonic = parts[0];
  const operands = parts.slice(1).join(" ");

  const mnemonicColors: Record<string, string> = {
    MOV: "text-sky-600 dark:text-sky-400",
    LOAD: "text-teal-600 dark:text-teal-400",
    STORE: "text-teal-600 dark:text-teal-400",
    ADD: "text-green-600 dark:text-green-400",
    SUB: "text-green-600 dark:text-green-400",
    MUL: "text-green-600 dark:text-green-400",
    DIV: "text-green-600 dark:text-green-400",
    CMP: "text-amber-600 dark:text-amber-400",
    JMP: "text-rose-500 dark:text-rose-400",
    JE: "text-rose-500 dark:text-rose-400",
    JNE: "text-rose-500 dark:text-rose-400",
    JL: "text-rose-500 dark:text-rose-400",
    JG: "text-rose-500 dark:text-rose-400",
    JLE: "text-rose-500 dark:text-rose-400",
    JGE: "text-rose-500 dark:text-rose-400",
    PRINT: "text-purple-600 dark:text-purple-400",
    HALT: "text-red-600 dark:text-red-500",
  };

  const mColor = mnemonicColors[mnemonic] || "text-slate-600 dark:text-slate-300";

  // Colorize operands: registers in one color, everything else in another
  const colorizedOperands = operands.split(",").map((op, i) => {
    const trimOp = op.trim();
    const isReg = /^R\d+$/.test(trimOp);
    const isLabel = /^(L\d+|_\w+)$/.test(trimOp);
    const isNumber = /^\d+(\.\d+)?$/.test(trimOp);
    let cls = "text-slate-700 dark:text-slate-200";
    if (isReg) cls = "text-pink-600 dark:text-pink-300 font-medium";
    if (isLabel) cls = "text-amber-500 dark:text-amber-300";
    if (isNumber) cls = "text-orange-500 dark:text-orange-300";
    return (
      <span key={i}>
        {i > 0 && <span className="text-slate-300 dark:text-slate-600">, </span>}
        <span className={cls}>{trimOp}</span>
      </span>
    );
  });

  return (
    <>
      <span className={`font-semibold ${mColor}`}>{mnemonic}</span>
      {operands && <span className="ml-2">{colorizedOperands}</span>}
    </>
  );
}

export default function MachineCode({ instructions }: MachineCodeProps) {
  if (instructions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">Machine code will appear here after compilation</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-500 font-mono ml-2">Register-Based Assembly</span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-600">{instructions.length} instructions</span>
        </div>
        <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
          <code>
            {instructions.map((line, i) => {
              const isLabel = line.trim().startsWith("LABEL ");
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 py-0.5 px-2 rounded transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isLabel ? "mt-2" : ""}`}
                >
                  <span className="select-none text-slate-300 dark:text-slate-700 tabular-nums text-xs pt-px min-w-[2.5rem] text-right shrink-0">
                    {i + 1}
                  </span>
                  <span>{colorize(line)}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

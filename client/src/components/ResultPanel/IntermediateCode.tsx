import type { ReactNode } from "react";

interface IntermediateCodeProps {
  instructions: string[];
}

function colorize(line: string): ReactNode {
  // Labels: "L0:"
  if (/^L\d+:$/.test(line.trim())) {
    return <span className="text-amber-400 font-bold">{line}</span>;
  }
  // goto
  if (/^goto /.test(line.trim())) {
    const [, label] = line.split(" ");
    return (
      <>
        <span className="text-rose-400 font-semibold">goto </span>
        <span className="text-amber-300">{label}</span>
      </>
    );
  }
  // if ... goto ...
  const ifMatch = line.match(/^(if )(.+?)( goto )(L\d+)$/);
  if (ifMatch) {
    return (
      <>
        <span className="text-sky-400 font-semibold">if </span>
        <span className="text-teal-300">{ifMatch[2]}</span>
        <span className="text-sky-400 font-semibold"> goto </span>
        <span className="text-amber-300">{ifMatch[4]}</span>
      </>
    );
  }
  // print
  if (/^print /.test(line.trim())) {
    const val = line.slice(6);
    return (
      <>
        <span className="text-green-400 font-semibold">print </span>
        <span className="text-slate-200">{val}</span>
      </>
    );
  }
  // return
  if (/^return/.test(line.trim())) {
    return <span className="text-rose-400 font-semibold">{line}</span>;
  }
  // Assignment: "x = ..."
  const assignMatch = line.match(/^(\S+)( = )(.+)$/);
  if (assignMatch) {
    const isTemp = /^t\d+$/.test(assignMatch[1]);
    return (
      <>
        <span className={isTemp ? "text-purple-300" : "text-sky-200"}>{assignMatch[1]}</span>
        <span className="text-slate-500"> = </span>
        <span className="text-slate-200">{assignMatch[3]}</span>
      </>
    );
  }

  return <span className="text-slate-300">{line}</span>;
}

export default function IntermediateCode({ instructions }: IntermediateCodeProps) {
  if (instructions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <p className="text-sm">Intermediate code will appear here after compilation</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/80 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700 bg-slate-800/60">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-slate-500 font-mono ml-2">Three-Address Code (TAC)</span>
          <span className="ml-auto text-xs text-slate-600">{instructions.length} instructions</span>
        </div>
        <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
          <code>
            {instructions.map((line, i) => {
              const isLabel = /^L\d+:$/.test(line.trim());
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 py-0.5 px-2 rounded transition-colors hover:bg-slate-800/40 ${
                    isLabel ? "mt-2" : ""
                  }`}
                >
                  <span className="select-none text-slate-700 tabular-nums text-xs pt-px min-w-[2rem] text-right shrink-0">
                    {isLabel ? "" : i + 1}
                  </span>
                  <span className={isLabel ? "" : "pl-4"}>{colorize(line)}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

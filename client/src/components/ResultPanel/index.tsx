import { useState } from "react";
import { Hash, Code2, AlertTriangle, TreePine, ShieldCheck, Zap, Cpu } from "lucide-react";
import TokenTable from "./TokenTable";
import SyntaxTree from "./SyntaxTree";
import SemanticAnalysis from "./SemanticAnalysis";
import IntermediateCode from "./IntermediateCode";
import OptimizedCode from "./OptimizedCode";
import MachineCode from "./MachineCode";
import ErrorDisplay from "./ErrorDisplay";
import type { CompileResult, ResultTab } from "../../types/compiler";

interface ResultPanelProps {
  result: CompileResult | null;
  wasCompiled: boolean;
}

interface Tab {
  id: ResultTab;
  label: string;
  Icon: React.ElementType;
  badge?: number;
  badgeVariant?: "default" | "error";
}

export default function ResultPanel({ result, wasCompiled }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("tokens");

  const errorCount = result?.errors.length ?? 0;

  const tabs: Tab[] = [
    {
      id: "tokens",
      label: "Lexical",
      Icon: Hash,
      badge: result?.tokens.length,
    },
    {
      id: "ast",
      label: "Syntax",
      Icon: TreePine,
    },
    {
      id: "semantics",
      label: "Semantic",
      Icon: ShieldCheck,
      badge: result?.semantic_errors?.length || undefined,
      badgeVariant: (result?.semantic_errors?.length ?? 0) > 0 ? "error" : "default",
    },
    {
      id: "tac",
      label: "IR Code",
      Icon: Code2,
      badge: result?.tac.length,
    },
    {
      id: "optimized",
      label: "Optimised",
      Icon: Zap,
      badge: result?.optimized_tac?.length,
    },
    {
      id: "machine",
      label: "Machine",
      Icon: Cpu,
      badge: result?.machine_code?.length,
    },
    {
      id: "errors",
      label: "Errors",
      Icon: AlertTriangle,
      badge: errorCount || undefined,
      badgeVariant: errorCount > 0 ? "error" : "default",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-2 pt-2 pb-0 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/40 shrink-0 overflow-x-auto">
        {tabs.map(({ id, label, Icon, badge, badgeVariant }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`group relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all select-none whitespace-nowrap ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-b-0 border-slate-200 dark:border-slate-700/80"
                  : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge !== undefined && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${
                    badgeVariant === "error"
                      ? "bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "tokens" && (
          <TokenTable tokens={result?.tokens ?? []} />
        )}
        {activeTab === "ast" && (
          <SyntaxTree ast={result?.ast ?? null} />
        )}
        {activeTab === "semantics" && (
          <SemanticAnalysis
            symbolTable={result?.symbol_table ?? []}
            semanticErrors={result?.semantic_errors ?? []}
            wasCompiled={wasCompiled}
          />
        )}
        {activeTab === "tac" && (
          <IntermediateCode instructions={result?.tac ?? []} />
        )}
        {activeTab === "optimized" && (
          <OptimizedCode
            instructions={result?.optimized_tac ?? []}
            originalInstructions={result?.tac ?? []}
          />
        )}
        {activeTab === "machine" && (
          <MachineCode instructions={result?.machine_code ?? []} />
        )}
        {activeTab === "errors" && (
          <ErrorDisplay
            errors={result?.errors ?? []}
            wasCompiled={wasCompiled}
          />
        )}
      </div>
    </div>
  );
}

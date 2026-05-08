import { useState } from "react";
import { Hash, Code2, AlertTriangle } from "lucide-react";
import TokenTable from "./TokenTable";
import IntermediateCode from "./IntermediateCode";
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
      label: "Tokens",
      Icon: Hash,
      badge: result?.tokens.length,
    },
    {
      id: "tac",
      label: "Intermediate Code",
      Icon: Code2,
      badge: result?.tac.length,
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
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-0 border-b border-slate-700/50 bg-slate-800/40 shrink-0">
        {tabs.map(({ id, label, Icon, badge, badgeVariant }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all select-none ${
                isActive
                  ? "bg-slate-900 text-slate-100 border border-b-0 border-slate-700/80"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge !== undefined && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${
                    badgeVariant === "error"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-slate-700 text-slate-400"
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
        {activeTab === "tac" && (
          <IntermediateCode instructions={result?.tac ?? []} />
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

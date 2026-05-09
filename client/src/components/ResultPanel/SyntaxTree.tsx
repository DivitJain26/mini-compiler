import { useState } from "react";
import type { ASTNode } from "../../types/compiler";
import { ChevronRight, ChevronDown } from "lucide-react";

interface SyntaxTreeProps {
  ast: ASTNode | null;
}

const NODE_COLORS: Record<string, string> = {
  Program: "text-purple-400 dark:text-purple-400",
  Block: "text-slate-400 dark:text-slate-400",
  DeclStmt: "text-sky-400 dark:text-sky-400",
  AssignStmt: "text-teal-400 dark:text-teal-400",
  AssignExpr: "text-teal-300 dark:text-teal-300",
  IfStmt: "text-amber-400 dark:text-amber-400",
  ForStmt: "text-orange-400 dark:text-orange-400",
  WhileStmt: "text-orange-300 dark:text-orange-300",
  PrintStmt: "text-green-400 dark:text-green-400",
  ReturnStmt: "text-rose-400 dark:text-rose-400",
  BinaryExpr: "text-pink-400 dark:text-pink-400",
  UnaryExpr: "text-pink-300 dark:text-pink-300",
  IntLiteral: "text-orange-300 dark:text-orange-300",
  FloatLiteral: "text-orange-300 dark:text-orange-300",
  BoolLiteral: "text-teal-300 dark:text-teal-300",
  Identifier: "text-slate-200 dark:text-slate-200",
  Error: "text-red-400 dark:text-red-400",
};

function getLabel(node: ASTNode): string {
  const t = node.type;
  if (t === "DeclStmt") return `DeclStmt (${node.var_type} ${node.name})`;
  if (t === "AssignStmt" || t === "AssignExpr") return `${t} (${node.name})`;
  if (t === "BinaryExpr") return `BinaryExpr (${node.op})`;
  if (t === "UnaryExpr") return `UnaryExpr (${node.op})`;
  if (t === "IntLiteral" || t === "FloatLiteral" || t === "BoolLiteral")
    return `${t} (${node.value})`;
  if (t === "Identifier") return `Identifier (${node.name})`;
  return t;
}

function getChildren(node: ASTNode): { label: string; child: ASTNode }[] {
  const entries: { label: string; child: ASTNode }[] = [];
  const skip = new Set(["type", "line"]);

  for (const [key, val] of Object.entries(node)) {
    if (skip.has(key)) continue;
    if (val === null || val === undefined) continue;
    if (typeof val === "object" && "type" in (val as object)) {
      entries.push({ label: key, child: val as ASTNode });
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === "object" && item !== null && "type" in item) {
          entries.push({ label: `${key}[${i}]`, child: item as ASTNode });
        }
      });
    }
  }
  return entries;
}

function TreeNode({ node, depth = 0 }: { node: ASTNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 3);
  const children = getChildren(node);
  const hasChildren = children.length > 0;
  const colorClass = NODE_COLORS[node.type] || "text-slate-300 dark:text-slate-300";

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors
          hover:bg-slate-100 dark:hover:bg-slate-800/50 group`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className={`font-mono text-sm font-semibold ${colorClass}`}>
          {getLabel(node)}
        </span>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
          L{node.line}
        </span>
      </div>
      {expanded &&
        children.map(({ label, child }, i) => (
          <div key={`${label}-${i}`}>
            {children.length > 1 && (
              <div
                className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-wider"
                style={{ paddingLeft: `${(depth + 1) * 20 + 28}px` }}
              >
                {label}
              </div>
            )}
            <TreeNode node={child} depth={depth + 1} />
          </div>
        ))}
    </div>
  );
}

export default function SyntaxTree({ ast }: SyntaxTreeProps) {
  if (!ast) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm4 8h8m-8 4h4" />
        </svg>
        <p className="text-sm">Compile your code to see the syntax tree</p>
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
          <span className="text-xs text-slate-500 dark:text-slate-500 font-mono ml-2">Abstract Syntax Tree</span>
        </div>
        <div className="py-2">
          <TreeNode node={ast} />
        </div>
      </div>
    </div>
  );
}

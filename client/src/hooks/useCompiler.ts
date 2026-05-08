import { useState, useCallback } from "react";
import { compileCode } from "../api/compiler";
import type { CompileResult } from "../types/compiler";

export type CompilerStatus = "idle" | "loading" | "success" | "error";

interface UseCompilerReturn {
  result: CompileResult | null;
  status: CompilerStatus;
  networkError: string | null;
  compile: (code: string) => Promise<void>;
}

export function useCompiler(): UseCompilerReturn {
  const [result, setResult] = useState<CompileResult | null>(null);
  const [status, setStatus] = useState<CompilerStatus>("idle");
  const [networkError, setNetworkError] = useState<string | null>(null);

  const compile = useCallback(async (code: string) => {
    setStatus("loading");
    setNetworkError(null);

    try {
      const data = await compileCode(code);
      setResult(data);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setNetworkError(msg);
      setStatus("error");
    }
  }, []);

  return { result, status, networkError, compile };
}

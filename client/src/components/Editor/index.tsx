import MonacoEditor, { OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";

const SAMPLE_CODE = `// MiniLang sample program
// Demonstrates: declarations, arithmetic, if/else, for, while, print

int a = 10;
int b = 25;
int sum = a + b;

// Conditional: check if sum > 30
if (sum > 30) {
    print(sum);
} else {
    int diff = b - a;
    print(diff);
}

// For loop: accumulate
int total = 0;
for (int i = 1; i <= 5; i = i + 1) {
    total = total + i;
}
print(total);

// While loop: halving
float x = 64.0;
while (x > 1.0) {
    x = x / 2.0;
}
print(x);

// Boolean expression
bool flag = true;
if (flag == true) {
    int result = a * b;
    print(result);
}

return 0;
`;

function registerMiniLang(monaco: typeof Monaco) {
  if (monaco.languages.getLanguages().some((l) => l.id === "minilang")) return;

  monaco.languages.register({ id: "minilang" });

  monaco.languages.setMonarchTokensProvider("minilang", {
    keywords: [
      "int", "float", "bool", "if", "else", "for", "while",
      "print", "return", "true", "false",
    ],
    operators: [
      "=", "+", "-", "*", "/", "<", ">", "<=", ">=", "==", "!=",
      "&&", "||", "!",
    ],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@blockComment"],
        [/\b(int|float|bool|if|else|for|while|print|return|true|false)\b/, "keyword"],
        [/[a-zA-Z_]\w*/, "identifier"],
        [/\d+\.\d*/, "number.float"],
        [/\d+/, "number"],
        [/[{}();,]/, "delimiter"],
        [/==|!=|<=|>=|&&|\|\|/, "operator"],
        [/[=+\-*/<>!]/, "operator"],
        [/\s+/, "white"],
      ],
      blockComment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
    },
  });

  monaco.editor.defineTheme("minilang-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
      { token: "identifier", foreground: "e2e8f0" },
      { token: "number", foreground: "fb923c" },
      { token: "number.float", foreground: "fb923c" },
      { token: "operator", foreground: "94a3b8" },
      { token: "delimiter", foreground: "64748b" },
      { token: "comment", foreground: "475569", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#0f172a",
      "editor.foreground": "#e2e8f0",
      "editor.lineHighlightBackground": "#1e293b",
      "editor.selectionBackground": "#334155",
      "editorCursor.foreground": "#38bdf8",
      "editorLineNumber.foreground": "#334155",
      "editorLineNumber.activeForeground": "#64748b",
      "editor.inactiveSelectionBackground": "#1e293b",
    },
  });
}

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const handleMount: OnMount = (_editor, monaco) => {
    registerMiniLang(monaco);
    monaco.editor.setTheme("minilang-dark");
  };

  return (
    <MonacoEditor
      height="100%"
      language="minilang"
      theme="minilang-dark"
      value={value}
      defaultValue={SAMPLE_CODE}
      beforeMount={(monaco) => registerMiniLang(monaco)}
      onMount={handleMount}
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: "active" },
      }}
    />
  );
}

export { SAMPLE_CODE };

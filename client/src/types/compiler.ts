export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "INT_LITERAL"
  | "FLOAT_LITERAL"
  | "BOOL_LITERAL"
  | "OPERATOR"
  | "DELIMITER"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

export type ErrorKind = "Lexical" | "Syntax" | "Semantic";

export interface CompilerError {
  kind: ErrorKind;
  message: string;
  line: number;
}

export interface ASTNode {
  type: string;
  line: number;
  [key: string]: unknown;
}

export interface SymbolEntry {
  name: string;
  type: string;
  scope: string;
  declared_line: number;
}

export interface CompileResult {
  tokens: Token[];
  ast: ASTNode;
  symbol_table: SymbolEntry[];
  semantic_errors: CompilerError[];
  tac: string[];
  optimized_tac: string[];
  machine_code: string[];
  errors: CompilerError[];
}

export type ResultTab =
  | "tokens"
  | "ast"
  | "semantics"
  | "tac"
  | "optimized"
  | "machine"
  | "errors";

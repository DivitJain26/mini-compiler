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

export type ErrorKind = "Lexical" | "Syntax";

export interface CompilerError {
  kind: ErrorKind;
  message: string;
  line: number;
}

export interface CompileResult {
  tokens: Token[];
  tac: string[];
  errors: CompilerError[];
}

export type ResultTab = "tokens" | "tac" | "errors";

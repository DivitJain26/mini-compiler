"""
Recursive-descent parser for MiniLang.
Produces Three-Address Code (TAC) via syntax-directed translation.

Grammar (simplified):
  program        → statement*
  statement      → decl_stmt | assign_stmt | if_stmt | for_stmt
                 | while_stmt | print_stmt | return_stmt | block
  decl_stmt      → type IDENTIFIER ('=' expr)? ';'
  assign_stmt    → IDENTIFIER '=' expr ';'
  if_stmt        → 'if' '(' condition ')' block ('else' block)?
  for_stmt       → 'for' '(' for_init condition ';' assign_expr ')' block
  while_stmt     → 'while' '(' condition ')' block
  print_stmt     → 'print' '(' expr ')' ';'
  return_stmt    → 'return' expr? ';'
  condition      → expr (relop expr)?
  expr           → term (('+' | '-') term)*
  term           → unary (('*' | '/') unary)*
  unary          → '-'? factor
  factor         → NUMBER | BOOL | IDENTIFIER | '(' expr ')'
"""

from typing import List, Tuple
from .lexer import Token
from .errors import CompilerError

RELOPS = frozenset({"==", "!=", "<", ">", "<=", ">="})
TYPE_KEYWORDS = frozenset({"int", "float", "bool"})


class _TACEmitter:
    def __init__(self) -> None:
        self.instructions: List[str] = []
        self._temp = 0
        self._label = 0

    def new_temp(self) -> str:
        name = f"t{self._temp}"
        self._temp += 1
        return name

    def new_label(self) -> str:
        name = f"L{self._label}"
        self._label += 1
        return name

    def emit(self, instr: str) -> None:
        self.instructions.append(instr)

    def emit_label(self, label: str) -> None:
        self.instructions.append(f"{label}:")


class Parser:
    def __init__(self, tokens: List[Token]) -> None:
        self._tokens = tokens
        self._pos = 0
        self._tac = _TACEmitter()
        self._errors: List[CompilerError] = []

    # ── Token navigation ────────────────────────────────────────────────────

    def _cur(self) -> Token:
        return self._tokens[self._pos]

    def _peek(self, offset: int = 1) -> Token:
        idx = self._pos + offset
        return self._tokens[min(idx, len(self._tokens) - 1)]

    def _advance(self) -> Token:
        tok = self._tokens[self._pos]
        if self._pos < len(self._tokens) - 1:
            self._pos += 1
        return tok

    def _match(self, type_: str, value: str = "") -> bool:
        t = self._cur()
        return t.type == type_ and (not value or t.value == value)

    def _expect(self, type_: str, value: str = "") -> Token:
        if self._match(type_, value):
            return self._advance()
        t = self._cur()
        expected = f"'{value}'" if value else type_
        self._errors.append(
            CompilerError("Syntax", f"Expected {expected} but got '{t.value}'", t.line)
        )
        return t  # return current without consuming (best-effort)

    def _sync(self) -> None:
        """Skip tokens until ';' or '}' for basic error recovery."""
        while not self._match("EOF"):
            if self._match("DELIMITER", ";"):
                self._advance()
                return
            if self._match("DELIMITER", "}"):
                return
            self._advance()

    # ── Public API ──────────────────────────────────────────────────────────

    def parse(self) -> Tuple[List[str], List[CompilerError]]:
        self._parse_program()
        return self._tac.instructions, self._errors

    # ── Statements ──────────────────────────────────────────────────────────

    def _parse_program(self) -> None:
        while not self._match("EOF"):
            self._parse_statement()

    def _parse_statement(self) -> None:
        t = self._cur()

        if t.type == "KEYWORD" and t.value in TYPE_KEYWORDS:
            self._parse_decl_stmt()
        elif t.type == "KEYWORD" and t.value == "if":
            self._parse_if_stmt()
        elif t.type == "KEYWORD" and t.value == "for":
            self._parse_for_stmt()
        elif t.type == "KEYWORD" and t.value == "while":
            self._parse_while_stmt()
        elif t.type == "KEYWORD" and t.value == "print":
            self._parse_print_stmt()
        elif t.type == "KEYWORD" and t.value == "return":
            self._parse_return_stmt()
        elif t.type == "IDENTIFIER" and self._peek().value == "=":
            self._parse_assign_stmt()
        elif t.type == "DELIMITER" and t.value == "{":
            self._parse_block()
        else:
            self._errors.append(
                CompilerError("Syntax", f"Unexpected token '{t.value}'", t.line)
            )
            self._advance()

    def _parse_decl_stmt(self) -> None:
        type_tok = self._advance()  # int / float / bool
        name_tok = self._cur()
        if not self._match("IDENTIFIER"):
            self._errors.append(
                CompilerError("Syntax", f"Expected identifier after '{type_tok.value}'", type_tok.line)
            )
            self._sync()
            return
        self._advance()  # consume identifier

        if self._match("OPERATOR", "="):
            self._advance()
            result = self._parse_expr()
            self._tac.emit(f"{name_tok.value} = {result}")

        self._expect("DELIMITER", ";")

    def _parse_assign_stmt(self) -> None:
        name = self._advance().value
        self._expect("OPERATOR", "=")
        result = self._parse_expr()
        self._tac.emit(f"{name} = {result}")
        self._expect("DELIMITER", ";")

    def _parse_if_stmt(self) -> None:
        self._advance()  # if
        self._expect("DELIMITER", "(")
        cond = self._parse_condition()
        self._expect("DELIMITER", ")")

        true_lbl = self._tac.new_label()
        false_lbl = self._tac.new_label()

        self._tac.emit(f"if {cond} goto {true_lbl}")
        self._tac.emit(f"goto {false_lbl}")
        self._tac.emit_label(true_lbl)

        self._parse_block()

        if self._match("KEYWORD", "else"):
            self._advance()
            end_lbl = self._tac.new_label()
            self._tac.emit(f"goto {end_lbl}")
            self._tac.emit_label(false_lbl)
            self._parse_block()
            self._tac.emit_label(end_lbl)
        else:
            self._tac.emit_label(false_lbl)

    def _parse_for_stmt(self) -> None:
        self._advance()  # for
        self._expect("DELIMITER", "(")

        # Init clause
        t = self._cur()
        if t.type == "KEYWORD" and t.value in TYPE_KEYWORDS:
            self._parse_decl_stmt()
        elif t.type == "IDENTIFIER" and self._peek().value == "=":
            self._parse_assign_stmt()
        else:
            self._expect("DELIMITER", ";")

        start_lbl = self._tac.new_label()
        body_lbl = self._tac.new_label()
        end_lbl = self._tac.new_label()

        self._tac.emit_label(start_lbl)

        # Condition clause
        cond = self._parse_condition()
        self._expect("DELIMITER", ";")
        self._tac.emit(f"if {cond} goto {body_lbl}")
        self._tac.emit(f"goto {end_lbl}")

        # Update clause — buffer into temporary list
        saved = self._tac.instructions
        self._tac.instructions = []
        if not self._match("DELIMITER", ")"):
            upd_name = self._cur()
            if upd_name.type == "IDENTIFIER" and self._peek().value == "=":
                name = self._advance().value
                self._advance()  # =
                result = self._parse_expr()
                self._tac.emit(f"{name} = {result}")
        update_code = self._tac.instructions
        self._tac.instructions = saved

        self._expect("DELIMITER", ")")

        self._tac.emit_label(body_lbl)
        self._parse_block()

        for instr in update_code:
            self._tac.emit(instr)
        self._tac.emit(f"goto {start_lbl}")
        self._tac.emit_label(end_lbl)

    def _parse_while_stmt(self) -> None:
        self._advance()  # while
        self._expect("DELIMITER", "(")

        start_lbl = self._tac.new_label()
        body_lbl = self._tac.new_label()
        end_lbl = self._tac.new_label()

        self._tac.emit_label(start_lbl)
        cond = self._parse_condition()
        self._expect("DELIMITER", ")")
        self._tac.emit(f"if {cond} goto {body_lbl}")
        self._tac.emit(f"goto {end_lbl}")
        self._tac.emit_label(body_lbl)

        self._parse_block()

        self._tac.emit(f"goto {start_lbl}")
        self._tac.emit_label(end_lbl)

    def _parse_print_stmt(self) -> None:
        self._advance()  # print
        self._expect("DELIMITER", "(")
        result = self._parse_expr()
        self._expect("DELIMITER", ")")
        self._tac.emit(f"print {result}")
        self._expect("DELIMITER", ";")

    def _parse_return_stmt(self) -> None:
        self._advance()  # return
        if not self._match("DELIMITER", ";"):
            result = self._parse_expr()
            self._tac.emit(f"return {result}")
        else:
            self._tac.emit("return")
        self._expect("DELIMITER", ";")

    def _parse_block(self) -> None:
        self._expect("DELIMITER", "{")
        while not self._match("DELIMITER", "}") and not self._match("EOF"):
            self._parse_statement()
        self._expect("DELIMITER", "}")

    # ── Expressions ─────────────────────────────────────────────────────────

    def _parse_condition(self) -> str:
        left = self._parse_expr()

        if self._cur().type == "OPERATOR" and self._cur().value in RELOPS:
            op = self._advance().value
            right = self._parse_expr()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = {left} {op} {right}")
            return tmp

        return left

    def _parse_expr(self) -> str:
        left = self._parse_term()

        while self._cur().type == "OPERATOR" and self._cur().value in ("+", "-"):
            op = self._advance().value
            right = self._parse_term()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = {left} {op} {right}")
            left = tmp

        return left

    def _parse_term(self) -> str:
        left = self._parse_unary()

        while self._cur().type == "OPERATOR" and self._cur().value in ("*", "/"):
            op = self._advance().value
            right = self._parse_unary()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = {left} {op} {right}")
            left = tmp

        return left

    def _parse_unary(self) -> str:
        if self._match("OPERATOR", "-"):
            self._advance()
            operand = self._parse_factor()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = -{operand}")
            return tmp
        return self._parse_factor()

    def _parse_factor(self) -> str:
        t = self._cur()

        if t.type in ("INT_LITERAL", "FLOAT_LITERAL", "BOOL_LITERAL"):
            self._advance()
            return t.value

        if t.type == "IDENTIFIER":
            self._advance()
            return t.value

        if t.type == "DELIMITER" and t.value == "(":
            self._advance()
            result = self._parse_expr()
            self._expect("DELIMITER", ")")
            return result

        self._errors.append(
            CompilerError("Syntax", f"Unexpected token '{t.value}' in expression", t.line)
        )
        if not self._match("EOF"):
            self._advance()
        return "??"

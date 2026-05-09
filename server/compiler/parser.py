"""
Recursive-descent parser for MiniLang.
Produces both an AST (Abstract Syntax Tree) and Three-Address Code (TAC)
via syntax-directed translation.

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

from typing import Any, Dict, List, Tuple
from .lexer import Token
from .errors import CompilerError

RELOPS = frozenset({"==", "!=", "<", ">", "<=", ">="})
TYPE_KEYWORDS = frozenset({"int", "float", "bool"})


# ── AST Node helpers ────────────────────────────────────────────────────────

def _node(node_type: str, line: int, **kwargs: Any) -> Dict[str, Any]:
    """Create an AST node dictionary."""
    n: Dict[str, Any] = {"type": node_type, "line": line}
    n.update(kwargs)
    return n


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

    def parse(self) -> Tuple[List[str], List[CompilerError], Dict[str, Any]]:
        """
        Returns (tac_instructions, errors, ast_root).
        """
        ast = self._parse_program()
        return self._tac.instructions, self._errors, ast

    # ── Statements ──────────────────────────────────────────────────────────

    def _parse_program(self) -> Dict[str, Any]:
        body: List[Dict[str, Any]] = []
        while not self._match("EOF"):
            stmt = self._parse_statement()
            if stmt:
                body.append(stmt)
        return _node("Program", 1, body=body)

    def _parse_statement(self) -> Dict[str, Any] | None:
        t = self._cur()

        if t.type == "KEYWORD" and t.value in TYPE_KEYWORDS:
            return self._parse_decl_stmt()
        elif t.type == "KEYWORD" and t.value == "if":
            return self._parse_if_stmt()
        elif t.type == "KEYWORD" and t.value == "for":
            return self._parse_for_stmt()
        elif t.type == "KEYWORD" and t.value == "while":
            return self._parse_while_stmt()
        elif t.type == "KEYWORD" and t.value == "print":
            return self._parse_print_stmt()
        elif t.type == "KEYWORD" and t.value == "return":
            return self._parse_return_stmt()
        elif t.type == "IDENTIFIER" and self._peek().value == "=":
            return self._parse_assign_stmt()
        elif t.type == "DELIMITER" and t.value == "{":
            return self._parse_block()
        else:
            self._errors.append(
                CompilerError("Syntax", f"Unexpected token '{t.value}'", t.line)
            )
            self._advance()
            return None

    def _parse_decl_stmt(self) -> Dict[str, Any]:
        type_tok = self._advance()  # int / float / bool
        line = type_tok.line
        name_tok = self._cur()
        if not self._match("IDENTIFIER"):
            self._errors.append(
                CompilerError("Syntax", f"Expected identifier after '{type_tok.value}'", type_tok.line)
            )
            self._sync()
            return _node("DeclStmt", line, var_type=type_tok.value, name="??", init=None)
        self._advance()  # consume identifier

        init_node = None
        if self._match("OPERATOR", "="):
            self._advance()
            init_node, result = self._parse_expr_ast()
            self._tac.emit(f"{name_tok.value} = {result}")

        self._expect("DELIMITER", ";")
        return _node("DeclStmt", line, var_type=type_tok.value, name=name_tok.value, init=init_node)

    def _parse_assign_stmt(self) -> Dict[str, Any]:
        name_tok = self._advance()
        line = name_tok.line
        self._expect("OPERATOR", "=")
        value_node, result = self._parse_expr_ast()
        self._tac.emit(f"{name_tok.value} = {result}")
        self._expect("DELIMITER", ";")
        return _node("AssignStmt", line, name=name_tok.value, value=value_node)

    def _parse_if_stmt(self) -> Dict[str, Any]:
        line = self._advance().line  # if
        self._expect("DELIMITER", "(")
        cond_node, cond = self._parse_condition_ast()
        self._expect("DELIMITER", ")")

        true_lbl = self._tac.new_label()
        false_lbl = self._tac.new_label()

        self._tac.emit(f"if {cond} goto {true_lbl}")
        self._tac.emit(f"goto {false_lbl}")
        self._tac.emit_label(true_lbl)

        then_block = self._parse_block()
        else_block = None

        if self._match("KEYWORD", "else"):
            self._advance()
            end_lbl = self._tac.new_label()
            self._tac.emit(f"goto {end_lbl}")
            self._tac.emit_label(false_lbl)
            else_block = self._parse_block()
            self._tac.emit_label(end_lbl)
        else:
            self._tac.emit_label(false_lbl)

        return _node("IfStmt", line, condition=cond_node, then=then_block, else_block=else_block)

    def _parse_for_stmt(self) -> Dict[str, Any]:
        line = self._advance().line  # for
        self._expect("DELIMITER", "(")

        # Init clause
        init_node = None
        t = self._cur()
        if t.type == "KEYWORD" and t.value in TYPE_KEYWORDS:
            init_node = self._parse_decl_stmt()
        elif t.type == "IDENTIFIER" and self._peek().value == "=":
            init_node = self._parse_assign_stmt()
        else:
            self._expect("DELIMITER", ";")

        start_lbl = self._tac.new_label()
        body_lbl = self._tac.new_label()
        end_lbl = self._tac.new_label()

        self._tac.emit_label(start_lbl)

        # Condition clause
        cond_node, cond = self._parse_condition_ast()
        self._expect("DELIMITER", ";")
        self._tac.emit(f"if {cond} goto {body_lbl}")
        self._tac.emit(f"goto {end_lbl}")

        # Update clause — buffer into temporary list
        saved = self._tac.instructions
        self._tac.instructions = []
        update_node = None
        if not self._match("DELIMITER", ")"):
            upd_name = self._cur()
            if upd_name.type == "IDENTIFIER" and self._peek().value == "=":
                name = self._advance().value
                self._advance()  # =
                upd_expr_node, result = self._parse_expr_ast()
                self._tac.emit(f"{name} = {result}")
                update_node = _node("AssignExpr", upd_name.line, name=name, value=upd_expr_node)
        update_code = self._tac.instructions
        self._tac.instructions = saved

        self._expect("DELIMITER", ")")

        self._tac.emit_label(body_lbl)
        body_node = self._parse_block()

        for instr in update_code:
            self._tac.emit(instr)
        self._tac.emit(f"goto {start_lbl}")
        self._tac.emit_label(end_lbl)

        return _node("ForStmt", line, init=init_node, condition=cond_node, update=update_node, body=body_node)

    def _parse_while_stmt(self) -> Dict[str, Any]:
        line = self._advance().line  # while
        self._expect("DELIMITER", "(")

        start_lbl = self._tac.new_label()
        body_lbl = self._tac.new_label()
        end_lbl = self._tac.new_label()

        self._tac.emit_label(start_lbl)
        cond_node, cond = self._parse_condition_ast()
        self._expect("DELIMITER", ")")
        self._tac.emit(f"if {cond} goto {body_lbl}")
        self._tac.emit(f"goto {end_lbl}")
        self._tac.emit_label(body_lbl)

        body_node = self._parse_block()

        self._tac.emit(f"goto {start_lbl}")
        self._tac.emit_label(end_lbl)

        return _node("WhileStmt", line, condition=cond_node, body=body_node)

    def _parse_print_stmt(self) -> Dict[str, Any]:
        line = self._advance().line  # print
        self._expect("DELIMITER", "(")
        arg_node, result = self._parse_expr_ast()
        self._expect("DELIMITER", ")")
        self._tac.emit(f"print {result}")
        self._expect("DELIMITER", ";")
        return _node("PrintStmt", line, argument=arg_node)

    def _parse_return_stmt(self) -> Dict[str, Any]:
        line = self._advance().line  # return
        value_node = None
        if not self._match("DELIMITER", ";"):
            value_node, result = self._parse_expr_ast()
            self._tac.emit(f"return {result}")
        else:
            self._tac.emit("return")
        self._expect("DELIMITER", ";")
        return _node("ReturnStmt", line, value=value_node)

    def _parse_block(self) -> Dict[str, Any]:
        line = self._cur().line
        self._expect("DELIMITER", "{")
        body: List[Dict[str, Any]] = []
        while not self._match("DELIMITER", "}") and not self._match("EOF"):
            stmt = self._parse_statement()
            if stmt:
                body.append(stmt)
        self._expect("DELIMITER", "}")
        return _node("Block", line, body=body)

    # ── Expressions (return AST node + TAC result) ──────────────────────────

    def _parse_condition_ast(self) -> Tuple[Dict[str, Any], str]:
        left_node, left = self._parse_expr_ast()

        if self._cur().type == "OPERATOR" and self._cur().value in RELOPS:
            op_tok = self._advance()
            right_node, right = self._parse_expr_ast()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = {left} {op_tok.value} {right}")
            node = _node("BinaryExpr", op_tok.line, op=op_tok.value, left=left_node, right=right_node)
            return node, tmp

        return left_node, left

    def _parse_expr_ast(self) -> Tuple[Dict[str, Any], str]:
        left_node, left = self._parse_term_ast()

        while self._cur().type == "OPERATOR" and self._cur().value in ("+", "-"):
            op_tok = self._advance()
            right_node, right = self._parse_term_ast()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = {left} {op_tok.value} {right}")
            left_node = _node("BinaryExpr", op_tok.line, op=op_tok.value, left=left_node, right=right_node)
            left = tmp

        return left_node, left

    def _parse_term_ast(self) -> Tuple[Dict[str, Any], str]:
        left_node, left = self._parse_unary_ast()

        while self._cur().type == "OPERATOR" and self._cur().value in ("*", "/"):
            op_tok = self._advance()
            right_node, right = self._parse_unary_ast()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = {left} {op_tok.value} {right}")
            left_node = _node("BinaryExpr", op_tok.line, op=op_tok.value, left=left_node, right=right_node)
            left = tmp

        return left_node, left

    def _parse_unary_ast(self) -> Tuple[Dict[str, Any], str]:
        if self._match("OPERATOR", "-"):
            tok = self._advance()
            operand_node, operand = self._parse_factor_ast()
            tmp = self._tac.new_temp()
            self._tac.emit(f"{tmp} = -{operand}")
            node = _node("UnaryExpr", tok.line, op="-", operand=operand_node)
            return node, tmp
        return self._parse_factor_ast()

    def _parse_factor_ast(self) -> Tuple[Dict[str, Any], str]:
        t = self._cur()

        if t.type == "INT_LITERAL":
            self._advance()
            return _node("IntLiteral", t.line, value=t.value), t.value

        if t.type == "FLOAT_LITERAL":
            self._advance()
            return _node("FloatLiteral", t.line, value=t.value), t.value

        if t.type == "BOOL_LITERAL":
            self._advance()
            return _node("BoolLiteral", t.line, value=t.value), t.value

        if t.type == "IDENTIFIER":
            self._advance()
            return _node("Identifier", t.line, name=t.value), t.value

        if t.type == "DELIMITER" and t.value == "(":
            self._advance()
            inner_node, result = self._parse_expr_ast()
            self._expect("DELIMITER", ")")
            return inner_node, result

        self._errors.append(
            CompilerError("Syntax", f"Unexpected token '{t.value}' in expression", t.line)
        )
        if not self._match("EOF"):
            self._advance()
        return _node("Error", t.line, value="??"), "??"

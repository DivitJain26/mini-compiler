from dataclasses import dataclass
from typing import List, Optional
from .errors import CompilerError


KEYWORDS = frozenset({
    "int", "float", "bool",
    "if", "else",
    "for", "while",
    "print", "return",
    "true", "false",
})

TWO_CHAR_OPS = frozenset({"==", "!=", "<=", ">=", "&&", "||"})
ONE_CHAR_OPS = frozenset({"+", "-", "*", "/", "=", "<", ">", "!"})
DELIMITERS = frozenset({"{", "}", "(", ")", ";", ","})


@dataclass
class Token:
    type: str   # KEYWORD | IDENTIFIER | INT_LITERAL | FLOAT_LITERAL | BOOL_LITERAL | OPERATOR | DELIMITER | EOF
    value: str
    line: int

    def to_dict(self) -> dict:
        return {"type": self.type, "value": self.value, "line": self.line}


class Lexer:
    def __init__(self, source: str) -> None:
        self.source = source
        self.pos = 0
        self.line = 1
        self.tokens: List[Token] = []
        self.errors: List[CompilerError] = []

    # ── Primitives ──────────────────────────────────────────────────────────

    def _current(self) -> Optional[str]:
        return self.source[self.pos] if self.pos < len(self.source) else None

    def _peek(self, offset: int = 1) -> Optional[str]:
        idx = self.pos + offset
        return self.source[idx] if idx < len(self.source) else None

    def _advance(self) -> str:
        ch = self.source[self.pos]
        self.pos += 1
        if ch == "\n":
            self.line += 1
        return ch

    # ── Skippers ────────────────────────────────────────────────────────────

    def _skip_whitespace(self) -> None:
        while self._current() and self._current() in " \t\r\n":
            self._advance()

    def _skip_line_comment(self) -> None:
        while self._current() and self._current() != "\n":
            self._advance()

    def _skip_block_comment(self) -> None:
        self._advance()  # /
        self._advance()  # *
        while self._current():
            if self._current() == "*" and self._peek() == "/":
                self._advance()
                self._advance()
                return
            self._advance()
        self.errors.append(CompilerError("Lexical", "Unterminated block comment", self.line))

    # ── Readers ─────────────────────────────────────────────────────────────

    def _read_number(self) -> Token:
        start_line = self.line
        buf = ""
        is_float = False

        while self._current() and (self._current().isdigit() or self._current() == "."):
            if self._current() == ".":
                if is_float:
                    break
                is_float = True
            buf += self._advance()

        tok_type = "FLOAT_LITERAL" if is_float else "INT_LITERAL"
        return Token(tok_type, buf, start_line)

    def _read_identifier_or_keyword(self) -> Token:
        start_line = self.line
        buf = ""

        while self._current() and (self._current().isalnum() or self._current() == "_"):
            buf += self._advance()

        if buf in ("true", "false"):
            return Token("BOOL_LITERAL", buf, start_line)
        if buf in KEYWORDS:
            return Token("KEYWORD", buf, start_line)
        return Token("IDENTIFIER", buf, start_line)

    def _read_operator(self) -> Optional[Token]:
        start_line = self.line
        ch = self._current() or ""
        two = ch + (self._peek() or "")

        if two in TWO_CHAR_OPS:
            self._advance()
            self._advance()
            return Token("OPERATOR", two, start_line)
        if ch in ONE_CHAR_OPS:
            self._advance()
            return Token("OPERATOR", ch, start_line)
        return None

    # ── Main ────────────────────────────────────────────────────────────────

    def tokenize(self) -> List[Token]:
        while self.pos < len(self.source):
            self._skip_whitespace()
            ch = self._current()
            if ch is None:
                break

            # Comments
            if ch == "/" and self._peek() == "/":
                self._skip_line_comment()
                continue
            if ch == "/" and self._peek() == "*":
                self._skip_block_comment()
                continue

            # Numbers
            if ch.isdigit():
                self.tokens.append(self._read_number())
                continue

            # Identifiers / keywords
            if ch.isalpha() or ch == "_":
                self.tokens.append(self._read_identifier_or_keyword())
                continue

            # Delimiters
            if ch in DELIMITERS:
                self.tokens.append(Token("DELIMITER", ch, self.line))
                self._advance()
                continue

            # Operators
            op = self._read_operator()
            if op:
                self.tokens.append(op)
                continue

            # Unknown
            self.errors.append(
                CompilerError("Lexical", f"Unknown character '{ch}'", self.line)
            )
            self._advance()

        self.tokens.append(Token("EOF", "", self.line))
        return self.tokens

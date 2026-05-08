from dataclasses import dataclass
from typing import Literal


ErrorKind = Literal["Lexical", "Syntax"]


@dataclass
class CompilerError:
    kind: ErrorKind
    message: str
    line: int

    def to_dict(self) -> dict:
        return {"kind": self.kind, "message": self.message, "line": self.line}

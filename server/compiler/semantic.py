"""
Semantic analyser for MiniLang.
Walks the AST to build a symbol table and perform type checking.
"""

from typing import Any, Dict, List
from .errors import CompilerError


def analyse(ast: Dict[str, Any]) -> tuple[list[dict], list[CompilerError]]:
    analyser = _SemanticAnalyser()
    analyser.visit(ast)
    return analyser.symbol_table, analyser.errors


class _SemanticAnalyser:
    def __init__(self) -> None:
        self.symbol_table: List[Dict[str, Any]] = []
        self.errors: List[CompilerError] = []
        self._scopes: List[Dict[str, Dict[str, Any]]] = [{}]
        self._scope_names: List[str] = ["global"]

    @property
    def _current_scope(self) -> Dict[str, Dict[str, Any]]:
        return self._scopes[-1]

    @property
    def _current_scope_name(self) -> str:
        return self._scope_names[-1]

    def _push_scope(self, name: str) -> None:
        self._scopes.append({})
        self._scope_names.append(name)

    def _pop_scope(self) -> None:
        self._scopes.pop()
        self._scope_names.pop()

    def _declare(self, name: str, var_type: str, line: int) -> None:
        if name in self._current_scope:
            self.errors.append(
                CompilerError("Semantic", f"Variable '{name}' already declared in this scope", line)
            )
            return
        entry = {"name": name, "type": var_type, "scope": self._current_scope_name, "declared_line": line}
        self._current_scope[name] = entry
        self.symbol_table.append(entry)

    def _lookup(self, name: str, line: int) -> str | None:
        for scope in reversed(self._scopes):
            if name in scope:
                return scope[name]["type"]
        self.errors.append(CompilerError("Semantic", f"Undeclared variable '{name}'", line))
        return None

    def _infer_type(self, node: Dict[str, Any]) -> str | None:
        if node is None:
            return None
        ntype = node["type"]
        if ntype == "IntLiteral":
            return "int"
        if ntype == "FloatLiteral":
            return "float"
        if ntype == "BoolLiteral":
            return "bool"
        if ntype == "Identifier":
            return self._lookup(node["name"], node["line"])
        if ntype == "UnaryExpr":
            return self._infer_type(node["operand"])
        if ntype == "BinaryExpr":
            left_t = self._infer_type(node["left"])
            right_t = self._infer_type(node["right"])
            op = node["op"]
            if op in ("==", "!=", "<", ">", "<=", ">="):
                return "bool"
            if left_t == "float" or right_t == "float":
                return "float"
            if left_t == "bool" or right_t == "bool":
                self.errors.append(CompilerError("Semantic", f"Cannot use '{op}' on boolean values", node["line"]))
                return "int"
            return "int"
        return None

    def visit(self, node: Dict[str, Any]) -> None:
        if node is None:
            return
        method = getattr(self, f"_visit_{node['type']}", None)
        if method:
            method(node)

    def _visit_Program(self, node: Dict[str, Any]) -> None:
        for stmt in node.get("body", []):
            self.visit(stmt)

    def _visit_Block(self, node: Dict[str, Any]) -> None:
        self._push_scope("block")
        for stmt in node.get("body", []):
            self.visit(stmt)
        self._pop_scope()

    def _visit_DeclStmt(self, node: Dict[str, Any]) -> None:
        self._declare(node["name"], node["var_type"], node["line"])
        init = node.get("init")
        if init:
            init_type = self._infer_type(init)
            if init_type and init_type != node["var_type"]:
                if not (node["var_type"] == "float" and init_type == "int"):
                    self.errors.append(
                        CompilerError("Semantic",
                                      f"Type mismatch: cannot assign '{init_type}' to '{node['var_type']}' variable '{node['name']}'",
                                      node["line"]))

    def _visit_AssignStmt(self, node: Dict[str, Any]) -> None:
        var_type = self._lookup(node["name"], node["line"])
        value_type = self._infer_type(node["value"])
        if var_type and value_type and var_type != value_type:
            if not (var_type == "float" and value_type == "int"):
                self.errors.append(
                    CompilerError("Semantic",
                                  f"Type mismatch: cannot assign '{value_type}' to '{var_type}' variable '{node['name']}'",
                                  node["line"]))

    def _visit_IfStmt(self, node: Dict[str, Any]) -> None:
        self._infer_type(node["condition"])
        self.visit(node["then"])
        if node.get("else_block"):
            self.visit(node["else_block"])

    def _visit_ForStmt(self, node: Dict[str, Any]) -> None:
        self._push_scope("for")
        if node.get("init"):
            self.visit(node["init"])
        self._infer_type(node["condition"])
        self.visit(node["body"])
        self._pop_scope()

    def _visit_WhileStmt(self, node: Dict[str, Any]) -> None:
        self._infer_type(node["condition"])
        self.visit(node["body"])

    def _visit_PrintStmt(self, node: Dict[str, Any]) -> None:
        self._infer_type(node["argument"])

    def _visit_ReturnStmt(self, node: Dict[str, Any]) -> None:
        if node.get("value"):
            self._infer_type(node["value"])

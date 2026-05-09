"""
TAC Optimizer for MiniLang.
Applies constant folding, constant propagation, and dead-code elimination.
"""

import re
from typing import List

_ASSIGN_RE = re.compile(r"^(\S+)\s*=\s*(.+)$")
_BINOP_RE = re.compile(r"^(\S+)\s*([+\-*/])\s*(\S+)$")
_RELOP_RE = re.compile(r"^(\S+)\s*(==|!=|<=|>=|<|>)\s*(\S+)$")


def _is_number(s: str) -> bool:
    try:
        float(s)
        return True
    except ValueError:
        return False


def _eval_binop(left: str, op: str, right: str) -> str | None:
    if not (_is_number(left) and _is_number(right)):
        return None
    a = float(left)
    b = float(right)
    try:
        if op == "+":
            r = a + b
        elif op == "-":
            r = a - b
        elif op == "*":
            r = a * b
        elif op == "/":
            if b == 0:
                return None
            r = a / b
        elif op == "==":
            return "1" if a == b else "0"
        elif op == "!=":
            return "1" if a != b else "0"
        elif op == "<":
            return "1" if a < b else "0"
        elif op == ">":
            return "1" if a > b else "0"
        elif op == "<=":
            return "1" if a <= b else "0"
        elif op == ">=":
            return "1" if a >= b else "0"
        else:
            return None
    except Exception:
        return None

    if r == int(r):
        return str(int(r))
    return str(r)


def optimize(tac: List[str]) -> List[str]:
    """Apply optimizations and return a new instruction list."""
    result = list(tac)
    result = _constant_folding(result)
    result = _constant_propagation(result)
    result = _dead_code_elimination(result)
    return result


def _constant_folding(tac: List[str]) -> List[str]:
    out: List[str] = []
    for line in tac:
        m = _ASSIGN_RE.match(line)
        if m:
            dest, rhs = m.group(1), m.group(2)
            bm = _BINOP_RE.match(rhs)
            rm = _RELOP_RE.match(rhs)
            op_match = bm or rm
            if op_match:
                left, op, right = op_match.group(1), op_match.group(2), op_match.group(3)
                val = _eval_binop(left, op, right)
                if val is not None:
                    out.append(f"{dest} = {val}")
                    continue
        out.append(line)
    return out


def _constant_propagation(tac: List[str]) -> List[str]:
    constants: dict[str, str] = {}
    out: List[str] = []

    for line in tac:
        # Labels / gotos / control flow reset constants for safety
        if line.endswith(":") or line.startswith("goto ") or line.startswith("if "):
            constants.clear()
            out.append(line)
            continue

        m = _ASSIGN_RE.match(line)
        if m:
            dest, rhs = m.group(1), m.group(2)
            # Substitute known constants in RHS
            bm = _BINOP_RE.match(rhs)
            rm = _RELOP_RE.match(rhs)
            op_match = bm or rm
            if op_match:
                left, op, right = op_match.group(1), op_match.group(2), op_match.group(3)
                left = constants.get(left, left)
                right = constants.get(right, right)
                new_rhs = f"{left} {op} {right}"
                val = _eval_binop(left, op, right)
                if val is not None:
                    constants[dest] = val
                    out.append(f"{dest} = {val}")
                else:
                    out.append(f"{dest} = {new_rhs}")
            elif rhs.strip() in constants:
                constants[dest] = constants[rhs.strip()]
                out.append(f"{dest} = {constants[rhs.strip()]}")
            elif _is_number(rhs.strip()):
                constants[dest] = rhs.strip()
                out.append(line)
            else:
                if dest in constants:
                    del constants[dest]
                out.append(line)
        else:
            out.append(line)
    return out


def _dead_code_elimination(tac: List[str]) -> List[str]:
    """Remove assignments to temporaries (t0, t1, …) that are never read."""
    # Count usages of each temp variable
    temp_defs: dict[str, list[int]] = {}
    temp_uses: set[str] = set()

    for i, line in enumerate(tac):
        m = _ASSIGN_RE.match(line)
        if m:
            dest = m.group(1)
            rhs = m.group(2)
            if re.match(r"^t\d+$", dest):
                temp_defs.setdefault(dest, []).append(i)
            # Check if temps are used in RHS
            for token in re.findall(r"t\d+", rhs):
                temp_uses.add(token)
        else:
            # Check if temps are used in non-assignment lines
            for token in re.findall(r"t\d+", line):
                temp_uses.add(token)

    dead_lines: set[int] = set()
    for temp, def_lines in temp_defs.items():
        if temp not in temp_uses:
            dead_lines.update(def_lines)

    return [line for i, line in enumerate(tac) if i not in dead_lines]

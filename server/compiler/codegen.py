"""
Code generator for MiniLang.
Translates optimized TAC into a simulated register-based assembly.
"""

import re
from typing import List

_ASSIGN_RE = re.compile(r"^(\S+)\s*=\s*(.+)$")
_BINOP_RE = re.compile(r"^(\S+)\s*([+\-*/])\s*(\S+)$")
_RELOP_RE = re.compile(r"^(\S+)\s*(==|!=|<=|>=|<|>)\s*(\S+)$")
_NEG_RE = re.compile(r"^-(\S+)$")

_OP_MAP = {"+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV"}
_CMP_JMP = {"==": "JE", "!=": "JNE", "<": "JL", ">": "JG", "<=": "JLE", ">=": "JGE"}


class _RegisterAllocator:
    def __init__(self) -> None:
        self._map: dict[str, str] = {}
        self._next = 0
        self._max = 8  # R0-R7

    def get(self, name: str) -> str:
        if name not in self._map:
            reg = f"R{self._next % self._max}"
            self._map[name] = reg
            self._next += 1
        return self._map[name]


def generate(tac: List[str]) -> List[str]:
    """Translate TAC instructions to pseudo-assembly."""
    alloc = _RegisterAllocator()
    asm: List[str] = []

    for line in tac:
        line = line.strip()
        if not line:
            continue

        # Label
        if line.endswith(":"):
            asm.append(f"LABEL {line[:-1]}")
            continue

        # goto
        if line.startswith("goto "):
            label = line[5:].strip()
            asm.append(f"JMP {label}")
            continue

        # if cond goto label
        if_match = re.match(r"^if (\S+) goto (\S+)$", line)
        if if_match:
            cond_var, label = if_match.group(1), if_match.group(2)
            r = alloc.get(cond_var)
            asm.append(f"LOAD {r}, {cond_var}")
            asm.append(f"CMP {r}, 1")
            asm.append(f"JE {label}")
            continue

        # print
        if line.startswith("print "):
            val = line[6:].strip()
            r = alloc.get(val)
            asm.append(f"LOAD {r}, {val}")
            asm.append(f"PRINT {r}")
            continue

        # return
        if line.startswith("return"):
            val = line[6:].strip()
            if val:
                r = alloc.get(val)
                asm.append(f"LOAD {r}, {val}")
                asm.append(f"MOV R0, {r}")
            asm.append("HALT")
            continue

        # Assignment: dest = rhs
        m = _ASSIGN_RE.match(line)
        if m:
            dest, rhs = m.group(1), m.group(2).strip()
            rd = alloc.get(dest)

            # Binary arithmetic: x = a op b
            bm = _BINOP_RE.match(rhs)
            if bm:
                left, op, right = bm.group(1), bm.group(2), bm.group(3)
                rl = alloc.get(left)
                rr = alloc.get(right)
                asm.append(f"LOAD {rl}, {left}")
                asm.append(f"LOAD {rr}, {right}")
                mnemonic = _OP_MAP.get(op, "ADD")
                asm.append(f"{mnemonic} {rd}, {rl}, {rr}")
                asm.append(f"STORE {rd}, {dest}")
                continue

            # Relational: x = a relop b
            rm = _RELOP_RE.match(rhs)
            if rm:
                left, op, right = rm.group(1), rm.group(2), rm.group(3)
                rl = alloc.get(left)
                rr = alloc.get(right)
                asm.append(f"LOAD {rl}, {left}")
                asm.append(f"LOAD {rr}, {right}")
                asm.append(f"CMP {rl}, {rr}")
                jmp = _CMP_JMP.get(op, "JE")
                true_lbl = f"_cmp_{dest}"
                end_lbl = f"_end_{dest}"
                asm.append(f"{jmp} {true_lbl}")
                asm.append(f"MOV {rd}, 0")
                asm.append(f"JMP {end_lbl}")
                asm.append(f"LABEL {true_lbl}")
                asm.append(f"MOV {rd}, 1")
                asm.append(f"LABEL {end_lbl}")
                asm.append(f"STORE {rd}, {dest}")
                continue

            # Negation: x = -a
            nm = _NEG_RE.match(rhs)
            if nm:
                operand = nm.group(1)
                ro = alloc.get(operand)
                asm.append(f"LOAD {ro}, {operand}")
                asm.append(f"SUB {rd}, R0, {ro}")  # 0 - operand
                asm.append(f"STORE {rd}, {dest}")
                continue

            # Simple copy: x = value
            asm.append(f"MOV {rd}, {rhs}")
            asm.append(f"STORE {rd}, {dest}")
            continue

        # Fallback: emit as comment
        asm.append(f"; {line}")

    return asm

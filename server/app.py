from flask import Flask, request, jsonify
from flask_cors import CORS

from compiler.lexer import Lexer
from compiler.parser import Parser

app = Flask(__name__)
CORS(app)


@app.route("/api/compile", methods=["POST"])
def compile_code():
    body = request.get_json(silent=True) or {}
    source: str = body.get("code", "")

    # ── Lexical analysis ────────────────────────────────────────────────────
    lexer = Lexer(source)
    tokens = lexer.tokenize()

    errors = [e.to_dict() for e in lexer.errors]
    token_list = [t.to_dict() for t in tokens if t.type != "EOF"]

    # ── Syntactic analysis + TAC generation ─────────────────────────────────
    tac: list[str] = []
    if not errors:
        parser = Parser(tokens)
        tac, parse_errors = parser.parse()
        errors.extend(e.to_dict() for e in parse_errors)
    else:
        # Still attempt parsing to surface syntax errors alongside lexical ones
        parser = Parser(tokens)
        tac, parse_errors = parser.parse()
        errors.extend(e.to_dict() for e in parse_errors)

    return jsonify({"tokens": token_list, "tac": tac, "errors": errors})


if __name__ == "__main__":
    app.run(debug=True, port=5000)

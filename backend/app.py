from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import get_summary

app = Flask(__name__)
CORS(app)  # allow frontend to connect

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/predict")
def predict():
    symbol = request.args.get("symbol", "").strip()
    start = request.args.get("start", "").strip()
    if not symbol or not start:
        return jsonify({"ok": False, "error": "Missing 'symbol' or 'start'"}), 400

    result = get_summary(symbol, start)
    status = 200 if result.get("ok") else 400
    return jsonify(result), status

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

"""
Empor Marcom - Flask Backend
Handles lead storage from the AI chatbot
"""

from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

LEADS_FILE = "leads.json"

def load_leads():
    if not os.path.exists(LEADS_FILE):
        return []
    with open(LEADS_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []

def save_leads(leads):
    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=2)

# ── Pages ──────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/services")
def services():
    return render_template("services.html")

@app.route("/careers")
def careers():
    return render_template("careers.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

# ── API: Save chatbot lead ─────────────────────────────
@app.route("/save_chat", methods=["POST"])
def save_chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data received"}), 400

        lead = {
            "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
            "timestamp": datetime.now().isoformat(),
            "company": data.get("company", ""),
            "role": data.get("role", ""),
            "companySize": data.get("companySize", ""),
            "service": data.get("service", ""),
            "timeline": data.get("timeline", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "source": "chatbot"
        }

        leads = load_leads()
        leads.append(lead)
        save_leads(leads)

        return jsonify({"status": "success", "message": "Lead saved", "id": lead["id"]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── API: Save contact form ─────────────────────────────
@app.route("/save_contact", methods=["POST"])
def save_contact():
    try:
        data = request.get_json()
        lead = {
            "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
            "timestamp": datetime.now().isoformat(),
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "message": data.get("message", ""),
            "source": "contact_form"
        }
        leads = load_leads()
        leads.append(lead)
        save_leads(leads)
        return jsonify({"status": "success", "message": "Message sent!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

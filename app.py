from flask import Flask, request, jsonify, send_from_directory
import requests
from requests.auth import HTTPBasicAuth
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__, static_folder="static")

DNAC_URL = "https://10.10.20.85"    # Cisco Sandbox URL


# FRONTEND ROUTES
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/license")
def license_page():
    return send_from_directory(app.static_folder, "license.html")


# API ROUTES
@app.route("/api/token", methods=["POST"])
def generate_token():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    try:
        url = f"{DNAC_URL}/dna/system/api/v1/auth/token"
        r = requests.post(
            url,
            auth=HTTPBasicAuth(username, password),
            verify=False
        )
        r.raise_for_status()
        return jsonify({"success": True, "token": r.json()["Token"]})
    except:
        return jsonify({"success": False, "message": "Authentication failed"}), 401


@app.route("/api/license")
def license_summary():
    token = request.headers.get("X-Auth-Token")

    if not token:
        return jsonify({"error": "Missing Auth Token"}), 401

    headers = {"X-Auth-Token": token}

    url = (
        f"{DNAC_URL}/dna/intent/api/v1/licenses/device/summary"
        "?page_number=1&order=asc&limit=500"
    )

    try:
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()
        data = response.json()

        normalized_output = []

        for device in data.get("response", []):
            normalized_output.append({
                "device_name": device.get("device_name"),
                "ip_address": device.get("ip_address"),
                "model": device.get("model"),
                "software_version": device.get("software_version"),
                "dna_level": device.get("dna_level"),
                "network_license": device.get("network_license"),
                "license_mode": device.get("license_mode"),
                "authorization_status": device.get("authorization_status"),
                "license_status": (
                    "EXPIRED" if device.get("is_license_expired") else "ACTIVE"
                )
            })

        return jsonify({
            "count": len(normalized_output),
            "devices": normalized_output
        })

    except Exception as e:
        return jsonify({"error": "Failed to fetch license data"}), 500


if __name__ == "__main__":
    app.run(debug=True)

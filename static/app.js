let licenseData = [];
let authToken = "";

function generateToken() {
  fetch("/api/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      authToken = data.token;
      sessionStorage.setItem("token", authToken);
      document.getElementById("message").innerHTML =
        "<span style='color:green'>Token generated successfully</span>";
      document.getElementById("licenseBtn").style.display = "block";
    } else {
      document.getElementById("message").innerHTML =
        "<span style='color:red'>Invalid credentials</span>";
    }
  });
}

function goToLicense() {
  window.location.href = "/license";
}

function loadLicense() {
  const token = sessionStorage.getItem("token");

  fetch("/api/license", {
    headers: { "X-Auth-Token": token }
  })
  .then(res => res.json())
  .then(data => {
    console.log("Normalized License Data:", data);

    licenseData = data.devices || [];   // to store data

    const tbody = document.querySelector("#licenseTable tbody");
    tbody.innerHTML = "";

    if (licenseData.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='8'>No license data available</td></tr>";
      return;
    }

    // Sort by device name (ascending)
    licenseData.sort((a, b) =>
      a.device_name.localeCompare(b.device_name)
    );

    licenseData.forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${d.device_name}</td>
        <td>${d.ip_address}</td>
        <td>${d.model}</td>
        <td>${d.software_version}</td>
        <td>${d.dna_level}</td>
        <td>${d.network_license}</td>
        <td>${d.license_mode}</td>
        <td>${d.license_status}</td>
      `;
      tbody.appendChild(row);
    });
  });
}

function exportJSON() {
  if (licenseData.length === 0) {
    alert("No data to export");
    return;
  }

  const blob = new Blob(
    [JSON.stringify(licenseData, null, 2)],
    { type: "application/json" }
  );

  downloadFile(blob, "license_report.json");
}

function exportCSV() {
  if (licenseData.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = [
    "Device Name",
    "IP Address",
    "Model",
    "Software Version",
    "DNA Level",
    "Network License",
    "License Mode",
    "License Status"
  ];

  const rows = licenseData.map(d => [
    d.device_name,
    d.ip_address,
    d.model,
    d.software_version,
    d.dna_level,
    d.network_license,
    d.license_mode,
    d.license_status
  ]);

  let csvContent =
    headers.join(",") + "\n" +
    rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  downloadFile(blob, "license_report.csv");
}

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}


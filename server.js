<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iAscendAi Dashboard</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #f9fafb;
      text-align: center;
      padding: 40px;
    }
    #loading {
      display: none;
      color: #555;
      font-size: 1.1rem;
      margin-bottom: 20px;
    }
    #user-data {
      display: none;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,.1);
      max-width: 500px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <h1>Welcome to Your Dashboard</h1>
  <div id="loading">⏳ Loading your verified record...</div>
  <div id="user-data">
    <h2 id="user-name"></h2>
    <p><strong>Email:</strong> <span id="user-email"></span></p>
    <p><strong>SoulMark:</strong> <span id="user-soulmark"></span></p>
    <p><strong>Registered:</strong> <span id="user-date"></span></p>
  </div>

  <script>
    const API_BASE = "https://jamaica-we-rise.onrender.com";
    const params = new URLSearchParams(window.location.search);
    const username = params.get("username");

    const loadingEl = document.getElementById("loading");
    const userEl = document.getElementById("user-data");

    // 🔁 Robust fetch with automatic retry for Render cold starts
    async function fetchWithRetry(url, options = {}, retries = 3, delay = 1500) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, options);
          if (!res.ok) throw new Error(`Response not OK (${res.status})`);
          return await res.json();
        } catch (err) {
          console.warn(`Attempt ${attempt} failed: ${err.message}`);
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, delay));
          } else {
            throw err;
          }
        }
      }
    }

    async function loadDashboard() {
      // 🚨 Missing username in URL
      if (!username) {
        loadingEl.style.display = "block";
        loadingEl.style.color = "red";
        loadingEl.textContent = "❌ Missing username in URL.";
        return;
      }

      // 🔐 Validate username (alphanumeric, dash, underscore)
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        loadingEl.style.display = "block";
        loadingEl.style.color = "red";
        loadingEl.textContent = "❌ Invalid username format.";
        console.error("Invalid username format:", username);
        return;
      }

      loadingEl.style.display = "block";
      loadingEl.style.color = "#555";
      loadingEl.textContent = "⏳ Loading your verified record...";

      try {
        const data = await fetchWithRetry(`${API_BASE}/user/${username}`);
        loadingEl.style.display = "none";
        userEl.style.display = "block";
        document.getElementById("user-name").textContent = data.name || username;
        document.getElementById("user-email").textContent = data.email || "N/A";
        document.getElementById("user-soulmark").textContent = data.soulMark || "N/A";
        document.getElementById("user-date").textContent =
          data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A";
      } catch (err) {
        console.error("Dashboard load failed:", err);
        loadingEl.style.display = "block";
        loadingEl.style.color = "red";
        loadingEl.textContent =
          "⚠️ Unable to load dashboard. Please refresh in a few moments.";
      }
    }

    loadDashboard();
  </script>
</body>
</html>

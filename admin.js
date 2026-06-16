/* ============================================================
   Playa de San Antolín — admin.js
   Panel de administración: autenticación simple + estadísticas
   ============================================================ */

const ADMIN_PASSWORD = "antolin";

const firebaseConfig = {
  apiKey:            "AIzaSyBMh4rkqpn4XK50HIY-hR_E3zLpvQqPU0Q",
  authDomain:        "antolin-93e0c.firebaseapp.com",
  projectId:         "antolin-93e0c",
  storageBucket:     "antolin-93e0c.firebasestorage.app",
  messagingSenderId: "291188733594",
  appId:             "1:291188733594:web:e2b8313b9fced7abc75123"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ===== AUTENTICACIÓN SIMPLE ===== */
const SESSION_KEY = "admin_auth_antolin";

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "ok";
}

function login(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "ok");
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById("admin-panel").hidden = true;
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("pwd").value = "";
}

/* ===== LOGIN FORM ===== */
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const pwd = document.getElementById("pwd").value;
  const errorEl = document.getElementById("login-error");
  const input = document.getElementById("pwd");

  if (login(pwd)) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-panel").hidden = false;
    loadDashboard();
  } else {
    errorEl.textContent = "Contraseña incorrecta.";
    input.classList.add("invalid");
    input.value = "";
    input.focus();
  }
});

document.getElementById("pwd").addEventListener("input", () => {
  document.getElementById("login-error").textContent = "";
  document.getElementById("pwd").classList.remove("invalid");
});

document.getElementById("logout-btn").addEventListener("click", logout);
document.getElementById("refresh-btn").addEventListener("click", loadDashboard);

/* Mostrar panel si ya hay sesión */
if (isAuthenticated()) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("admin-panel").hidden = false;
  loadDashboard();
}

/* ===== CARGA DE DATOS ===== */
let charts = {};

async function loadDashboard() {
  showLoading(true);
  try {
    const snapshot = await db.collection("respuestas").orderBy("timestamp", "desc").get();
    const data = snapshot.docs.map(doc => doc.data());
    renderDashboard(data);
  } catch (err) {
    console.error("Error al cargar datos:", err);
    alert("Error al cargar los datos: " + err.message);
  } finally {
    showLoading(false);
  }
}

function showLoading(visible) {
  let overlay = document.getElementById("loading-overlay");
  if (visible) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "loading-overlay";
      overlay.className = "loading-overlay";
      overlay.innerHTML = '<div class="spinner"></div> Cargando datos…';
      document.body.appendChild(overlay);
    }
  } else {
    if (overlay) overlay.remove();
  }
}

/* ===== RENDER DASHBOARD ===== */
function renderDashboard(data) {
  renderKPIs(data);
  renderVisitedChart(data);
  renderStarsChart(data);
  renderAtractivoChart(data);
  renderTimelineChart(data);
  renderComments(data);
}

/* ===== KPIs ===== */
function renderKPIs(data) {
  const total = data.length;

  const ratingsWithValue = data.filter(d => d.puntuacion > 0);
  const avg = ratingsWithValue.length
    ? (ratingsWithValue.reduce((sum, d) => sum + d.puntuacion, 0) / ratingsWithValue.length).toFixed(1)
    : "—";

  const visited = data.filter(d => d.visitado === "si").length;
  const visitedPct = total ? Math.round((visited / total) * 100) : 0;

  const withComment = data.filter(d => d.comentario && d.comentario.trim().length > 0).length;
  const commentPct = total ? Math.round((withComment / total) * 100) : 0;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-avg").textContent = avg > 0 ? `${avg} / 5` : "—";
  document.getElementById("kpi-visited").textContent = total ? `${visitedPct}%` : "—";
  document.getElementById("kpi-comments").textContent = total ? `${commentPct}%` : "—";
}

/* ===== COLORES ===== */
const COLORS = {
  ocean:  "#0077b6",
  green:  "#2d6a4f",
  sand:   "#f4a261",
  light:  "#90e0ef",
  red:    "#e63946",
  purple: "#7b2d8b",
  gray:   "#adb5bd",
};

const CHART_DEFAULTS = {
  font: { family: "'Segoe UI', system-ui, sans-serif", size: 13 },
  color: "#343a40",
};

Chart.defaults.font.family = CHART_DEFAULTS.font.family;
Chart.defaults.font.size   = CHART_DEFAULTS.font.size;
Chart.defaults.color       = CHART_DEFAULTS.color;

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

/* ===== GRÁFICO VISITADO (Donut) ===== */
function renderVisitedChart(data) {
  destroyChart("visited");
  const counts = { si: 0, no: 0, "me-gustaria": 0 };
  data.forEach(d => { if (d.visitado) counts[d.visitado] = (counts[d.visitado] || 0) + 1; });

  charts.visited = new Chart(document.getElementById("chart-visited"), {
    type: "doughnut",
    data: {
      labels: ["Sí he ido", "No he ido", "Me gustaría ir"],
      datasets: [{
        data: [counts.si, counts.no, counts["me-gustaria"]],
        backgroundColor: [COLORS.green, COLORS.red, COLORS.ocean],
        borderWidth: 3,
        borderColor: "#fff",
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { padding: 16, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total ? Math.round((ctx.raw / total) * 100) : 0;
              return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/* ===== GRÁFICO ESTRELLAS (Barras horizontales) ===== */
function renderStarsChart(data) {
  destroyChart("stars");
  const counts = [0, 0, 0, 0, 0];
  data.forEach(d => { if (d.puntuacion >= 1 && d.puntuacion <= 5) counts[d.puntuacion - 1]++; });

  charts.stars = new Chart(document.getElementById("chart-stars"), {
    type: "bar",
    data: {
      labels: ["★ 1", "★★ 2", "★★★ 3", "★★★★ 4", "★★★★★ 5"],
      datasets: [{
        label: "Respuestas",
        data: counts,
        backgroundColor: [
          "#e63946", "#f4a261", "#e9c46a", "#52b788", "#0077b6"
        ],
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        y: { grid: { display: false } }
      }
    }
  });
}

/* ===== GRÁFICO ATRACTIVOS (Barras verticales) ===== */
function renderAtractivoChart(data) {
  destroyChart("atractivo");
  const labels = {
    "paisaje":        "Paisaje",
    "tranquilidad":   "Tranquilidad",
    "agua-limpia":    "Agua limpia",
    "entorno-natural":"Entorno natural",
    "accesibilidad":  "Accesibilidad",
  };
  const counts = {};
  Object.keys(labels).forEach(k => counts[k] = 0);

  data.forEach(d => {
    if (Array.isArray(d.atractivo)) {
      d.atractivo.forEach(a => { if (counts[a] !== undefined) counts[a]++; });
    }
  });

  charts.atractivo = new Chart(document.getElementById("chart-atractivo"), {
    type: "bar",
    data: {
      labels: Object.values(labels),
      datasets: [{
        label: "Veces seleccionado",
        data: Object.keys(labels).map(k => counts[k]),
        backgroundColor: [
          COLORS.ocean, COLORS.green, COLORS.light, COLORS.sand, COLORS.purple
        ],
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: { grid: { display: false } }
      }
    }
  });
}

/* ===== GRÁFICO TEMPORAL (Línea) ===== */
function renderTimelineChart(data) {
  destroyChart("timeline");

  /* Agrupar por fecha (YYYY-MM-DD) y calcular media de estrellas */
  const byDate = {};
  data.forEach(d => {
    if (!d.timestamp) return;
    const date = d.timestamp.slice(0, 10);
    if (!byDate[date]) byDate[date] = { total: 0, count: 0, respuestas: 0 };
    byDate[date].respuestas++;
    if (d.puntuacion > 0) { byDate[date].total += d.puntuacion; byDate[date].count++; }
  });

  const sortedDates = Object.keys(byDate).sort();
  const avgByDate   = sortedDates.map(d => byDate[d].count ? (byDate[d].total / byDate[d].count).toFixed(2) : null);
  const countByDate = sortedDates.map(d => byDate[d].respuestas);

  charts.timeline = new Chart(document.getElementById("chart-timeline"), {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: "Valoración media",
          data: avgByDate,
          borderColor: COLORS.ocean,
          backgroundColor: "rgba(0,119,182,0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: "y",
        },
        {
          label: "Nº respuestas",
          data: countByDate,
          borderColor: COLORS.sand,
          backgroundColor: "rgba(244,162,97,0.1)",
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderDash: [5, 4],
          yAxisID: "y2",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top", labels: { usePointStyle: true, padding: 16 } }
      },
      scales: {
        y: {
          min: 0, max: 5,
          position: "left",
          title: { display: true, text: "Valoración (1-5)" },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        y2: {
          min: 0,
          position: "right",
          title: { display: true, text: "Respuestas" },
          ticks: { stepSize: 1, precision: 0 },
          grid: { display: false },
        },
        x: { grid: { display: false } }
      }
    }
  });
}

/* ===== COMENTARIOS ===== */
const VISITED_LABELS = { si: "Sí ha visitado", no: "No ha visitado", "me-gustaria": "Le gustaría ir" };

function renderComments(data) {
  const container = document.getElementById("comments-list");

  const withComments = data.filter(d => d.comentario && d.comentario.trim().length > 0);

  if (withComments.length === 0) {
    container.innerHTML = '<p class="comments-empty">Todavía no hay comentarios.</p>';
    return;
  }

  container.innerHTML = withComments.slice(0, 20).map(d => {
    const stars = d.puntuacion > 0 ? "★".repeat(d.puntuacion) + "☆".repeat(5 - d.puntuacion) : "Sin valorar";
    const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "";
    const visited = VISITED_LABELS[d.visitado] || d.visitado || "";
    const nombre = escapeHtml(d.nombre || "Anónimo");
    const texto  = escapeHtml(d.comentario.trim());

    return `
      <div class="comment-item">
        <div class="comment-item__header">
          <span class="comment-item__name">${nombre}</span>
          <span class="comment-item__stars">${stars}</span>
          <span class="comment-item__visited">${visited}</span>
          <span class="comment-item__date">${date}</span>
        </div>
        <p class="comment-item__text">${texto}</p>
      </div>`;
  }).join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

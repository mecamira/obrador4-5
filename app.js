/* ============================================================
   Playa de San Antolín — app.js
   Dependencias: Firebase SDK v9 (compat mode) cargado desde CDN
   en index.html antes que este script.
   ============================================================ */

/* ----------------------------------------------------------
   CONFIGURACIÓN DE FIREBASE
   Instrucciones:
   1. Ve a https://console.firebase.google.com/ y crea un proyecto.
   2. En el proyecto, ve a "Configuración del proyecto" > "Tus apps"
      y registra una app web.
   3. Copia los valores del objeto firebaseConfig que Firebase te
      proporciona y reemplaza los marcadores de posición de abajo.
   4. En Firebase Console, ve a "Firestore Database" y crea una
      base de datos en modo de prueba (o configura reglas de
      seguridad según corresponda).
   ---------------------------------------------------------- */
const firebaseConfig = {
  apiKey:            "AIzaSyBMh4rkqpn4XK50HIY-hR_E3zLpvQqPU0Q",
  authDomain:        "antolin-93e0c.firebaseapp.com",
  projectId:         "antolin-93e0c",
  storageBucket:     "antolin-93e0c.firebasestorage.app",
  messagingSenderId: "291188733594",
  appId:             "1:291188733594:web:e2b8313b9fced7abc75123"
};

/* ----------------------------------------------------------
   INICIALIZACIÓN DE FIREBASE
   ---------------------------------------------------------- */
let db = null;
let firebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  firebaseReady = true;
  console.info("Firebase inicializado correctamente.");
} catch (err) {
  console.warn("Firebase no está configurado. Los envíos del formulario no se guardarán en la nube.", err.message);
}

/* ----------------------------------------------------------
   SISTEMA DE VALORACIÓN POR ESTRELLAS
   ---------------------------------------------------------- */
(function initStarRating() {
  const stars       = document.querySelectorAll(".star");
  const hiddenInput = document.getElementById("puntuacion");
  const starsLabel  = document.getElementById("stars-text");

  if (!stars.length || !hiddenInput) return;

  const labels = ["Sin valorar", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  function setRating(value) {
    hiddenInput.value = value;
    stars.forEach((star) => {
      const starVal = parseInt(star.dataset.value, 10);
      star.classList.toggle("active", starVal <= value);
    });
    starsLabel.textContent = value > 0 ? `${value} de 5 — ${labels[value]}` : labels[0];
  }

  function previewRating(value) {
    stars.forEach((star) => {
      const starVal = parseInt(star.dataset.value, 10);
      star.classList.toggle("hovered", starVal <= value);
    });
  }

  function clearPreview() {
    stars.forEach((star) => star.classList.remove("hovered"));
  }

  stars.forEach((star) => {
    const value = parseInt(star.dataset.value, 10);

    star.addEventListener("click", () => setRating(value));

    star.addEventListener("mouseenter", () => previewRating(value));
    star.addEventListener("mouseleave", clearPreview);

    // Accesibilidad: teclado
    star.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setRating(value);
      }
    });
  });
})();

/* ----------------------------------------------------------
   CONTADOR DE CARACTERES EN EL TEXTAREA
   ---------------------------------------------------------- */
(function initCharCount() {
  const textarea  = document.getElementById("comentario");
  const charCount = document.getElementById("char-count");

  if (!textarea || !charCount) return;

  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    const max = parseInt(textarea.getAttribute("maxlength"), 10) || 1000;
    charCount.textContent = `${len} / ${max}`;
    charCount.style.color = len > max * 0.9 ? "#e63946" : "";
  });
})();

/* ----------------------------------------------------------
   VALIDACIÓN Y ENVÍO DEL FORMULARIO
   ---------------------------------------------------------- */
(function initForm() {
  const form       = document.getElementById("survey-form");
  const submitBtn  = document.getElementById("submit-btn");
  const msgDiv     = document.getElementById("form-message");

  if (!form) return;

  /* --- Helpers de validación --- */
  function showError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    const inputEl = document.getElementById(fieldId) ||
                    form.querySelector(`[name="${fieldId}"]`);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add("error");
  }

  function clearError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    const inputEl = document.getElementById(fieldId) ||
                    form.querySelector(`[name="${fieldId}"]`);
    if (errorEl) errorEl.textContent = "";
    if (inputEl) inputEl.classList.remove("error");
  }

  function showMessage(type, text) {
    msgDiv.textContent = text;
    msgDiv.className   = `form__message ${type}`;
  }

  function clearMessage() {
    msgDiv.textContent = "";
    msgDiv.className   = "form__message";
  }

  /* --- Validación en tiempo real --- */
  const nombreInput = document.getElementById("nombre");
  if (nombreInput) {
    nombreInput.addEventListener("input", () => {
      if (nombreInput.value.trim().length > 0) {
        clearError("nombre");
      }
    });
  }

  /* --- Recopilar datos del formulario --- */
  function getFormData() {
    const nombre    = form.querySelector("#nombre").value.trim();
    const visitado  = form.querySelector('input[name="visitado"]:checked');
    const atractivo = [...form.querySelectorAll('input[name="atractivo"]:checked')]
                        .map((cb) => cb.value);
    const puntuacion = parseInt(form.querySelector("#puntuacion").value, 10) || 0;
    const comentario = form.querySelector("#comentario").value.trim();

    return {
      nombre,
      visitado:   visitado ? visitado.value : null,
      atractivo,
      puntuacion,
      comentario,
      timestamp:  new Date().toISOString(),
    };
  }

  /* --- Validar campos requeridos --- */
  function validateForm(data) {
    let valid = true;

    if (!data.nombre) {
      showError("nombre", "Por favor, introduce tu nombre.");
      valid = false;
    } else {
      clearError("nombre");
    }

    if (!data.visitado) {
      showError("visitado", "Por favor, selecciona una opción.");
      valid = false;
    } else {
      clearError("visitado");
    }

    return valid;
  }

  /* --- Enviar a Firestore --- */
  async function saveToFirestore(data) {
    if (!firebaseReady || !db) {
      throw new Error("Firebase no configurado. Revisa el README para instrucciones de configuración.");
    }
    await db.collection("respuestas").add(data);
  }

  /* --- Manejador del submit --- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const data = getFormData();
    if (!validateForm(data)) return;

    /* Estado de carga */
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    try {
      await saveToFirestore(data);
      showMessage(
        "success",
        "✅ ¡Gracias por tu respuesta! Tu opinión ha sido registrada correctamente."
      );
      form.reset();
      // Limpiar estrellas
      document.querySelectorAll(".star").forEach((s) => s.classList.remove("active"));
      document.getElementById("puntuacion").value = "0";
      document.getElementById("stars-text").textContent = "Sin valorar";
      document.getElementById("char-count").textContent = "0 / 1000";
    } catch (err) {
      console.error("Error al guardar en Firestore:", err);
      showMessage(
        "error",
        `❌ No se pudo enviar tu respuesta: ${err.message}. Comprueba la configuración de Firebase.`
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  });
})();

/* ----------------------------------------------------------
   ANIMACIONES AL HACER SCROLL (IntersectionObserver)
   Añade la clase 'visible' a los elementos con la clase
   'animate-on-scroll' cuando entran en el viewport.
   ---------------------------------------------------------- */
(function initScrollAnimations() {
  const targets = document.querySelectorAll(".animate-on-scroll");

  if (!targets.length) return;

  // Si el navegador no soporta IntersectionObserver, mostrar todo
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Dejar de observar una vez visible (animación de entrada)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,      // El 12% del elemento debe ser visible
      rootMargin: "0px 0px -50px 0px", // Activar un poco antes del borde inferior
    }
  );

  targets.forEach((el) => observer.observe(el));
})();

/* ----------------------------------------------------------
   NAVEGACIÓN ACTIVA AL HACER SCROLL
   Resalta el enlace de navegación correspondiente a la sección
   visible actualmente.
   ---------------------------------------------------------- */
(function initActiveNav() {
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav__link");

  if (!sections.length || !navLinks.length) return;

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "nav__link--active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => observer.observe(section));
})();

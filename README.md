# Playa de San Antolín – Sitio Web Estático

Sitio web informativo sobre la **Playa de San Antolín**, en Llanes (Asturias, España). Incluye galería de imágenes, información práctica de acceso y un formulario de encuesta que guarda las respuestas en **Firebase Firestore**.

---

## Estructura del proyecto

```
obrador4-5/
├── index.html   → Estructura HTML5 semántica del sitio
├── style.css    → Estilos modernos con diseño responsive y animaciones
├── app.js       → Lógica JS: Firebase, formulario, estrellas, animaciones scroll
└── README.md    → Este archivo
```

---

## Configurar Firebase

### Paso 1 – Crear un proyecto en Firebase

1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/) e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Agregar proyecto"** y sigue el asistente (puedes desactivar Google Analytics si no lo necesitas).

### Paso 2 – Registrar una app web

1. Dentro de tu proyecto, haz clic en el icono **`</>`** (Web) para registrar una app web.
2. Dale un nombre (por ejemplo, `playa-san-antolin`) y haz clic en **"Registrar app"**.
3. Firebase te mostrará un objeto `firebaseConfig` similar a este:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "mi-proyecto.firebaseapp.com",
  projectId:         "mi-proyecto",
  storageBucket:     "mi-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

4. Copia esos valores.

### Paso 3 – Pegar la configuración en app.js

Abre `app.js` y localiza el bloque `firebaseConfig` al inicio del archivo. Reemplaza los marcadores de posición (`YOUR_API_KEY`, `YOUR_AUTH_DOMAIN`, etc.) con los valores copiados del paso anterior.

### Paso 4 – Habilitar Firestore

1. En la consola de Firebase, ve a **Firestore Database** (menú lateral izquierdo).
2. Haz clic en **"Crear base de datos"**.
3. Selecciona **"Modo de prueba"** para comenzar (permite leer y escribir sin autenticación durante 30 días). Para producción, configura reglas de seguridad adecuadas.
4. Elige la región más cercana (por ejemplo, `eur3` para Europa).

Las respuestas del formulario se guardarán automáticamente en la colección **`respuestas`** de Firestore cada vez que alguien envíe el formulario.

> **Nota de seguridad:** En producción, configura las [reglas de seguridad de Firestore](https://firebase.google.com/docs/firestore/security/get-started) para evitar escrituras no autorizadas. El modo de prueba caduca a los 30 días.

---

## Desplegar en GitHub Pages

### Paso 1 – Subir el código a GitHub

```bash
# Si aún no tienes el repositorio en GitHub:
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

Si ya tienes el repositorio configurado, simplemente:

```bash
git add index.html style.css app.js README.md
git commit -m "Añadir sitio web Playa de San Antolín"
git push
```

### Paso 2 – Activar GitHub Pages

1. Ve a tu repositorio en GitHub.
2. Haz clic en **Settings** (Configuración) → sección **Pages** (en el menú lateral).
3. En **"Source"**, selecciona la rama `main` y la carpeta `/ (root)`.
4. Haz clic en **Save**.
5. Tras unos minutos, tu sitio estará disponible en:
   ```
   https://TU_USUARIO.github.io/TU_REPOSITORIO/
   ```

### Paso 3 – Actualizar la URL canónica (opcional)

Edita la etiqueta `<link rel="canonical">` en `index.html` con la URL real de tu sitio desplegado.

---

## Desarrollo local

No se requiere ningún servidor de build ni npm. Simplemente abre `index.html` en tu navegador.

Para un mejor rendimiento en desarrollo (y para que Firebase funcione correctamente con CORS), puedes servir los archivos con un servidor local sencillo:

```bash
# Con Python 3
python3 -m http.server 8080

# Con Node.js (npx, sin instalar nada)
npx serve .
```

Luego abre [http://localhost:8080](http://localhost:8080) en tu navegador.

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 semántico | Estructura del sitio |
| CSS3 (Grid, Variables, Animaciones) | Estilos y diseño responsive |
| JavaScript ES2020 (Vanilla) | Interactividad y lógica |
| Firebase Firestore (SDK v10 compat) | Base de datos para respuestas del formulario |
| Unsplash | Fotografías de playa y costa |

---

*Playa de San Antolín · Llanes, Asturias, España · 43.4° N, 4.7° O*


// === CONFIGURACIÓN ===
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9OBtzQPnr6IH9Au7suk_dgq4BbpMS_0kqKfcyKNPKe4ZFLr1YvAvX8iUvlwTJNgmV/exec"; // <-- tu URL actual del Apps Script

// === ELEMENTOS DEL DOM ===
const btnGenerarQR = document.getElementById("btnGenerarQR");
const btnNuevoQR = document.getElementById("btnNuevoQR");
const qrContainer = document.getElementById("qrContainer");
const qrImage = document.getElementById("qrImage");
const mainContent = document.getElementById("main-content");
const verifyContent = document.getElementById("verify-content");
const verifyMessage = document.getElementById("verify-message");

// === DETECTAR SI VIENE CON TOKEN (AL ESCANEAR EL QR) ===
window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const place = urlParams.get("place");

  if (token) {
    mainContent.classList.add("hidden");
    verifyContent.classList.remove("hidden");
    verifyMessage.textContent = "Verificando acceso...";

    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?token=${token}&place=${place}`);
      const data = await response.json();

      if (data.status === "ok") {
        verifyMessage.innerHTML = `✅ ${data.msg}<br>Podés fichar ahora.`;
        verifyMessage.style.color = "green";
      } else {
        verifyMessage.innerHTML = `⚠️ ${data.msg}`;
        verifyMessage.style.color = "red";
      }
    } catch (err) {
      verifyMessage.textContent = "❌ Error de conexión. No se pudo conectar con el sistema de asistencia.";
      verifyMessage.style.color = "red";
    }
  }
});

// === GENERAR QR ===
btnGenerarQR.addEventListener("click", async () => {
  await generarQR();
});

btnNuevoQR.addEventListener("click", async () => {
  await generarQR();
});

async function generarQR() {
  btnGenerarQR.disabled = true;
  btnNuevoQR.disabled = true;

  const alerta = document.createElement("p");
  alerta.textContent = "⏳ Generando QR...";
  alerta.style.color = "#007bff";
  mainContent.appendChild(alerta);

  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=generarQR`);
    const data = await res.json();

    if (data.qrUrl) {
      qrImage.src = data.qrUrl;
      qrContainer.classList.remove("hidden");
      alerta.remove();
    } else {
      alerta.textContent = "⚠️ No se pudo generar el QR.";
      alerta.style.color = "red";
    }
  } catch (error) {
    alerta.textContent = "⚠️ Error al generar el QR.";
    alerta.style.color = "red";
  }

  btnGenerarQR.disabled = false;
  btnNuevoQR.disabled = false;
}

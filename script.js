// === CONFIGURACIÓN ===
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxwiJeUqccvYRtYIxzAQDzaWlQmghUt_cEcAJAYURB8fRXC-Ypx6H7ISp3LTgIXzZit/exec";

// === ELEMENTOS DEL DOM ===
const btnGenerarQR = document.getElementById("btnGenerarQR");
const btnNuevoQR = document.getElementById("btnNuevoQR");
const qrContainer = document.getElementById("qrContainer");
const qrImage = document.getElementById("qrImage");
const mainContent = document.getElementById("main-content");
const verifyContent = document.getElementById("verify-content");
const verifyMessage = document.getElementById("verify-message");

// === FUNCIÓN PARA HACER FETCH SIMPLIFICADA ===
async function fetchGoogleScript(url) {
  try {
    // Usar fetch normal sin proxy
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Intentar parsear como JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // Si no es JSON válido, podría ser HTML de error
      if (text.includes('Error') || text.includes('DOCTYPE')) {
        throw new Error('El servidor respondió con una página de error');
      }
      throw new Error('Formato de respuesta inválido');
    }
  } catch (error) {
    console.error('Error en fetch:', error);
    throw error;
  }
}

// === DETECTAR SI VIENE CON TOKEN (AL ESCANEAR EL QR) ===
window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const place = urlParams.get("place");

  if (token && place) {
    mainContent.classList.add("hidden");
    verifyContent.classList.remove("hidden");
    verifyMessage.textContent = "Verificando acceso...";

    try {
      const targetUrl = `${GOOGLE_SCRIPT_URL}?token=${encodeURIComponent(token)}&place=${encodeURIComponent(place)}`;
      const data = await fetchGoogleScript(targetUrl);
      
      if (data.status === "ok") {
        verifyMessage.innerHTML = `✅ ${data.msg}<br>Redirigiendo para fichar...`;
        verifyMessage.style.color = "green";
        
        // Redirigir directamente al Apps Script para registrar asistencia
        setTimeout(() => {
          const asistenciaUrl = `${GOOGLE_SCRIPT_URL}?registrar=true&token=${token}&place=${place}`;
          window.location.href = asistenciaUrl;
        }, 2000);
        
      } else {
        verifyMessage.innerHTML = `⚠️ ${data.msg}`;
        verifyMessage.style.color = "red";
      }
    } catch (err) {
      console.error("Error:", err);
      verifyMessage.innerHTML = "❌ Error de conexión. Redirigiendo directamente al sistema...";
      verifyMessage.style.color = "red";
      
      // Fallback: redirigir directamente al Apps Script
      setTimeout(() => {
        window.location.href = `${GOOGLE_SCRIPT_URL}?scan=true&token=${token}&place=${place}`;
      }, 2000);
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
  if (btnNuevoQR) btnNuevoQR.disabled = true;

  const alerta = document.createElement("p");
  alerta.textContent = "⏳ Generando QR...";
  alerta.style.color = "#007bff";
  alerta.id = "qr-alerta";
  
  // Remover alerta anterior si existe
  const existingAlert = document.getElementById("qr-alerta");
  if (existingAlert) existingAlert.remove();
  
  mainContent.appendChild(alerta);

  try {
    const targetUrl = `${GOOGLE_SCRIPT_URL}?action=generarQR&timestamp=${Date.now()}`;
    const data = await fetchGoogleScript(targetUrl);

    if (data.status === "ok" && data.qrUrl) {
      qrImage.src = data.qrUrl;
      qrContainer.classList.remove("hidden");
      alerta.remove();
      
      console.log("QR generado exitosamente:", data);
      
      // Mostrar enlace como alternativa
      if (data.qrLink) {
        const linkInfo = document.createElement('p');
        linkInfo.innerHTML = `Enlace directo: <a href="${data.qrLink}" target="_blank">${data.qrLink}</a>`;
        qrContainer.appendChild(linkInfo);
      }
    } else {
      throw new Error(data.msg || "No se pudo generar el QR");
    }
  } catch (error) {
    console.error("Error generando QR:", error);
    alerta.textContent = `⚠️ ${error.message}`;
    alerta.style.color = "red";
    
    // Mostrar enlace directo como fallback
    const directLink = document.createElement('a');
    directLink.href = GOOGLE_SCRIPT_URL;
    directLink.textContent = 'Abrir sistema de asistencia directamente';
    directLink.target = '_blank';
    directLink.style.display = 'block';
    directLink.style.marginTop = '10px';
    alerta.appendChild(document.createElement('br'));
    alerta.appendChild(directLink);
  }

  btnGenerarQR.disabled = false;
  if (btnNuevoQR) btnNuevoQR.disabled = false;
}

// Función auxiliar para mostrar mensajes
function showMessage(message, type = "info") {
  const colors = {
    info: "#007bff",
    success: "green", 
    error: "red",
    warning: "orange"
  };
  
  verifyMessage.innerHTML = message;
  verifyMessage.style.color = colors[type] || colors.info;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de asistencias cargado');
});
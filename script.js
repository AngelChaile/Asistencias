// === CONFIGURACIÓN ===
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVW_EQeCgNgw5wNEIr6mDZhmGs0zb0Ow9IlXTWWBdGRHw_QsQRt3HFzslv3KaPwmrc/exec";

// === ELEMENTOS DEL DOM ===
const btnGenerarQR = document.getElementById("btnGenerarQR");
const btnNuevoQR = document.getElementById("btnNuevoQR");
const qrContainer = document.getElementById("qrContainer");
const qrImage = document.getElementById("qrImage");
const mainContent = document.getElementById("main-content");
const verifyContent = document.getElementById("verify-content");
const verifyMessage = document.getElementById("verify-message");

// === PROXIES CORS ALTERNATIVOS ===
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
  '' // Sin proxy como última opción
];

// === FUNCIÓN PARA HACER FETCH CON INTENTOS Y PROXIES ===
async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const proxy = CORS_PROXIES[attempt % CORS_PROXIES.length];
      const targetUrl = proxy + encodeURIComponent(url);
      
      console.log(`Intento ${attempt + 1} con proxy: ${proxy || 'ninguno'}`);
      
      const response = await fetch(proxy ? targetUrl : url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn('Respuesta no es JSON:', text);
          return { status: "error", msg: "Formato de respuesta inválido" };
        }
      }
    } catch (error) {
      console.warn(`Intento ${attempt + 1} falló:`, error);
      
      if (attempt === retries - 1) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Todos los intentos fallaron");
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
      const data = await fetchWithRetry(targetUrl);
      
      if (data.status === "ok") {
        verifyMessage.innerHTML = `✅ ${data.msg}<br>Redirigiendo para fichar...`;
        verifyMessage.style.color = "green";
        
        // Redirigir directamente al Apps Script para registrar asistencia
        setTimeout(() => {
          const asistenciaUrl = `https://script.google.com/macros/s/AKfycbyVW_EQeCgNgw5wNEIr6mDZhmGs0zb0Ow9IlXTWWBdGRHw_QsQRt3HFzslv3KaPwmrc/exec?registrar=true&token=${token}&place=${place}`;
          window.location.href = asistenciaUrl;
        }, 2000);
        
      } else {
        verifyMessage.innerHTML = `⚠️ ${data.msg}`;
        verifyMessage.style.color = "red";
        
        // Botón para volver
        setTimeout(() => {
          const backButton = document.createElement('button');
          backButton.textContent = 'Volver al inicio';
          backButton.onclick = () => window.location.href = window.location.origin + window.location.pathname;
          verifyMessage.appendChild(document.createElement('br'));
          verifyMessage.appendChild(backButton);
        }, 1500);
      }
    } catch (err) {
      console.error("Error final:", err);
      verifyMessage.innerHTML = "❌ Error de conexión. Redirigiendo directamente al sistema...";
      verifyMessage.style.color = "red";
      
      // Fallback: redirigir directamente al Apps Script
      setTimeout(() => {
        window.location.href = `https://script.google.com/macros/s/AKfycbyVW_EQeCgNgw5wNEIr6mDZhmGs0zb0Ow9IlXTWWBdGRHw_QsQRt3HFzslv3KaPwmrc/exec?token=${token}&place=${place}`;
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
    const data = await fetchWithRetry(targetUrl);

    if (data.qrUrl) {
      qrImage.src = data.qrUrl;
      qrContainer.classList.remove("hidden");
      alerta.remove();
      
      console.log("QR generado exitosamente:", data);
    } else {
      throw new Error("No se recibió URL del QR");
    }
  } catch (error) {
    console.error("Error generando QR:", error);
    alerta.textContent = "⚠️ Error al generar el QR. Intenta recargar la página o usa el enlace directo.";
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
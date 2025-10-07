// === CONFIGURACIÓN ===
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxyX3jSogzTKMnEi6F6beUG-Ltr7hoFuiAJulhcAmXRY5E4lOwyzWWMUDFp15hKohE/exec";

// === ELEMENTOS DEL DOM ===
const btnGenerarQR = document.getElementById("btnGenerarQR");
const btnNuevoQR = document.getElementById("btnNuevoQR");
const qrContainer = document.getElementById("qrContainer");
const qrImage = document.getElementById("qrImage");
const mainContent = document.getElementById("main-content");
const verifyContent = document.getElementById("verify-content");
const verifyMessage = document.getElementById("verify-message");

// === FUNCIÓN PARA HACER FETCH CON MANEJO DE CORS ===
async function fetchWithCORS(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors' // ← Esto evita el error de CORS pero limita la respuesta
    });
    
    // Con 'no-cors' no podemos leer la respuesta, pero podemos ver si la petición se hizo
    return { ok: true, status: 200 };
  } catch (error) {
    console.error('Fetch error:', error);
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
      // Usar proxy CORS o método alternativo
      const corsProxy = "https://cors-anywhere.herokuapp.com/";
      const targetUrl = `${GOOGLE_SCRIPT_URL}?token=${encodeURIComponent(token)}&place=${encodeURIComponent(place)}`;
      
      const response = await fetch(corsProxy + targetUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "ok") {
          verifyMessage.innerHTML = `✅ ${data.msg}<br>Podés fichar ahora.`;
          verifyMessage.style.color = "green";
          
          // Redirigir o mostrar opción para fichar
          setTimeout(() => {
            window.location.href = `https://script.google.com/macros/s/AKfycbxyX3jSogzTKMnEi6F6beUG-Ltr7hoFuiAJulhcAmXRY5E4lOwyzWWMUDFp15hKohE/exec?scan=true&token=${token}&place=${place}`;
          }, 2000);
          
        } else {
          verifyMessage.innerHTML = `⚠️ ${data.msg}`;
          verifyMessage.style.color = "red";
        }
      } else {
        verifyMessage.innerHTML = "❌ Error en la respuesta del servidor";
        verifyMessage.style.color = "red";
      }
    } catch (err) {
      console.error("Error:", err);
      // Fallback: redirigir directamente al Apps Script
      verifyMessage.innerHTML = "Redirigiendo al sistema de asistencia...";
      setTimeout(() => {
        window.location.href = `https://script.google.com/macros/s/AKfycbxyX3jSogzTKMnEi6F6beUG-Ltr7hoFuiAJulhcAmXRY5E4lOwyzWWMUDFp15hKohE/exec?token=${token}&place=${place}`;
      }, 1000);
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
    // Usar directamente el Apps Script sin proxy para generar QR
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=generarQR&timestamp=${Date.now()}`);
    
    if (response.ok) {
      const data = await response.json();

      if (data.qrUrl) {
        qrImage.src = data.qrUrl;
        qrContainer.classList.remove("hidden");
        alerta.remove();
        
        // Mostrar información del QR
        console.log("QR generado:", data);
      } else {
        throw new Error("No se recibió URL del QR");
      }
    } else {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error("Error generando QR:", error);
    alerta.textContent = "⚠️ Error al generar el QR. Intenta recargar la página.";
    alerta.style.color = "red";
  }

  btnGenerarQR.disabled = false;
  btnNuevoQR.disabled = false;
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
// ========== VARIÁVEIS GLOBAIS ==========
let map;
let userLocation = null;
let userMarker = null;
let trafficLayer = null;
let trafficEnabled = false;
let trafficOverlayRect = null;
let locationHistory = [];
let locationWatchId = null;

// Dados de Destaques e Lugares
const highlights = [
  { name: "Praia de Pajuçara", lat: -9.665, lng: -35.715, icon: "🌊" },
  { name: "Ponta Verde", lat: -9.661, lng: -35.704, icon: "🏝️" },
  { name: "Museu da Imagem", lat: -9.668, lng: -35.736, icon: "🏛️" },
  { name: "Praia de Jatiúca", lat: -9.652, lng: -35.704, icon: "🌊" },
  { name: "Praia do Gunga", lat: -9.856, lng: -35.905, icon: "🥥" },
  { name: "Praia do Francês", lat: -9.773, lng: -35.837, icon: "🇫🇷" },
  { name: "Barra de São Miguel", lat: -9.84, lng: -35.903, icon: "🚤" },
];

const nearbyPlaces = [
  { name: "Praia de Pajuçara", lat: -9.665, lng: -35.715, type: "🌊" },
  { name: "Ponta Verde", lat: -9.661, lng: -35.704, type: "🏝️" },
  { name: "Restaurante Divina Gula", lat: -9.667, lng: -35.733, type: "🍽️" },
  { name: "Shopping Pátio", lat: -9.661, lng: -35.703, type: "🛍️" },
  { name: "Hospital Maceió", lat: -9.655, lng: -35.73, type: "🏥" },
];

// ========== FUNÇÃO: EXIBIR NOTIFICAÇÃO ==========
function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #007bff;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    animation: slideDown 0.3s ease;
    font-weight: bold;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

// ========== FUNÇÃO: ATIVAR/DESATIVAR TRÁFICO ==========
function toggleTraffic() {
  if (!map) {
    console.error("Mapa não inicializado");
    return;
  }

  const btn = document.getElementById("traffic-btn");
  if (!btn) return;

  // Se a camada ainda não foi criada, criar uma camada visível como fallback
  if (!trafficLayer) {
    try {
      trafficLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          opacity: 0.45,
        }
      );
      console.log("🔧 Camada de tráfico criada dinamicamente (fallback)");
    } catch (err) {
      console.error("Erro ao criar camada de tráfico:", err);
    }
  }

  if (trafficEnabled) {
    try {
      console.log(
        "map.hasLayer(trafficLayer) antes de remover:",
        map.hasLayer(trafficLayer)
      );
      map.removeLayer(trafficLayer);
      if (trafficOverlayRect && map.hasLayer(trafficOverlayRect)) {
        map.removeLayer(trafficOverlayRect);
        trafficOverlayRect = null;
      }
    } catch (e) {
      console.warn("Aviso: erro ao remover camada de tráfico:", e);
    }
    trafficEnabled = false;
    btn.classList.remove("active");
    showNotification("❌ Tráfico desativado");
  } else {
    try {
      map.addLayer(trafficLayer);
      console.log(
        "map.hasLayer(trafficLayer) após add:",
        map.hasLayer(trafficLayer)
      );
      // Adicionar um overlay visual temporário para confirmar alteração
      try {
        const center = map.getCenter();
        trafficOverlayRect = L.rectangle(
          [
            [center.lat - 0.01, center.lng - 0.02],
            [center.lat + 0.01, center.lng + 0.02],
          ],
          { color: "#ff7800", weight: 1, fillOpacity: 0.12 }
        ).addTo(map);
      } catch (rectErr) {
        console.warn("Erro ao adicionar overlay de debug:", rectErr);
      }
      if (typeof trafficLayer.bringToFront === "function")
        trafficLayer.bringToFront();
    } catch (e) {
      console.error("Erro ao adicionar camada de tráfico:", e);
    }
    trafficEnabled = true;
    btn.classList.add("active");
    showNotification("🚗 Tráfico ativado!");
  }
}

// (Atalho de teclado será registrado ao inicializar o mapa)

// ========== FUNÇÃO: MODO ROTA ==========
function startRouteMode() {
  if (!map) {
    console.error("Mapa não inicializado");
    return;
  }

  const btn = document.getElementById("route-btn");
  if (!btn) return;

  if (btn.classList.contains("active")) {
    btn.classList.remove("active");
    map.off("click");
    showNotification("🛣️ Modo rota desativado");
    return;
  }

  btn.classList.add("active");
  showNotification("🛣️ Clique para marcar origem (verde) e destino (vermelho)");

  let routePoints = [];
  const listener = function (e) {
    routePoints.push(e.latlng);

    if (routePoints.length === 1) {
      L.circleMarker(routePoints[0], {
        radius: 8,
        color: "green",
        weight: 2,
        opacity: 0.8,
      })
        .addTo(map)
        .bindPopup("✅ Origem")
        .openPopup();
      showNotification("✅ Origem marcada. Clique para marcar destino");
    } else if (routePoints.length === 2) {
      L.circleMarker(routePoints[1], {
        radius: 8,
        color: "red",
        weight: 2,
        opacity: 0.8,
      })
        .addTo(map)
        .bindPopup("🎯 Destino")
        .openPopup();

      calculateRoute(routePoints[0], routePoints[1]);
      map.off("click", listener);
      btn.classList.remove("active");
      showNotification("✅ Rota calculada com sucesso!");
    }
  };

  map.on("click", listener);
}

// ========== FUNÇÃO: CALCULAR ROTA ==========
function calculateRoute(origin, destination) {
  if (!map) return;

  const distance = map.distance(origin, destination) / 1000;
  const estimatedTime = Math.round((distance / 40) * 60);

  L.polyline([origin, destination], {
    color: "blue",
    weight: 3,
    opacity: 0.7,
    dashArray: "5, 5",
  }).addTo(map);

  const routeInfo = document.getElementById("route-info");
  if (routeInfo) {
    const routeDetails = document.getElementById("route-details");
    if (routeDetails) {
      routeDetails.innerHTML = `
        <strong>📍 Rota Calculada</strong><br>
        Distância: ${distance.toFixed(1)} km<br>
        Tempo estimado: ${estimatedTime} minutos<br>
        <small>⚠️ Sem informações de tráfico em tempo real</small>
      `;
    }
    routeInfo.classList.remove("hidden");
  }

  showNotification(`📍 Rota: ${distance.toFixed(1)}km - ~${estimatedTime}min`);
}

// ========== FUNÇÃO: MOSTRAR LUGARES PRÓXIMOS ==========
function showNearbyPlaces() {
  if (!map) {
    console.error("Mapa não inicializado");
    return;
  }

  const btn = document.getElementById("places-btn");
  if (!btn) return;

  if (btn.classList.contains("active")) {
    btn.classList.remove("active");
    // Remover marcadores de lugares (mas manter destaques)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarker) {
        if (
          layer._popup &&
          !layer._popup._content.includes("Origem") &&
          !layer._popup._content.includes("Destino") &&
          !layer._popup._content.includes("Você") &&
          !highlights.find((h) => layer._popup._content.includes(h.name))
        ) {
          map.removeLayer(layer);
        }
      }
    });
    showNotification("🏪 Lugares próximos removidos");
    return;
  }

  const currentLocation = userLocation || [-9.66625, -35.7351];
  btn.classList.add("active");

  nearbyPlaces.forEach((place) => {
    const distance =
      map.distance(currentLocation, [place.lat, place.lng]) / 1000;

    const icon = L.divIcon({
      html: `<div style="font-size: 1.5rem; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));">${place.type}</div>`,
      className: "custom-div-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    L.marker([place.lat, place.lng], { icon })
      .addTo(map)
      .bindPopup(`<b>${place.name}</b><br>📏 ${distance.toFixed(1)}km`);
  });

  showNotification("🏪 Lugares próximos exibidos no mapa");
}

// ========== FUNÇÃO: ADICIONAR DESTAQUES ==========
function addHighlights() {
  if (!map) return;

  highlights.forEach((point) => {
    const customIcon = L.divIcon({
      html: `<div style="font-size: 2rem; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));">${point.icon}</div>`,
      className: "custom-div-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });

    L.marker([point.lat, point.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${point.name}</b>`);
  });
}

// ========== FUNÇÃO: RASTREAMENTO DE LOCALIZAÇÃO ==========
function setupLocationTracking() {
  if (!navigator.geolocation) return;

  locationWatchId = navigator.geolocation.watchPosition(
    function (position) {
      const { latitude, longitude } = position.coords;
      userLocation = [latitude, longitude];

      locationHistory.push({
        lat: latitude,
        lng: longitude,
        timestamp: new Date(),
      });

      if (locationHistory.length > 100) {
        locationHistory.shift();
      }

      if (!userMarker && map) {
        const icon = L.divIcon({
          html: '<div style="width: 12px; height: 12px; background: blue; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px blue;"></div>',
          className: "user-location-icon",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        userMarker = L.marker([latitude, longitude], { icon })
          .addTo(map)
          .bindPopup("📍 Você está aqui");
      } else if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
      }
    },
    function (error) {
      console.log("Geolocalização não disponível:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000,
    }
  );
}

// ========== FUNÇÃO: GERAR RESPOSTA DE IA ==========
function generateAIResponse(message) {
  const lowerMessage = message.toLowerCase();

  const knowledge = {
    praia:
      "Em Maceió temos ótimas praias: Pajuçara, Ponta Verde, Jatiúca, Francês e Gunga. Qual você gostaria de visitar? 🏖️",
    hotel:
      "Recomendo Shopping Pátio Maceió, Hotel Jatiúca Resort e Salinas do Maragogi. Todos com excelente estrutura! 🏨",
    restaurante:
      "Divina Gula é excelente para comida mineira! Também recomendo Imperador dos Camarões e Parmegianno. 🍽️",
    segurança:
      "Emergências: Polícia 190, Bombeiros 193, SAMU 192. Maceió é geralmente segura turísticamente. 👮",
    transporte:
      "Use aplicativos de transportes ou táxis. Ônibus também disponível. A cidade é compacta e fácil de navegar. 🚗",
    clima:
      "Maceió tem clima tropical o ano todo! Melhor época: janeiro a março. Leve protetor solar! ☀️",
  };

  for (const key in knowledge) {
    if (lowerMessage.includes(key)) {
      return knowledge[key];
    }
  }

  return "🤖 Desculpe, não tenho informações sobre isso. Tente perguntar sobre: praias, hotéis, restaurantes, segurança, transporte ou clima!";
}

// ========== FUNÇÃO: INICIALIZAR ASSISTENTE DE IA ==========
function initAIAssistant() {
  const chatBtn = document.getElementById("ai-chat-btn");
  const closeBtn = document.getElementById("ai-close-btn");
  const sendBtn = document.getElementById("ai-send-btn");
  const input = document.getElementById("ai-input");
  const chatWindow = document.getElementById("ai-chat-window");
  const messagesDiv = document.getElementById("ai-messages");

  if (!input || !messagesDiv) {
    console.warn("Elementos do assistente de IA não encontrados");
    return;
  }

  if (chatBtn) {
    chatBtn.addEventListener("click", () => {
      chatWindow.classList.toggle("active");
      if (chatWindow.classList.contains("active")) {
        input.focus();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatWindow.classList.remove("active");
    });
  }

  const sendMsg = () => {
    const msg = input.value.trim();
    if (!msg) return;

    const userMsg = document.createElement("div");
    userMsg.className = "ai-message user";
    userMsg.textContent = msg;
    messagesDiv.appendChild(userMsg);
    input.value = "";

    setTimeout(() => {
      const botMsg = document.createElement("div");
      botMsg.className = "ai-message bot";
      botMsg.textContent = generateAIResponse(msg);
      messagesDiv.appendChild(botMsg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 500);
  };

  if (sendBtn) sendBtn.addEventListener("click", sendMsg);
  if (input)
    input.addEventListener("keypress", (e) => e.key === "Enter" && sendMsg());
}

// ========== ESTILOS DE ANIMAÇÃO ==========
const style = document.createElement("style");
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);

// ========== INICIALIZAÇÃO AO CARREGAR DOCUMENTO ==========
function initializeMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.error("❌ Elemento do mapa não encontrado!");
    return false;
  }
  // Evitar inicialização múltipla
  if (window._mapAdvancedInitialized) {
    console.warn("⚠️ initializeMap: já inicializado (flag global)");
    return true;
  }
  if (map && typeof L !== "undefined" && map instanceof L.Map) {
    console.warn("⚠️ initializeMap: já existe um objeto Leaflet 'map'");
    window._mapAdvancedInitialized = true;
    return true;
  }

  console.log("🔧 Inicializando mapa...");

  try {
    // Evitar L.map se o container já foi inicializado por outro script
    if (mapContainer._leaflet_id) {
      console.warn(
        "⚠️ Container do mapa já possui _leaflet_id — tentando localizar instância existente..."
      );

      // Tentar encontrar uma instância de Leaflet já criada (procura em `window`)
      if (typeof L !== "undefined") {
        for (const key in window) {
          try {
            if (window[key] instanceof L.Map) {
              map = window[key];
              console.log(`✅ Instância Leaflet encontrada em window.${key}`);
              break;
            }
          } catch (e) {
            /* ignore */
          }
        }
      }

      if (map) {
        // Preparar camada de tráfico se necessário
        if (!trafficLayer && typeof L !== "undefined") {
          try {
            trafficLayer = L.tileLayer(
              "https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
              { attribution: "© OpenStreetMap contributors", opacity: 0.3 }
            );
            console.log("🔧 Camada de tráfico preparada (instância existente)");
          } catch (err) {
            console.warn("Não foi possível criar camada de tráfico:", err);
          }
        }

        // Conectar controles e funcionalidades mesmo sem criar novo mapa
        try {
          const trafficBtn = document.getElementById("traffic-btn");
          const routeBtn = document.getElementById("route-btn");
          const placesBtn = document.getElementById("places-btn");

          function safeAdd(btn, fn, name) {
            if (!btn) return console.warn(`⚠️ Botão ${name} não encontrado`);
            btn.addEventListener("click", fn);
            console.log(
              `✅ Listener adicionado para ${name} (instância existente)`
            );
          }

          safeAdd(trafficBtn, () => toggleTraffic(), "tráfico");
          safeAdd(routeBtn, () => startRouteMode(), "rota");
          safeAdd(placesBtn, () => showNearbyPlaces(), "lugares");

          // Adicionar destaques e iniciar assistente/localização
          try {
            addHighlights();
          } catch (err) {
            console.warn(
              "Erro ao adicionar destaques em instância existente:",
              err
            );
          }

          try {
            setupLocationTracking();
          } catch (err) {
            console.warn(
              "Erro ao iniciar rastreamento em instância existente:",
              err
            );
          }

          try {
            initAIAssistant();
          } catch (err) {
            console.warn(
              "Erro ao inicializar assistente em instância existente:",
              err
            );
          }
        } catch (err) {
          console.warn(
            "Erro ao conectar controles na instância existente:",
            err
          );
        }

        window._mapAdvancedInitialized = true;
        return true;
      }

      // Se não encontrou uma instância, marcar inicializado para evitar loops
      window._mapAdvancedInitialized = true;
      return true;
    }

    // Inicializar Leaflet
    map = L.map("map").setView([-9.66625, -35.7351], 13);
    console.log("✅ Mapa Leaflet criado");

    // Camada de Base
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    console.log("✅ Camada de base adicionada");

    // Camada de Tráfico
    trafficLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
        opacity: 0.3,
      }
    );
    console.log("✅ Camada de tráfico criada");

    // ========== CONECTAR BOTÕES AOS EVENTOS ==========
    const trafficBtn = document.getElementById("traffic-btn");
    const routeBtn = document.getElementById("route-btn");
    const placesBtn = document.getElementById("places-btn");

    console.log("🔍 Procurando botões...");
    console.log("Tráfico:", trafficBtn ? "✅ Encontrado" : "❌ Não encontrado");
    console.log("Rota:", routeBtn ? "✅ Encontrado" : "❌ Não encontrado");
    console.log("Lugares:", placesBtn ? "✅ Encontrado" : "❌ Não encontrado");

    // Testar acesso direto aos botões
    if (!trafficBtn) console.error("❌ #traffic-btn não encontrado no HTML!");
    if (!routeBtn) console.error("❌ #route-btn não encontrado no HTML!");
    if (!placesBtn) console.error("❌ #places-btn não encontrado no HTML!");

    // Função auxiliar para adicionar listener
    function addButtonListener(btn, name, callback) {
      if (!btn) {
        console.error(`❌ Botão ${name} não existe`);
        return false;
      }

      btn.addEventListener("click", callback);

      // Testar o listener
      console.log(`✅ Listener adicionado para ${name}. Testando...`);

      // Verifica se o botão está no DOM
      if (!document.body.contains(btn)) {
        console.warn(`⚠️ ${name} não está no DOM!`);
      }

      return true;
    }

    addButtonListener(trafficBtn, "tráfico", function (e) {
      console.log("🚗 CLICK NO BOTÃO DE TRÁFICO!");
      toggleTraffic();
    });

    addButtonListener(routeBtn, "rota", function (e) {
      console.log("🛣️ CLICK NO BOTÃO DE ROTA!");
      startRouteMode();
    });

    addButtonListener(placesBtn, "lugares", function (e) {
      console.log("🏪 CLICK NO BOTÃO DE LUGARES!");
      showNearbyPlaces();
    });

    // Listener em modo de captura para detectar cliques mesmo quando propagação é interrompida
    document.addEventListener(
      "click",
      function (e) {
        const btn = e.target.closest && e.target.closest("button");
        if (!btn) return;
        if (btn.id === "traffic-btn")
          console.log("(capture) click traffic-btn detectado");
        if (btn.id === "route-btn")
          console.log("(capture) click route-btn detectado");
        if (btn.id === "places-btn")
          console.log("(capture) click places-btn detectado");
      },
      true
    );

    // Inicializar funcionalidades
    setupLocationTracking();
    console.log("✅ Rastreamento de localização iniciado");

    addHighlights();
    console.log("✅ Destaques adicionados");

    initAIAssistant();
    console.log("✅ Assistente de IA inicializado");

    // Registrar atalho de teclado para alternar tráfico (ignorar quando um input estiver em foco)
    document.addEventListener("keydown", function (e) {
      const active = document.activeElement;
      const isInputFocused =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable);
      if (isInputFocused) return; // não responder quando digitando
      if (e.key === "t" || e.key === "T") {
        console.log(
          "Atalho 't' pressionado - alternando tráfico (via initializeMap)"
        );
        toggleTraffic();
      }
    });

    console.log("✅ Mapa inicializado com sucesso!");
    showNotification("✅ Bem-vindo! Use os botões para explorar o mapa");
    // Marcar como inicializado para evitar duplicação
    window._mapAdvancedInitialized = true;
    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar mapa:", error);
    return false;
  }
}

// Aguardar o Leaflet estar disponível
function waitForLeaflet() {
  if (typeof L !== "undefined") {
    console.log("✅ Leaflet detectado! Inicializando...");
    // Aguardar um pouco antes de inicializar
    setTimeout(() => {
      initializeMap();
    }, 500);
  } else {
    console.log("⏳ Aguardando Leaflet...");
    setTimeout(waitForLeaflet, 100);
  }
}

// Iniciar quando o documento estiver pronto
console.log("📜 Script map-advanced.js carregado!");
if (document.readyState === "loading") {
  console.log("⏳ Documento ainda carregando, aguardando DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOMContentLoaded disparado!");
    waitForLeaflet();
  });
} else {
  console.log("✅ Documento já carregado, inicializando...");
  waitForLeaflet();
}

// Debug button (temporário) — permite testar toggleTraffic() diretamente
(function () {
  if (!document.getElementById("map-debug-toggle")) {
    const btn = document.createElement("button");
    btn.id = "map-debug-toggle";
    btn.textContent = "Debug: Toggle Tráfego";
    btn.style.cssText =
      "position:fixed;right:12px;bottom:12px;z-index:1002;padding:8px 10px;background:#ff9800;color:#fff;border:none;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
    btn.addEventListener("click", () => {
      if (typeof toggleTraffic === "function") {
        console.log("DEBUG: botão de debug clicado -> toggleTraffic()");
        toggleTraffic();
      } else {
        console.warn("DEBUG: toggleTraffic não disponível");
      }
    });
    document.body.appendChild(btn);
  }
})();

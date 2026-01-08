// Simple animations and interactions
document.addEventListener("DOMContentLoaded", function () {
  // Dark Mode Toggle
  const toggleButton = document.createElement("button");
  toggleButton.innerText = "🌙";
  toggleButton.classList.add("theme-toggle");
  toggleButton.setAttribute("aria-label", "Alternar tema");
  document.body.appendChild(toggleButton);

  // Check local storage for theme preference
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
      toggleButton.innerText = "☀️";
    }
  }

  toggleButton.addEventListener("click", () => {
    let theme = "light";
    if (document.documentElement.getAttribute("data-theme") !== "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      theme = "dark";
      toggleButton.innerText = "☀️";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      toggleButton.innerText = "🌙";
    }
    localStorage.setItem("theme", theme);
  });

  // Add hover effects to cards
  const cards = document.querySelectorAll(".highlight-card, .service-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-5px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });

  // Category click handlers
  const categories = document.querySelectorAll(".category");
  categories.forEach((category) => {
    category.addEventListener("click", () => {
      const categoryName = category
        .querySelector(".category-name")
        .textContent.trim();
      const routes = {
        "Pontos Turísticos": "pontos-turisticos.html",
        Hotéis: "hoteis.html",
        Restaurantes: "restaurantes.html",
        Saúde: "saude.html",
        Educação: "educacao.html",
        Transporte: "transporte.html",
        Eventos: "eventos.html",
        Segurança: "seguranca.html",
      };
      if (routes[categoryName]) {
        window.location.href = routes[categoryName];
      }
    });
  });

  // Search functionality
  const searchButton = document.querySelector(".search-button");
  const searchInput = document.querySelector(".search-input");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const cards = document.querySelectorAll(".highlight-card");

      cards.forEach((card) => {
        const title = card
          .querySelector(".highlight-title")
          .textContent.toLowerCase();
        const location = card
          .querySelector(".highlight-location")
          .textContent.toLowerCase();

        if (title.includes(searchTerm) || location.includes(searchTerm)) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  // Simulate loading
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 1000);

  // Add some dynamic content
  const highlights = [
    { title: "Praia de Pajuçara", location: "Maceió, AL", rating: 5 },
    { title: "Ponta Verde", location: "Maceió, AL", rating: 5 },
    { title: "Museu da Imagem", location: "Maceió, AL", rating: 4 },
    { title: "Praia de Jatiúca", location: "Maceió, AL", rating: 5 },
    { title: "Praia do Gunga", location: "Roteiro, AL", rating: 5 },
    { title: "Praia do Francês", location: "Marechal Deodoro, AL", rating: 5 },
    {
      title: "Barra de São Miguel",
      location: "Barra de São Miguel, AL",
      rating: 5,
    },
  ];

  // Update highlights dynamically
  const highlightCards = document.querySelectorAll(".highlight-card");
  highlightCards.forEach((card, index) => {
    if (highlights[index]) {
      const title = card.querySelector(".highlight-title");
      const location = card.querySelector(".highlight-location");
      const rating = card.querySelector(".highlight-rating");

      if (title) title.textContent = highlights[index].title;
      if (location) location.textContent = highlights[index].location;

      if (rating) {
        let stars = "⭐";
        for (let i = 1; i < highlights[index].rating; i++) {
          stars += "⭐";
        }
        rating.innerHTML = stars;
      }
    }
  });

  // Highlight cards click handlers
  highlightCards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const title = card.querySelector(".highlight-title").textContent.trim();
      const routes = {
        "Praia de Pajuçara": "praia-pajucara.html",
        "Ponta Verde": "ponta-verde.html",
        "Museu da Imagem": "museu-imagem.html",
        "Praia de Jatiúca": "praia-jatiuca.html",
        "Praia do Gunga": "praia-gunga.html",
        "Praia do Francês": "praia-frances.html",
        "Barra de São Miguel": "barra-sao-miguel.html",
      };
      if (routes[title]) {
        window.location.href = routes[title];
      }
    });
  });

  // Service cards click handlers
  const serviceCards = document.querySelectorAll(".service-card");
  serviceCards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const title = card.querySelector(".service-title").textContent.trim();
      const routes = {
        Hospitais: "hospitais.html",
        Transporte: "transporte.html",
        Segurança: "seguranca.html",
        Farmácias: "farmacias.html",
      };
      if (routes[title]) {
        window.location.href = routes[title];
      }
    });
  });

  // Initialize Leaflet Map
  const mapElement = document.getElementById("map");
  if (mapElement) {
    const map = L.map("map").setView([-9.6658, -35.7353], 13); // Maceió coordinates

    // Camada 1: Padrão (OpenStreetMap)
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    // Camada 2: Satélite (Esri World Imagery)
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 19,
        detectRetina: true,
      }
    );

    // Camada 3: Topográfico (OpenTopoMap)
    const topoLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      }
    );

    // Adiciona a camada padrão inicial
    osmLayer.addTo(map);

    // Controle de camadas
    const baseLayers = {
      "Mapa de Rua": osmLayer,
      Satélite: satelliteLayer,
      Topográfico: topoLayer,
    };

    L.control.layers(baseLayers).addTo(map);

    L.marker([-9.6658, -35.7353])
      .addTo(map)
      .bindPopup("Maceió, Alagoas")
      .openPopup();

    // Sistema de Notificações de Eventos
    const events = [
      { title: "Festival de Verão", lat: -9.6658, lng: -35.7353 },
      { title: "Feira de Artesanato", lat: -9.66, lng: -35.74 },
      { title: "Show de Forró", lat: -9.65, lng: -35.73 },
    ];

    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function showNotification(message) {
      const toast = document.createElement("div");
      toast.className = "notification-toast";
      toast.innerHTML = `🔔 ${message}`;
      document.body.appendChild(toast);
      void toast.offsetWidth; // Trigger reflow
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => document.body.removeChild(toast), 500);
      }, 5000);
    }

    function checkNearbyEvents(userLat, userLng) {
      events.forEach((event) => {
        const dist = getDistanceFromLatLonInKm(
          userLat,
          userLng,
          event.lat,
          event.lng
        );
        if (dist < 5) {
          setTimeout(() => {
            showNotification(
              `${event.title} está a ${dist.toFixed(1)}km de você!`
            );
          }, 1000);
        }
      });
    }

    // Botão de Minha Localização
    const locateControl = L.Control.extend({
      options: {
        position: "topleft",
      },
      onAdd: function (map) {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-custom"
        );
        container.style.backgroundColor = "white";
        container.style.width = "34px";
        container.style.height = "34px";
        container.style.cursor = "pointer";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.title = "Minha Localização";
        container.innerHTML = "<span style='font-size: 18px;'>📍</span>";

        container.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 15);
                L.marker([latitude, longitude])
                  .addTo(map)
                  .bindPopup("Você está aqui!")
                  .openPopup();
                checkNearbyEvents(latitude, longitude);
              },
              () => alert("Não foi possível obter sua localização.")
            );
          }
        };
        return container;
      },
    });
    map.addControl(new locateControl());
  }

  // Back to Top Button Logic
  const backToTopButton = document.getElementById("back-to-top");
  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopButton.classList.add("show");
      } else {
        backToTopButton.classList.remove("show");
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
});

// Add scroll animation
window.addEventListener("scroll", () => {
  const elements = document.querySelectorAll(".fade-in-up");
  elements.forEach((element) => {
    const elementPosition = element.getBoundingClientRect().top;
    const screenPosition = window.innerHeight / 1.3;

    if (elementPosition < screenPosition) {
      element.style.opacity = 1;
      element.style.transform = "translateY(0)";
    }
  });
});

// Real-time Bus Schedule Simulation
document.addEventListener("DOMContentLoaded", function () {
  const busScheduleBody = document.getElementById("bus-schedule-body");
  if (busScheduleBody) {
    const modal = document.getElementById("itinerary-modal");
    const modalTitle = document.querySelector(".modal-title");
    const itineraryList = document.getElementById("itinerary-list");
    const closeBtn = document.querySelector(".close");

    const busLines = [
      { line: "0602", dest: "Salvador Lyra" },
      { line: "0703", dest: "Benedito Bentes" },
      { line: "0704", dest: "Universidade" },
      { line: "0717", dest: "Ponta Verde" },
      { line: "0223", dest: "Ipioca" },
      { line: "0606", dest: "Maceió Shopping" },
      { line: "0052", dest: "Centro" },
    ];

    const busItineraries = {
      "0602": [
        "Terminal Salvador Lyra",
        "Av. Menino Marcelo",
        "Shopping Pátio",
        "Centro",
      ],
      "0703": [
        "Terminal Benedito Bentes",
        "Av. Cachoeira do Meirim",
        "Shopping Pátio",
        "Centro",
      ],
      "0704": [
        "Universidade Federal",
        "Av. Durval de Góes Monteiro",
        "Centro",
        "Ponta Verde",
      ],
      "0717": ["Ponta Verde", "Jatiúca", "Cruz das Almas", "Jacarecica"],
      "0223": ["Ipioca", "Guaxuma", "Jacarecica", "Cruz das Almas", "Centro"],
      "0606": ["Maceió Shopping", "Jatiúca", "Ponta Verde", "Pajuçara"],
      "0052": ["Centro", "Levada", "Cambona", "Fernão Velho"],
    };

    let itineraryMap = null;
    let animationId = null;

    // Lógica do Modal
    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.style.display = "none";
        if (animationId) cancelAnimationFrame(animationId);
      };
    }

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
        if (animationId) cancelAnimationFrame(animationId);
      }
    };

    function showItinerary(line, dest) {
      if (!modal) return;

      modalTitle.textContent = `Itinerário - Linha ${line} (${dest})`;
      const stops = busItineraries[line] || ["Itinerário não disponível."];

      if (Array.isArray(stops)) {
        itineraryList.innerHTML = `
            <ul style="list-style-type: none; padding: 0;">
                ${stops
                  .map(
                    (stop) => `
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); display: flex; align-items: center;">
                        <span style="color: var(--primary); margin-right: 10px;">●</span> ${stop}
                    </li>
                `
                  )
                  .join("")}
            </ul>
          `;
      } else {
        itineraryList.innerHTML = `<p>${stops}</p>`;
      }

      modal.style.display = "flex";

      // Inicializa o mapa do itinerário
      setTimeout(() => {
        const mapContainer = document.getElementById("itinerary-map");
        if (mapContainer) {
          if (itineraryMap) {
            itineraryMap.remove();
            if (animationId) cancelAnimationFrame(animationId);
          }
          itineraryMap = L.map("itinerary-map").setView(
            [-9.6658, -35.7353],
            12
          );
          itineraryMap.invalidateSize();

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
          }).addTo(itineraryMap);

          // Coordenadas aproximadas das rotas (Simulação)
          const routePaths = {
            "0602": [
              [-9.553, -35.756],
              [-9.58, -35.74],
              [-9.62, -35.735],
              [-9.665, -35.735],
            ],
            "0703": [
              [-9.562, -35.765],
              [-9.59, -35.75],
              [-9.63, -35.73],
              [-9.665, -35.735],
            ],
            "0704": [
              [-9.555, -35.78],
              [-9.6, -35.76],
              [-9.65, -35.72],
              [-9.66, -35.705],
            ],
            "0717": [
              [-9.66, -35.705],
              [-9.65, -35.7],
              [-9.64, -35.69],
              [-9.62, -35.68],
            ],
            "0223": [
              [-9.5, -35.6],
              [-9.55, -35.65],
              [-9.62, -35.68],
              [-9.665, -35.735],
            ],
            "0606": [
              [-9.65, -35.72],
              [-9.655, -35.71],
              [-9.66, -35.705],
              [-9.668, -35.715],
            ],
            "0052": [
              [-9.665, -35.735],
              [-9.66, -35.745],
              [-9.65, -35.755],
              [-9.6, -35.8],
            ],
          };

          const path = routePaths[line] || [
            [-9.6658, -35.7353],
            [-9.65, -35.72],
          ];

          const polyline = L.polyline(path, { color: "blue", weight: 4 }).addTo(
            itineraryMap
          );
          itineraryMap.fitBounds(polyline.getBounds(), { padding: [20, 20] });

          // Adicionar paradas como pontos
          const stopNames = busItineraries[line] || [];
          path.forEach((point, index) => {
            L.circleMarker(point, {
              radius: 5,
              fillColor: "white",
              color: "#007bff",
              weight: 2,
              opacity: 1,
              fillOpacity: 1,
            })
              .addTo(itineraryMap)
              .bindPopup(stopNames[index] || `Parada ${index + 1}`);
          });

          // Ícone do ônibus
          const busIcon = L.divIcon({
            className: "bus-marker",
            html: '<div style="font-size: 24px;">🚌</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          const busMarker = L.marker(path[0], { icon: busIcon })
            .addTo(itineraryMap)
            .bindPopup(`Ônibus ${line} - Em trânsito`);

          // Botão para centralizar no ônibus
          const centerBusControl = L.Control.extend({
            options: {
              position: "topright",
            },
            onAdd: function (map) {
              const container = L.DomUtil.create(
                "div",
                "leaflet-bar leaflet-control leaflet-control-custom"
              );
              container.style.backgroundColor = "white";
              container.style.width = "34px";
              container.style.height = "34px";
              container.style.cursor = "pointer";
              container.style.display = "flex";
              container.style.alignItems = "center";
              container.style.justifyContent = "center";
              container.title = "Centralizar no Ônibus";
              container.innerHTML = "<span style='font-size: 18px;'>🎯</span>";

              container.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                map.setView(busMarker.getLatLng(), 15);
              };
              return container;
            },
          });
          itineraryMap.addControl(new centerBusControl());

          // Animação do ônibus
          let step = 0;
          let segment = 0;
          const speed = 0.008; // Velocidade da animação

          function animateBus() {
            if (!itineraryMap) return;

            step += speed;
            if (step > 1) {
              step = 0;
              segment++;
              if (segment >= path.length - 1) {
                segment = 0; // Reinicia a rota
              }
            }

            const start = path[segment];
            const end = path[segment + 1];
            const lat = start[0] + (end[0] - start[0]) * step;
            const lng = start[1] + (end[1] - start[1]) * step;

            busMarker.setLatLng([lat, lng]);
            animationId = requestAnimationFrame(animateBus);
          }

          animateBus();
        }
      }, 200);
    }

    // Estado inicial dos ônibus
    let currentBuses = [];

    function initBuses() {
      const shuffled = [...busLines].sort(() => 0.5 - Math.random());
      currentBuses = shuffled
        .slice(0, 5)
        .map((bus) => ({
          ...bus,
          minutes: Math.floor(Math.random() * 15) + 2,
        }))
        .sort((a, b) => a.minutes - b.minutes);
    }

    initBuses();

    function renderBusSchedule() {
      busScheduleBody.innerHTML = "";
      currentBuses.forEach((bus) => {
        const status = bus.minutes <= 5 ? "Chegando" : "No horário";
        const statusClass =
          bus.minutes <= 5 ? "status-arriving" : "status-on-time";

        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        row.title = "Clique para ver o itinerário";
        row.onclick = () => showItinerary(bus.line, bus.dest);

        row.innerHTML = `
          <td><span class="badge badge-trending">${bus.line}</span></td>
          <td>${bus.dest}</td>
          <td>${bus.minutes} min</td>
          <td><span class="status-indicator ${statusClass}">${status}</span></td>
        `;
        busScheduleBody.appendChild(row);
      });
    }

    function updateBusSchedule() {
      // Simula a passagem do tempo: decrementa minutos
      currentBuses = currentBuses
        .map((bus) => ({
          ...bus,
          minutes: Math.max(0, bus.minutes - 1),
        }))
        .filter((bus) => bus.minutes > 0);

      // Adiciona novos ônibus se necessário para manter a lista cheia
      while (currentBuses.length < 5) {
        const randomBus = busLines[Math.floor(Math.random() * busLines.length)];
        currentBuses.push({
          ...randomBus,
          minutes: Math.floor(Math.random() * 20) + 10,
        });
      }

      // Ordena por tempo de chegada
      currentBuses.sort((a, b) => a.minutes - b.minutes);

      renderBusSchedule();
    }

    updateBusSchedule();
    setInterval(updateBusSchedule, 15000); // Atualiza a cada 15 segundos
  }
});

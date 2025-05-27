let currentRound = localStorage.getItem("currentRound") 
  ? parseInt(localStorage.getItem("currentRound"))
  : 1;

let latImg = null;
let lngImg = null;
let latScelta = null;
let lngScelta = null;

const accessToken = 'MLY|24196441236640098|48855c97037b41b5c0350fa03736be68';

function caricaImmagineCasuale() {
  const bbox = '6.6,36.5,18.5,47.1';

  fetch(`https://graph.mapillary.com/images?fields=id,thumb_1024_url,computed_geometry&limit=30&bbox=${bbox}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const immagini = data.data;

      if (!immagini || immagini.length === 0) {
        alert("Nessuna immagine trovata nella zona selezionata.");
        return;
      }

      const immaginiConGeo = immagini.filter(img => img.computed_geometry && img.computed_geometry.coordinates);

      if (immaginiConGeo.length === 0) {
        alert("Nessuna immagine con coordinate trovata.");
        return;
      }

      const casuale = immaginiConGeo[Math.floor(Math.random() * immaginiConGeo.length)];
      const [lng, lat] = casuale.computed_geometry.coordinates;

      latImg = lat;
      lngImg = lng;

      console.log(latImg, lngImg);

      // Mostra immagine
      const img = new Image();
      img.onload = () => {
        document.getElementById('streetImage').src = img.src;
      };
      img.src = casuale.thumb_1024_url;
    })
    .catch(error => {
      console.error("Errore nel caricamento:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  caricaImmagineCasuale();
});

document.addEventListener("DOMContentLoaded", () => {
  let numberRandom = Math.floor(Math.random() * 100000) + 1;
  const title = document.getElementById("title");
  title.innerHTML = "Game #" + numberRandom;
});

const key = 'WzR2w1Fby2OntohproWc';
const mappa = document.getElementById("map");

mappa.addEventListener("mouseenter", () => {
  mappa.style.width = "400px";
  mappa.style.height = "330px";
});

mappa.addEventListener("mouseleave", () => {
  mappa.style.width = "200px";
  mappa.style.height = "200px";
});

const map = L.map('map', {
  zoomControl: false,
  maxZoom: 20
}).setView([20, 40], 0);

const layer = L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
  tileSize: 600,
  zoomOffset: -1,
  minZoom: 3,
  maxZoom: 20,
  attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  crossOrigin: true
}).addTo(map);

let currentMarker = null;

map.on('click', function(e) {
  const { lat, lng } = e.latlng;

  // Rimuovi il marker precedente se esiste
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  // Crea un nuovo marker
  currentMarker = L.marker([lat, lng]).addTo(map);

  latScelta = lat;
  lngScelta = lng;
});

map.on("contextmenu", function(e) {
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }
  e.preventDefault();
});

document.querySelector(".button button").addEventListener("click", () => {
  if (latScelta === null || lngScelta === null) {
    alert("Devi prima scegliere una posizione sulla mappa!");
    return;
  }

  if (latImg === null || lngImg === null) {
    alert("Attendi che l'immagine venga caricata prima di cliccare.");
    return;
  }

  const distanza = vincentyDistance(latImg, lngImg, latScelta, lngScelta);
  const distanzaDisplay = distanza.toFixed(2);

  // Richiama il reverse geocoding per ottenere la posizione reale (indirizzo)
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latImg}&lon=${lngImg}`, {
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      const indirizzo = data.display_name || `(${latImg.toFixed(5)}, ${lngImg.toFixed(5)})`;
      
      alert(`Hai posizionato il marker a ${distanzaDisplay} km dalla posizione reale della foto!
La posizione reale è: ${indirizzo}`);
      
      // Salva la distanza del round corrente
      let storedDistances = localStorage.getItem("roundDistances");
      let distances = storedDistances ? JSON.parse(storedDistances) : [];
      distances.push(distanza);
      localStorage.setItem("roundDistances", JSON.stringify(distances));

      // Procedi al fine round o passa al round successivo
      if (confirm("Procedere al round successivo?")) {
        currentRound += 1;
        localStorage.setItem("currentRound", currentRound);
        location.reload();
      }
    })
    .catch(error => {
      console.error("Errore nel reverse geocoding:", error);
      alert(`Hai posizionato il marker a ${distanzaDisplay} km dalla posizione reale della foto!
Impossibile recuperare l'indirizzo, le coordinate sono: (${latImg.toFixed(5)}, ${lngImg.toFixed(5)})`);
    });

  L.circle([0, 0], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0,
    radius: 0
  }).addTo(map);
});

function vincentyDistance(lat1, lon1, lat2, lon2) {
  const a = 6378137.0; // semiasse maggiore (m)
  const f = 1 / 298.257223563; // appiattimento
  const b = 6356752.314245; // semiasse minore (m)

  const toRad = angle => angle * Math.PI / 180;

  const L = toRad(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(toRad(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(toRad(lat2)));

  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP;
  let iterLimit = 100;
  let sinLambda, cosLambda, sinSigma, cosSigma, sigma, sinAlpha, cosSqAlpha, cos2SigmaM, C;

  do {
    sinLambda = Math.sin(lambda);
    cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) * (cosU2 * sinLambda) +
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * 
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
    );

    if (sinSigma === 0) return 0; // coincidenti

    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;

    cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha : 0;
    C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (
      sigma + C * sinSigma * (
        cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)
      )
    );
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

  if (iterLimit === 0) {
    return NaN; // formula non converge
  }

  const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (
    4096 + uSq * (-768 + uSq * (320 - 175 * uSq))
  );
  const B = uSq / 1024 * (
    256 + uSq * (-128 + uSq * (74 - 47 * uSq))
  );
  const deltaSigma = B * sinSigma * (
    cos2SigmaM + B / 4 * (
      cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - 
      B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)
    )
  );

  const s = b * A * (sigma - deltaSigma);

  return s / 1000; // distanza in km
}

let timerInterval = null;

function endRound() {
  alert("Time expired!");

  const all = document.querySelector(".total");
  all.style.opacity = "0.1";

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Incrementa il round e salvalo nel localStorage
  currentRound += 1;
  localStorage.setItem("currentRound", currentRound);

  if (currentRound > totalRounds) {
    
    let storedDistances = localStorage.getItem("roundDistances");
    let distances = storedDistances ? JSON.parse(storedDistances) : [];
    let totalDistance = distances.reduce((sum, d) => sum + d, 0);
    localStorage.setItem("totalDistance", totalDistance.toFixed(2));


    localStorage.removeItem("currentRound");
    window.location.href = "result.html";
  } else {
    // Aggiorna la UI con il nuovo round
    document.getElementById("round").innerHTML = "Rounds: " + currentRound + "/" + totalRounds;
    window.location.href = "game.html";
    // Avvia il timer per il nuovo round
    startTimer();
  }
}

function startTimer() {
  const timerP = document.getElementById("timer");
  const matchSettings = JSON.parse(localStorage.getItem("matchSettings") || "{}");

  let time = 20; // default
  if (matchSettings.time === "20s") time = 20;
  else if (matchSettings.time === "40s") time = 40;
  else if (matchSettings.time === "60s") time = 60;

  timerP.style.color = "white";
  timerP.innerHTML = "remaining time: " + time;

  timerInterval = setInterval(() => {
    time -= 1;
    timerP.innerHTML = "remaining time: " + time;
    if (time < 10) {
      timerP.style.color = "red";
    }
    if (time <= 0) {
      clearInterval(timerInterval);
      endRound();
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  
  const matchSettings = JSON.parse(localStorage.getItem("matchSettings") || "{}");

  if (matchSettings.rounds === "2") totalRounds = 2;
  else if (matchSettings.rounds === "4") totalRounds = 4;
  else if (matchSettings.rounds === "6") totalRounds = 6;

  document.getElementById("round").innerHTML = "Rounds: " + currentRound + "/" + totalRounds;

  if (currentRound > totalRounds) {
    
    let storedDistances = localStorage.getItem("roundDistances");
    let distances = storedDistances ? JSON.parse(storedDistances) : [];
    let totalDistance = distances.reduce((sum, d) => sum + d, 0);
    localStorage.setItem("totalDistance", totalDistance.toFixed(2));


    localStorage.removeItem("currentRound");
    window.location.href = "result.html";
  }

  startTimer();
});

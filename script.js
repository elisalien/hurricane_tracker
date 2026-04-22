// Base de données des ouragans avec leurs statistiques
const hurricaneData = {
    ian: {
        name: "IAN",
        category: "4",
        wind: "250 km/h",
        pressure: "936 hPa",
        coords: "26.0°N, 82.5°W",
        color: "#ff3366", // Rouge/Rose pour intense
        size: 80
    },
    katrina: {
        name: "KATRINA",
        category: "5",
        wind: "280 km/h",
        pressure: "902 hPa",
        coords: "28.9°N, 89.6°W",
        color: "#cc00ff", // Violet pour extrême
        size: 110
    },
    dorian: {
        name: "DORIAN",
        category: "5",
        wind: "295 km/h",
        pressure: "910 hPa",
        coords: "26.5°N, 77.0°W",
        color: "#ff0000", // Rouge pour dévastateur
        size: 100
    }
};

let currentHurricane = 'ian';

// --- GESTION DE L'INTERFACE ---

// Mise à jour de l'horloge UTC
function updateClock() {
    const now = new Date();
    document.getElementById('timestamp').innerText = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

// Changement de Cyclone
const buttons = document.querySelectorAll('.hurricane-btn');
buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Gérer la classe active
        buttons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Récupérer les données
        const id = e.target.getAttribute('data-id');
        currentHurricane = id;
        const data = hurricaneData[id];

        // Mettre à jour les statistiques
        document.getElementById('sys-name').innerText = data.name;
        document.getElementById('sys-cat').innerText = data.category;
        document.getElementById('sys-wind').innerText = data.wind;
        document.getElementById('sys-pressure').innerText = data.pressure;
        document.getElementById('sys-coords').innerText = data.coords;
        
        // Categorie 5 = couleur différente
        const catElement = document.getElementById('sys-cat');
        if(data.category === "5") {
            catElement.style.color = "#cc00ff";
            catElement.style.textShadow = "0 0 5px #cc00ff";
        } else {
            catElement.style.color = "var(--danger)";
            catElement.style.textShadow = "0 0 5px var(--danger)";
        }
    });
});

// Contrôles Audio Simples
const audioBtn = document.getElementById('audioBtn');
const sensitivitySlider = document.getElementById('sensitivity');
const sensValueDisplay = document.getElementById('sensValue');
const levelBar = document.getElementById('levelBar');
let isMicOn = false;

audioBtn.addEventListener('click', () => {
    isMicOn = !isMicOn;
    if(isMicOn) {
        audioBtn.innerHTML = '<span class="icon">🎤</span> MICROPHONE: ON';
        audioBtn.style.color = "var(--accent)";
        audioBtn.style.borderColor = "var(--accent)";
    } else {
        audioBtn.innerHTML = '<span class="icon">🎤</span> MICROPHONE: OFF';
        audioBtn.style.color = "var(--text-main)";
        audioBtn.style.borderColor = "var(--text-dim)";
        levelBar.style.width = "0%";
    }
});

sensitivitySlider.addEventListener('input', (e) => {
    sensValueDisplay.innerText = e.target.value + "x";
});

// Simulation visuelle du baromètre audio
setInterval(() => {
    if(isMicOn) {
        const sens = parseFloat(sensitivitySlider.value);
        const randomLevel = Math.random() * 50 * sens;
        levelBar.style.width = Math.min(randomLevel, 100) + "%";
    }
}, 150);


// --- ANIMATION CANVAS (Simulation Radar / IR) ---

const canvas = document.getElementById('radarCanvas');
const ctx = canvas.getContext('2d');
let rotation = 0;

function drawRadar() {
    ctx.fillStyle = 'rgba(0, 5, 15, 0.2)'; // Traînée d'effacement
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = hurricaneData[currentHurricane];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    rotation += 0.02;
    ctx.rotate(rotation);

    // Dessin des bandes spiralées du cyclone
    for(let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.rotate(Math.PI / 2);
        
        // Création du gradient pour simuler l'imagerie infrarouge
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, data.size * 2);
        gradient.addColorStop(0, '#ffffff'); // Oeil (très froid/haut)
        gradient.addColorStop(0.2, data.color); // Mur de l'oeil
        gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.5)'); // Bandes externes
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        
        // Forme de la spirale
        ctx.ellipse(data.size / 2, 0, data.size * 1.5, data.size / 1.5, Math.PI / 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Oeil du cyclone clair
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#050914";
    ctx.fill();
    
    ctx.restore();
    requestAnimationFrame(drawRadar);
}

// Lancer l'animation
drawRadar();

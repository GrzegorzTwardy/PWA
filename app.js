let currentCoords = null;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const snapBtn = document.getElementById('snap');
const shareBtn = document.getElementById('share');
const mapElement = document.getElementById('map');

// 1. Kamera (Media Capture)
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.style.display = 'block';
    } catch (err) {
        alert("Błąd kamery: " + err);
    }
}

snapBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    preview.src = dataUrl;
    preview.style.display = 'block';
    video.style.display = 'none';
    
    getLocation();
});

// 2. Geolokalizacja (GPS)
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentCoords = position.coords;
            showMap(currentCoords.latitude, currentCoords.longitude);
            shareBtn.disabled = false;
        });
    }
}

function showMap(lat, lon) {
    mapElement.style.display = 'block';
    const map = L.map('map').setView([lat, lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([lat, lon]).addTo(map).bindPopup('Miejsce zgłoszenia').openPopup();
}

// 3. Web Share API
shareBtn.addEventListener('click', async () => {
    const blob = await (await fetch(preview.src)).blob();
    const file = new File([blob], 'zgloszenie.jpg', { type: 'image/jpeg' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Nowe zgłoszenie miejskie',
                text: `Zgłaszam incydent na pozycji: ${currentCoords.latitude}, ${currentCoords.longitude}`,
                files: [file]
            });
        } catch (err) {
            console.error("Błąd udostępniania:", err);
        }
    } else {
        alert("Twoja przeglądarka nie wspiera udostępniania plików.");
    }
});

initCamera();
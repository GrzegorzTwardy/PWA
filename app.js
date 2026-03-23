let currentCoords = null;
let mapInstance = null;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const snapBtn = document.getElementById('snap');
const shareBtn = document.getElementById('share');
const mapElement = document.getElementById('map');

const modal = document.getElementById('custom-modal');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close');

function showModal(message) {
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }
}

if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.style.display = 'block';
    } catch (err) {
        showModal("Błąd kamery: Odmowa dostępu lub urządzenie nie posiada kamery. Nadaj uprawnienia w ustawieniach przeglądarki.");
    }
}

snapBtn.addEventListener('click', () => {
    if (!video.videoWidth) {
        showModal("Nie można zrobić zdjęcia. Upewnij się, że zezwoliłeś na dostęp do kamery.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    preview.src = dataUrl;
    preview.style.display = 'block';
    video.style.display = 'none';
    
    getLocation();
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                currentCoords = position.coords;
                showMap(currentCoords.latitude, currentCoords.longitude);
                shareBtn.disabled = false;
            },
            err => {
                showModal("Nie udało się pobrać lokalizacji. Sprawdź ustawienia GPS. Szczegóły: " + err.message);
            }
        );
    } else {
        showModal("Twoja przeglądarka nie wspiera geolokalizacji.");
    }
}

function showMap(lat, lon) {
    mapElement.style.display = 'block';
    
    if (mapInstance !== null) {
        mapInstance.remove();
    }
    
    mapInstance = L.map('map').setView([lat, lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
    L.marker([lat, lon]).addTo(mapInstance).bindPopup('Miejsce zgłoszenia').openPopup();
}

shareBtn.addEventListener('click', async () => {
    if (!currentCoords || !preview.src) return;

    try {
        const response = await fetch(preview.src);
        const blob = await response.blob();
        const file = new File([blob], 'zgloszenie.jpg', { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Nowe zgłoszenie miejskie',
                text: `Zgłaszam incydent na pozycji GPS: ${currentCoords.latitude}, ${currentCoords.longitude}`,
                files: [file]
            });
        } else {
            showModal("Twoje urządzenie lub przeglądarka nie wspiera Web Share API.");
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            showModal("Wystąpił błąd udostępniania: " + err.message);
        }
    }
});

initCamera();
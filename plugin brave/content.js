let isPipEnabled = true;
let isVolumeEnabled = true;

// Cargar configuración inicial
chrome.storage.local.get({
    enable_pip: true,
    enable_volume: true
}, (result) => {
    isPipEnabled = result.enable_pip;
    isVolumeEnabled = result.enable_volume;
    updatePipButtonVisibility();
    // Enviar configuración inicial a main.js
    window.postMessage({ type: 'EXT_SETTINGS_UPDATE', enable_volume: result.enable_volume }, '*');
});

// Escuchar cambios en la configuración
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.enable_pip !== undefined) {
            isPipEnabled = changes.enable_pip.newValue;
            updatePipButtonVisibility();
        }
        if (changes.enable_volume !== undefined) {
            isVolumeEnabled = changes.enable_volume.newValue;
            window.postMessage({ type: 'EXT_SETTINGS_UPDATE', enable_volume: changes.enable_volume.newValue }, '*');
        }
    }
});

function updatePipButtonVisibility() {
    const btn = document.querySelector('.btn-pip-opera');
    if (btn) {
        btn.style.display = isPipEnabled ? '' : 'none';
    }
}

function injectPipButton() {
    if (document.querySelector('.btn-pip-opera')) {
        updatePipButtonVisibility();
        return;
    }

    let player = document.querySelector('#movie_player');
    if (!player && window.location.hostname.includes('twitch.tv')) {
        player = document.querySelector('[data-a-target="video-player"]') || 
                 document.querySelector('.video-player') || 
                 document.querySelector('.video-player__container') ||
                 document.querySelector('video')?.parentElement;
    }
    const video = document.querySelector('video');

    if (player && video) {
        const btn = document.createElement('button');
        btn.className = 'btn-pip-opera';
        btn.innerHTML = '<span>📺</span> Desacoplar';
        btn.style.display = isPipEnabled ? '' : 'none';
        
        btn.onclick = (e) => {
            e.stopPropagation();
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else {
                video.requestPictureInPicture();
            }
        };

        player.appendChild(btn);

        // --- NOTIFICAR AL BACKGROUND QUE EL VIDEO ESTÁ LISTO ---
        if (!video.dataset.videoDetectedNotified) {
            video.dataset.videoDetectedNotified = "true";
            chrome.runtime.sendMessage({ action: "video_detected", url: window.location.href });
        }

        // --- MANEJO DEL ESTADO PIP PARA EL ICONO ---
        if (!video.dataset.pipListenersAdded) {
            video.dataset.pipListenersAdded = "true";
            
            video.addEventListener('enterpictureinpicture', () => {
                chrome.runtime.sendMessage({ action: "pip_started" });
            });
            
            video.addEventListener('leavepictureinpicture', () => {
                chrome.runtime.sendMessage({ action: "pip_ended" });
            });
        }

        // --- NUEVA FUNCIONALIDAD DE VOLUMEN ---
        
        // Controlar volumen con la rueda del ratón sobre el video o el botón
        const handleWheel = (e) => {
            if (!isVolumeEnabled) return; // Salir si el volumen está desactivado

            if (document.pictureInPictureElement) {
                e.preventDefault(); // Evita que la página haga scroll
                
                // Ajuste de volumen (0.05 es un 5%)
                let newVolume = video.volume + (e.deltaY < 0 ? 0.05 : -0.05);
                
                // Asegurar que se mantenga entre 0 y 1 y redondear
                newVolume = Math.max(0, Math.min(1, newVolume));
                newVolume = Math.round(newVolume * 100) / 100;
                
                video.volume = newVolume;
                if (newVolume > 0 && video.muted) video.muted = false;
                
                if (window.location.hostname.includes('twitch.tv')) {
                    try {
                        window.localStorage.setItem('twilight-volume', newVolume.toString());
                        if (newVolume > 0) window.localStorage.setItem('twilight-video-muted', '{"default":false}');
                        let slider = document.querySelector('input[data-a-target="player-volume-slider"]');
                        if (slider) {
                            let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                            if (setter) {
                                setter.call(slider, newVolume);
                                slider.dispatchEvent(new Event('input', { bubbles: true }));
                                slider.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    } catch (err) {}
                }
                
                video.dispatchEvent(new window.Event('volumechange', { bubbles: true }));
                
                console.log(`Volumen actual: ${Math.round(video.volume * 100)}%`);
            }
        };

        // Escuchamos el scroll en el reproductor
        player.addEventListener('wheel', handleWheel, { passive: false });
    }
}

const observer = new MutationObserver(injectPipButton);
observer.observe(document.body, { childList: true, subtree: true });

injectPipButton();

// Escuchar mensajes desde el ícono de la extensión para alternar PiP o pedir calidades
let currentQualitiesCallback = null;

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'EXT_YT_QUALITIES_RESP') {
        if (currentQualitiesCallback) {
            currentQualitiesCallback({ qualities: e.data.qualities });
            currentQualitiesCallback = null;
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggle_pip" && isPipEnabled) {
        const video = document.querySelector('video');
        if (video) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else {
                video.requestPictureInPicture();
            }
        }
    }
    
    if (message.action === "get_youtube_qualities") {
        currentQualitiesCallback = sendResponse;
        // Pedir al main.js (que tiene acceso al player nativo) la lista de calidades
        window.postMessage({ type: 'EXT_YT_QUALITIES_REQ' }, '*');
        
        // Timeout por si main.js falla o no responde
        setTimeout(() => {
            if (currentQualitiesCallback) {
                currentQualitiesCallback({ qualities: [] });
                currentQualitiesCallback = null;
            }
        }, 2000);
        
        return true; // Indica que la respuesta será asíncrona
    }
});
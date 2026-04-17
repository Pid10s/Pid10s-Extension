// El ícono por defecto será el que dice manifest.json ('icon.png')
// Se mostrará normal en todas las páginas (a color)

async function setIconFromPath(path, tabId) {
    try {
        const response = await fetch(path);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(128, 128);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, 128, 128);
        const imageData = ctx.getImageData(0, 0, 128, 128);
        
        // Usamos imageData (píxeles crudos) directamente para eludir la comprobación restrictiva de Chromium a archivos problemáticos
        await chrome.action.setIcon({ imageData: imageData, tabId: tabId });
    } catch (err) {
        console.error("Error parseando el icono con Canvas:", err);
        // Fallback al intento nativo si canvas fallara
        chrome.action.setIcon({ path: path, tabId: tabId }).catch(e => console.error("Error nativo:", e));
    }
}

function checkYoutubeUrlAndSetIcon(tabId, url) {
    if (!url) return;
    if (url.includes("youtube.com")) {
        setIconFromPath("icon_green.png", tabId);
    } else {
        setIconFromPath("icon.png", tabId);
    }
}

// Comprobar la URL cuando se actualiza una pestaña
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url) {
        checkYoutubeUrlAndSetIcon(tabId, tab.url);
    }
});

// Comprobar también al momento de cambiar a otra pestaña activa
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url) {
            checkYoutubeUrlAndSetIcon(tab.id, tab.url);
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Ya no es necesario cambiar el icono aquí, onUpdated se encarga.
});

// Escuchar comandos globales de teclado (incluso en segundo plano)
chrome.commands.onCommand.addListener((command) => {
    // Si se invoca el atajo de teclado para desacoplar...
    if (command === "toggle_pip_shortcut") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggle_pip" }).catch(() => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        files: ['content.js']
                    });
                });
            }
        });
    }

    if (command === "volume_down" || command === "volume_up") {
        // Verificar configuración de volumen primero
        chrome.storage.local.get({ enable_volume: true }, (result) => {
            if (!result.enable_volume) return;

            let change = (command === "volume_up") ? 5 : -5;
            
            // Buscar todas las pestañas de YouTube y Twitch abiertas
            chrome.tabs.query({ url: ["*://*.youtube.com/*", "*://*.twitch.tv/*"] }, (tabs) => {
                tabs.forEach(tab => {
                    // Inyectar el cambio de volumen directamente en el MAIN world
                    // (Para que pueda acceder al reproductor interno `movie_player`)
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        world: "MAIN",
                        func: (volChange, cmdName) => {
                            console.log(`[Extensión] Comando recibido desde background: ${cmdName}, Cambio: ${volChange}`);
                            const ytPlayer = document.getElementById('movie_player');
                            if (ytPlayer && typeof ytPlayer.getVolume === 'function') {
                                let currentVol = Number(ytPlayer.getVolume() || 0);
                                let newVol = Math.max(0, Math.min(100, currentVol + volChange));
                                ytPlayer.setVolume(newVol);
                                if (newVol > 0 && typeof ytPlayer.isMuted === 'function' && ytPlayer.isMuted()) {
                                    ytPlayer.unMute();
                                }
                                console.log(`[Segundo Plano] Volumen (API YT): ${newVol}%`);
                            } else {
                                const video = document.querySelector('video');
                                if (video) {
                                    let htmlVolChange = volChange > 0 ? 0.05 : -0.05;
                                    let currentVol = Number(video.volume || 0);
                                    let newVol = Math.max(0, Math.min(1, currentVol + htmlVolChange));
                                    newVol = Math.round(newVol * 100) / 100;
                                    
                                    video.volume = newVol;
                                    if (newVol > 0 && video.muted) video.muted = false;
                                    
                                    if (window.location.hostname.includes('twitch.tv')) {
                                        try {
                                            window.localStorage.setItem('twilight-volume', newVol.toString());
                                            if (newVol > 0) window.localStorage.setItem('twilight-video-muted', '{"default":false}');
                                            let slider = document.querySelector('input[data-a-target="player-volume-slider"]');
                                            if (slider) {
                                                let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                                                if (setter) {
                                                    setter.call(slider, newVol);
                                                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                                                    slider.dispatchEvent(new Event('change', { bubbles: true }));
                                                }
                                            }
                                        } catch (err) {}
                                    }
                                    video.dispatchEvent(new window.Event('volumechange', { bubbles: true }));
                                }
                            }
                        },
                        args: [change, command]
                    });
                });
            });
        });
    }
});
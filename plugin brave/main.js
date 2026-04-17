// main.js - Se ejecuta en el contexto de la página (MAIN world) para acceder a la API nativa de YouTube

let isVolumeEnabled = true;

window.addEventListener('message', (e) => {
    if (e.data) {
        if (e.data.type === 'EXT_SETTINGS_UPDATE' && e.data.enable_volume !== undefined) {
            isVolumeEnabled = e.data.enable_volume;
        }
        else if (e.data.type === 'EXT_YT_QUALITIES_REQ') {
            const ytPlayer = document.getElementById('movie_player');
            let qualities = [];
            if (ytPlayer && typeof ytPlayer.getAvailableQualityLevels === 'function') {
                const levels = ytPlayer.getAvailableQualityLevels();
                // Omitir "auto" por defecto
                levels.filter(l => l !== 'auto').forEach(lvl => {
                    let label = lvl;
                    if (lvl === 'highres' || lvl === 'hd4320') label = '8K (4320p)';
                    else if (lvl === 'hd2880' || lvl === 'hd2160') label = '4K (2160p)';
                    else if (lvl === 'hd1440') label = '1440p';
                    else if (lvl === 'hd1080') label = '1080p';
                    else if (lvl === 'hd720') label = '720p';
                    else if (lvl === 'large') label = '480p';
                    else if (lvl === 'medium') label = '360p';
                    else if (lvl === 'small') label = '240p';
                    else if (lvl === 'tiny') label = '144p';
                    
                    qualities.push({ id: lvl, label: label });
                });
            }
            window.postMessage({ type: 'EXT_YT_QUALITIES_RESP', qualities: qualities }, '*');
        }
    }
});

window.addEventListener('keydown', (e) => {
    if (!isVolumeEnabled) return;

    // Detectar Ctrl + Shift + Coma/Punto, considerando las teclas compartidas (; y : en teclados ES)
    const isVolumeDown = e.ctrlKey && e.shiftKey && (e.code === "Comma" || e.key === "," || e.key === ";" || e.key === "<");
    const isVolumeUp = e.ctrlKey && e.shiftKey && (e.code === "Period" || e.key === "." || e.key === ":" || e.key === ">");

    if (isVolumeDown || isVolumeUp) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Prevenir que YouTube/Twitch intercepte estas teclas primero

        // Obtener el reproductor interno de YouTube
        const ytPlayer = document.getElementById('movie_player');

        if (ytPlayer && typeof ytPlayer.getVolume === 'function') {
            let currentVol = Number(ytPlayer.getVolume() || 0);
            let change = isVolumeUp ? 5 : -5;
            let newVol = Math.max(0, Math.min(100, currentVol + change));

            // Usamos el método nativo del reproductor, esto no causa trabas ni conflictos
            ytPlayer.setVolume(newVol);

            // Si subimos el volumen y el video estaba silenciado, le quitamos el silencio
            if (newVol > 0 && typeof ytPlayer.isMuted === 'function' && ytPlayer.isMuted()) {
                ytPlayer.unMute();
            }

            console.log(`[Desacoplador] Volumen (API YT): ${newVol}%`);
        } else {
            // Fallback seguro usando API de HTML5 en caso de que la de YT falle
            const video = document.querySelector('video');
            if (video) {
                let currentVol = Number(video.volume || 0);
                let change = isVolumeUp ? 0.05 : -0.05;
                let newVol = Math.max(0, Math.min(1, currentVol + change));
                // Redondear a 2 decimales para evitar problemas de precisión
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
                    } catch (e) { } // Ignorar si falla el localStorage/Twitch UI sync
                }

                video.dispatchEvent(new window.Event('volumechange', { bubbles: true }));
                console.log(`[Desacoplador Fallback] Volumen: ${newVol * 100}%`);
            }
        }
    }
}, true); // `true` usa la fase de captura para que se ejecute antes de los scripts de la página


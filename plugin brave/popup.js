document.addEventListener('DOMContentLoaded', () => {
    const togglePip = document.getElementById('togglePip');
    const toggleVolume = document.getElementById('toggleVolume');
    const ytSection = document.getElementById('youtube-download-section');
    const qualitySelect = document.getElementById('video-quality-select');
    const downloadBtn = document.getElementById('download-btn');
    const statusMsg = document.getElementById('download-status');

    let currentVideoUrl = '';

    // Cargar preferencias guardadas, por defecto true
    chrome.storage.local.get({
        enable_pip: true,
        enable_volume: true
    }, (result) => {
        togglePip.checked = result.enable_pip;
        toggleVolume.checked = result.enable_volume;
    });

    // Guardar al cambiar
    togglePip.addEventListener('change', () => {
        chrome.storage.local.set({ enable_pip: togglePip.checked });
    });

    toggleVolume.addEventListener('change', () => {
        chrome.storage.local.set({ enable_volume: toggleVolume.checked });
    });

    const shortcutsLink = document.getElementById('shortcuts-link');
    if (shortcutsLink) {
        shortcutsLink.addEventListener('click', () => {
            chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
        });
    }

    // --- Lógica de descarga de YouTube ---
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes("youtube.com/watch")) {
            ytSection.style.display = 'block';
            currentVideoUrl = tabs[0].url;
            
            // Pedir calidades al content script
            chrome.tabs.sendMessage(tabs[0].id, { action: "get_youtube_qualities" }, (response) => {
                if (chrome.runtime.lastError || !response || !response.qualities) {
                    qualitySelect.innerHTML = '<option value="">Error al cargar</option>';
                    return;
                }

                const qs = response.qualities;
                qualitySelect.innerHTML = '';
                
                if (qs.length === 0) {
                    qualitySelect.innerHTML = '<option value="">No disponibles</option>';
                    return;
                }

                // Generar opciones. qs es un array de objetos { id, label }
                qs.forEach(q => {
                    const opt = document.createElement('option');
                    // Mapeo para yt-dlp
                    let ytFormat = "720";
                    if (q.id === 'highres' || q.id === 'hd4320') ytFormat = "4320";
                    else if (q.id === 'hd2880' || q.id === 'hd2160') ytFormat = "2160";
                    else if (q.id === 'hd1440') ytFormat = "1440";
                    else if (q.id === 'hd1080') ytFormat = "1080";
                    else if (q.id === 'hd720') ytFormat = "720";
                    else if (q.id === 'large') ytFormat = "480";
                    else if (q.id === 'medium') ytFormat = "360";
                    else if (q.id === 'small') ytFormat = "240";
                    else if (q.id === 'tiny') ytFormat = "144";
                    
                    opt.value = ytFormat;
                    opt.textContent = q.label;
                    qualitySelect.appendChild(opt);
                });

                qualitySelect.disabled = false;
                downloadBtn.disabled = false;
                document.getElementById('download-mp3-btn').disabled = false;
            });
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const quality = qualitySelect.value;
        if (!quality || !currentVideoUrl) return;

        downloadBtn.disabled = true;
        document.getElementById('download-mp3-btn').disabled = true;
        qualitySelect.disabled = true;
        statusMsg.textContent = "Conectando al programa local...";
        statusMsg.classList.remove("error");

        try {
            const res = await fetch(`http://127.0.0.1:10101/download?quality=${quality}&url=${encodeURIComponent(currentVideoUrl)}`);
            const data = await res.json();
            
            if (data.success) {
                statusMsg.textContent = "¡Descargando en segundo plano en tu PC!";
                setTimeout(() => window.close(), 3000);
            } else {
                throw new Error("Respuesta del servidor: " + (data.error || "Desconocido"));
            }
        } catch (error) {
            statusMsg.textContent = "Error: Programa local apagado. Usa el botón de abajo para abrir la carpeta.";
            statusMsg.classList.add("error");
            downloadBtn.disabled = false;
            document.getElementById('download-mp3-btn').disabled = false;
            qualitySelect.disabled = false;
            document.getElementById('open-folder-btn').style.display = 'block';
        }
    });

    document.getElementById('download-mp3-btn').addEventListener('click', async () => {
        if (!currentVideoUrl) return;

        downloadBtn.disabled = true;
        document.getElementById('download-mp3-btn').disabled = true;
        qualitySelect.disabled = true;
        statusMsg.textContent = "Conectando al programa local (MP3)...";
        statusMsg.classList.remove("error");

        try {
            const res = await fetch(`http://127.0.0.1:10101/download?format=mp3&url=${encodeURIComponent(currentVideoUrl)}`);
            const data = await res.json();
            
            if (data.success) {
                statusMsg.textContent = "¡Descargando audio MP3 en tu PC!";
                setTimeout(() => window.close(), 3000);
            } else {
                throw new Error("Respuesta del servidor: " + (data.error || "Desconocido"));
            }
        } catch (error) {
            statusMsg.textContent = "Error: Programa local apagado. Usa el botón de abajo para abrir la carpeta.";
            statusMsg.classList.add("error");
            downloadBtn.disabled = false;
            document.getElementById('download-mp3-btn').disabled = false;
            qualitySelect.disabled = false;
            document.getElementById('open-folder-btn').style.display = 'block';
        }
    });

    document.getElementById('open-folder-btn').addEventListener('click', () => {
        const folderBtn = document.getElementById('open-folder-btn');
        folderBtn.disabled = true;
        folderBtn.textContent = "Abriendo carpeta...";
        
        chrome.runtime.sendNativeMessage('com.pid10s.downloader', { action: "open_folder" }, (response) => {
            if (chrome.runtime.lastError) {
                statusMsg.textContent = "Error de enlace. Ve a la carpeta 'Programa' y haz doble clic en 'registrar_conexion.bat'";
                folderBtn.disabled = false;
                folderBtn.textContent = "Abrir Carpeta para Arrancar";
            } else {
                statusMsg.textContent = "¡Carpeta abierta! Arranca Instalar_y_Arrancar.bat e inténtalo de nuevo.";
                statusMsg.classList.remove("error");
                folderBtn.style.display = 'none';
            }
        });
    });
});

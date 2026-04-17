# Desacoplador de Pid10s

![Icon](icon.png)

Una potente y avanzada extensión de navegador orientada a navegadores basados en Chromium (como Brave y Google Chrome), desarrollada en su totalidad por **pid10s**. 

El objetivo principal de esta extensión es eliminar cuellos de botella y potenciar al máximo tu experiencia como usuario al consumir contenido en plataformas multimedia (como YouTube y Twitch), todo desde una interfaz unificada, fluida y totalmente privada sin depender de software de terceros.

---

## 🚀 Funcionalidades Principales

*   **📺 Modo Picture-in-Picture (PiP):** Permite "desacoplar" cualquier vídeo de YouTube o Twitch hacia una ventana flotante nativa del sistema. Ideal para seguir visualizándolo sin interrupciones mientras navegas por otras pestañas o utilizas otros programas.
*   **🔊 Control de Volumen Optimizado:** Incorpora atajos de teclado globales y directos para ajustar el volumen de manera fluida en cualquier reproductor soportado.
*   **⬇️ Descargador Local Inyectado (Vídeo y MP3):** A través de tecnología avanzada de *Native Messaging* y un pequeño servidor local de Node.js, la extensión se conecta de forma segura a tu sistema operativo usando `yt-dlp`. Esto te permite descargar vídeos en alta calidad o extraer música (MP3) de manera directa, eludiendo webs repletas de publicidad o límites artificiales de velocidad.
*   **🎨 UI Reactiva y Dinámica:** Cuenta con un menú desplegable estético con interruptores tipo toggle. Su icono reacciona al contexto, encendiéndose en color verde al identificar una plataforma compatible. Además, ofrece opciones rápidas como un botón exclusivo para abrir al instante la carpeta con los archivos descargados.

---

## 🛠 Instalación y Configuración

Dado que el "cerebro" descargador opera directamente desde tu ordenador para lograr su enorme velocidad, la instalación requiere unos sencillos preparativos:

### Requisitos Previos

Necesitas tener **[Node.js](https://nodejs.org/es/)** instalado en tu sistema. Si no lo tienes, descárgalo e instálalo (es un simple proceso de 'Siguiente > Siguiente').

### Pasos de Instalación

1.  **Ejecuta el Instalador Automatizado:**
    *   Navega a la subcarpeta `Programa` dentro del directorio de esta extensión.
    *   Haz doble clic sobre el archivo de instalación (según indique tu versión, por ejemplo `Instalar_y_Arrancar.bat` o `instalar.bat`).
    *   Se abrirá una consola negra que hará el trabajo sucio por ti: descargará el motor oficial `yt-dlp.exe` y añadirá las claves de registro seguras necesarias para el formato *Native Messaging*, autorizando a la extensión a hablar con la carpeta.
2.  **Carga la Extensión en tu Navegador:**
    *   Abre tu navegador Brave o Google Chrome.
    *   Navega a `brave://extensions/` (o `chrome://extensions/`).
    *   Asegúrate de que el **"Modo de desarrollador"** (Developer mode) esté activado (suele ser un interruptor arriba a la derecha).
    *   Haz clic en **"Cargar extensión sin empaquetar"** (Load unpacked).
    *   Selecciona la carpeta raíz de este repositorio (la carpeta donde se encuentra este mismo archivo y el `manifest.json`).

¡Y listo! Ya deberías ver el icono de la extensión (una pieza de puzzle junto a tu barra de herramientas, ánclala para mayor comodidad).

---

## 💡 Uso de la Extensión

*   Navega a YouTube o Twitch. Verás que el icono de la extensión se vuelve de color verde.
*   Abre el menú de la extensión dando clic al icono.
*   Activa la opción de PiP o de control de volumen al gusto.
*   Si estás en un sitio soportado (YouTube), se desplegará el **panel de descarga premium**. Selecciona la resolución y descarga tus vídeos, o extrae el audio directamente un clic.

---

## 👨‍💻 Sobre el Desarrollador

Este proyecto es una creación exclusiva de **pid10s**, un creador digital enfocado en la solución empírica de fricciones de usabilidad web. Destaca como desarrollador versátil al dominar tecnologías *Frontend* de las extensiones modernas (Manifest V3, Javascript, CSS) y combinarlas creativamente con arquitectura *Backend* de bajo nivel (archivos Batch, Node.js y APIs Locales).
La filosofía de pid10s es clara: **crear flujos de trabajo premium donde los usuarios mantengan el control absoluto sobre sus entornos.**

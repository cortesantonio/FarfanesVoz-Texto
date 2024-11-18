// Obtener el video de la cámara
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("capture");
const modalCamara = document.getElementById("modalCamara");

const closeModalCamaraButton = document.getElementById("closeModalCamara");
const contador = document.getElementById("contador");

let fotosTomadas = 0;
const maxFotos = 5;  // Limitar a 5 fotos

// Este botón abre la cámara
function AbrirCamara(id) {
    modalCamara.style.display = "block";

    const db = openDB.result;
    const transaction = db.transaction("notas", "readonly");
    const objectStore = transaction.objectStore("notas");
    const request = objectStore.get(id);

    request.onsuccess = (event) => {
        const note = event.target.result;
        fotosTomadas = note.fotos ? note.fotos.length : 0;
        actualizarContador();

        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error("Error al acceder a la cámara:", error);
        });

        captureButton.addEventListener("click", () => {
            if (fotosTomadas < maxFotos) {
                const context = canvas.getContext("2d");
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(blob => {
                    saveImage(blob, id);
                }, "image/jpeg");

                fotosTomadas++;
                actualizarContador();

                if (fotosTomadas >= maxFotos) {
                    captureButton.disabled = true;
                    captureButton.textContent = "Límite de fotos alcanzado";
                    alert("Has alcanzado el límite de 5 fotos.");
                    cerrarModalCamara();
                } else {
                    captureButton.innerHTML = '<i class="fa-solid fa-camera"></i>';
                }
            }
        });
    };

    request.onerror = (event) => {
        console.error("Error al obtener la nota:", event.target.error);
    };

    closeModalCamaraButton.addEventListener("click", () => {
        cerrarModalCamara();
    });
}

// Función para cerrar el modal y detener el video
function cerrarModalCamara() {
    modalCamara.style.display = "none";
    // Detener el stream de la cámara al cerrar el modal
    const stream = video.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
}

// Guardar la imagen en IndexedDB
function saveImage(blob, id) {
    const db = openDB.result;
    const transaction = db.transaction("notas", "readwrite");
    const objectStore = transaction.objectStore("notas");

    const request = objectStore.get(id);
    request.onsuccess = (event) => {
        const note = event.target.result;

        if (!note.fotos) {
            note.fotos = [];
        }

        note.fotos.push(blob);

        const updateRequest = objectStore.put(note);
        updateRequest.onsuccess = () => {
            console.log("Nota actualizada exitosamente con nueva foto");
            showImage(id); // Recarga dinámicamente las fotos en el modal
        };
        updateRequest.onerror = (event) => {
            console.error("Error al actualizar la nota con foto:", event.target.error);
        };
    };
    request.onerror = (event) => {
        console.error("Error al obtener la nota:", event.target.error);
    };
}

// Mostrar la foto almacenada en el modal
function showImage(id) {
    const db = openDB.result;
    const transaction = db.transaction("notas", "readonly");
    const objectStore = transaction.objectStore("notas");
    const divIMG = document.getElementById("imgModal");
    const request = objectStore.get(id);

    request.onsuccess = (event) => {
        const note = event.target.result;

        divIMG.innerHTML = ''; // Limpiar contenido previo

        if (note.fotos && note.fotos.length > 0) {
            // Crear un contenedor para las imágenes
            const imageContainer = document.createElement("div");
            imageContainer.className = "image-grid";

            // Mostrar las fotos almacenadas
            note.fotos.forEach((foto, index) => {
                const imageURL = URL.createObjectURL(foto);
                const imageElement = document.createElement("div");
                imageElement.className = "image-item";
                imageElement.innerHTML = `
                    <a href="${imageURL}" target="_blank">
                        <img src="${imageURL}" alt="Foto ${index + 1}">
                    </a>
                `;
                imageContainer.appendChild(imageElement);
            });

            divIMG.appendChild(imageContainer);

            // Mostrar mensaje de fotos restantes solo si hay fotos existentes
            const fotosFaltantes = maxFotos - note.fotos.length;
            if(note.signature == null){
              if (fotosFaltantes > 0) {
                const mensajeFotos = document.createElement("p");
                mensajeFotos.textContent = `Te ${fotosFaltantes === 1 ? 'queda' : 'quedan'} ${fotosFaltantes} ${fotosFaltantes === 1 ? 'foto' : 'fotos'} por tomar.`;
                divIMG.appendChild(mensajeFotos);
            }
            
            }

          
        } else {
            // Mensaje cuando no hay fotos
            const noFotosMessage = document.createElement("p");
            noFotosMessage.textContent = "Este registro no tiene fotos.";
            divIMG.appendChild(noFotosMessage);
        }

        // Mostrar el botón para tomar foto si faltan fotos
        if(note.signature == null){
            if (!note.fotos || note.fotos.length < 5 ) {
                const tomarFotoBtn = document.createElement("button");
                tomarFotoBtn.id = "btnCamera";
                tomarFotoBtn.textContent = "Tomar Foto";
                tomarFotoBtn.onclick = () => AbrirCamara(id);
                divIMG.appendChild(tomarFotoBtn);
            }
        }

       
    };

    request.onerror = (event) => {
        console.error("Error al recuperar la foto:", event.target.error);
    };
}

// Actualizar el contador de fotos
function actualizarContador() {
    contador.textContent = `Fotos tomadas: ${fotosTomadas} de ${maxFotos}`;

    if (fotosTomadas >= maxFotos) {
        captureButton.disabled = true;
        captureButton.textContent = "Límite de fotos alcanzado";
    } else {
        captureButton.disabled = false;
        captureButton.innerHTML = '<i class="fa-solid fa-camera"></i>';
    }
}


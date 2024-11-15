// Obtener el video de la cámara
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("capture");
const modalCamara = document.getElementById("modalCamara");

//este boton abre la camara



function AbrirCamara(id) {
    modalCamara.style.display = "block";

    // Acceder a la cámara
    navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } // Solicita alta resolución
    })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error("Error al acceder a la cámara:", error);
        });

    // Capturar la foto
    captureButton.addEventListener("click", () => {
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir la imagen a un Blob (formato de imagen JPEG)
        canvas.toBlob(blob => {
            saveImage(blob, id)
        }, "image/jpeg");
    });

}


function saveImage(blob, id) {

    const db = openDB.result;
    const transaction = db.transaction("notas", "readwrite");
    const objectStore = transaction.objectStore("notas");


    const note = notes.find(note => note.id === id);

    // Obtener los valores editados

    note['foto'] = blob
    
    // Guardar en IndexedDB
    const request = objectStore.put(note);
    request.onsuccess = () => {
        console.log("Nota actualizada exitosamente");
        obtenerNotas(); // Actualiza la lista de notas y vuelve a renderizar
    };
    request.onerror = (event) => {
        console.error("Error al actualizar la nota:", event.target.error);
    };

    // Limpiar el formulario de edición
    document.getElementById('formContainer').innerHTML = '';

   
}


function showImage(id) {
    const db = openDB.result;
    const transaction = db.transaction("notas", "readonly");
    const objectStore = transaction.objectStore("notas");
    const divIMG = document.getElementById("imgModal");
    const request = objectStore.get(id);
    request.onsuccess = (event) => {
        const note = event.target.result;
        const btnTomarFoto = document.getElementById("btnCamera");

        if (note.foto != null) {

            const imageURL = URL.createObjectURL(note.foto); // Crear URL desde Blob
            const imageElement = document.createElement("a");
            imageElement.href = imageURL;
            imageElement.target = "_blank";
             // Abrir en una nueva pestaña
            imageElement.innerHTML = `<img src="${imageURL}" alt="Foto tomada" style="max-width: 100%; max-height: 100%;">`;
            divIMG.appendChild(imageElement);

        } else {
            divIMG.innerHTML = `
                    <Button id="btnCamera" onclick="AbrirCamara(${id})">Tomar Foto</Button>
                    <p>Este registro no tiene fotos. </p>
            
            `;

        }
    };
    request.onerror = (event) => {
        console.error("Error al recuperar la foto:", event.target.error);
    };
}
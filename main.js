
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = false;

const searchBtn = document.getElementById('searchMicBtn'); // Botón para iniciar la búsqueda por voz
const startBtn = document.getElementById('startBtn');
const notesList = document.getElementById('notesList');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');

let currentFieldIndex = 0;

const fields = ["patente del vehículo", "dueño", "inspección visual", "problema", "diagnóstico/reparación"];
let newNote = {};

let notes = [];



let isCreatingNote = false;
let isSearching = false;
let isEditingInspeccion = false;
let isEditingProblema = false;
let isEditingDiagnostico = false;

function formatDate(timestamp) {
    let date = new Date(timestamp); let year = date.getFullYear(); let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}


const openDB = indexedDB.open("BaseDeDatosNotas", 1);

// Paso 2: Configuración inicial de la base de datos (solo se ejecuta si es la primera vez)
openDB.onupgradeneeded = function (event) {
    const db = event.target.result;
    // Crear un almacén de objetos (tabla) llamado "notas" con una clave "id" autoincrementable
    const objectStore = db.createObjectStore("notas", { keyPath: "id", autoIncrement: false });

    // Crear índices para buscar por distintos campos
    objectStore.createIndex("patenteVehiculo", "patenteVehiculo", { unique: false });
    objectStore.createIndex("dueno", "dueno", { unique: false });
    objectStore.createIndex("inspeccionVisual", "inspeccionVisual", { unique: false });
    objectStore.createIndex("problema", "problema", { unique: false });
    objectStore.createIndex("diagnosticoReparacion", "diagnosticoReparacion", { unique: false });
    objectStore.createIndex("foto", "foto", { unique: false });

    console.log("Base de datos y almacén de objetos 'notas' creados");
};

function obtenerNotas() {
    const db = openDB.result;
    const transaction = db.transaction("notas", "readonly");
    const objectStore = transaction.objectStore("notas");
    const request = objectStore.getAll(); // Obtiene todas las notas

    request.onsuccess = function (event) {
        notes = event.target.result;
        renderNotes()
    };
    request.onerror = function (event) {
        console.error("Error al obtener notas:", event.target.error);
    };
}

openDB.onsuccess = function () {
    const db = openDB.result;
    console.log("Base de datos abierta con éxito");
    // Llamamos a las funciones de ejemplo aquí, una vez que la base de datos esté lista
    obtenerNotas()
};
// INICIAR CREACION DE NOTA POR VOZ
startBtn.addEventListener('click', () => {
    isCreatingNote = true;  // Activamos el estado de creación de nota
    isSearching = false;
    currentFieldIndex = 0;
    newNote = {};  // Resetea la nota para un nuevo ingreso
    promptNextField();
});
// INICIAR BUSQUEDA POR VOZ
searchBtn.addEventListener('click', () => {
    isCreatingNote = false;  // Activamos el estado de creación de nota
    isSearching = true;
    speak("Digame la patente o el dueño que desea buscar", () => {
        setTimeout(() => recognition.start(), 100);
    });

});


function editInspeccion() {
    isCreatingNote = false;
    isSearching = false;
    isEditingDiagnostico = false;
    isEditingProblema = false;
    isEditingInspeccion = true;
    speak("Ingrese nuevamente la inspeccion visual", () => {
        setTimeout(() => recognition.start(), 100);
    });

}

function editProblema() {
    isCreatingNote = false;
    isSearching = false;
    isEditingDiagnostico = false;
    isEditingProblema = true;
    isEditingInspeccion = false;
    speak("Ingrese nuevamente el problema", () => {
        setTimeout(() => recognition.start(), 100);
    });

}

function editDiagnostico() {
    isCreatingNote = false;
    isSearching = false;
    isEditingDiagnostico = true;
    isEditingProblema = false;
    isEditingInspeccion = false;
    speak("Ingrese nuevamente el diagnóstico", () => {
        setTimeout(() => recognition.start(), 100);
    });

}



recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    if (isCreatingNote) {
        handleVoiceInput(transcript); // Crear nota
    } else if (isSearching) {

        document.getElementById('searchInput').value = transcript; // Establece el texto en el campo de búsqueda
        buscarPorTexto(); // Llama a la función de búsqueda
        recognition.stop(); // Detiene el reconocimiento
        speak("estos son los resultados")
    }
    else if (isEditingInspeccion) {
        document.getElementById('inspeccion').value = transcript;
        recognition.stop();
    } else if (isEditingProblema) {
        document.getElementById('problema').value = transcript;
        recognition.stop();
    } else if (isEditingDiagnostico) {
        document.getElementById('diagnostico').value = transcript;
        recognition.stop();
    }



});

recognition.addEventListener('error', (event) => {
    console.error('Error en el reconocimiento de voz:', event.error);
    alert('Error: ' + event.error);
});

recognition.addEventListener('end', () => {
    startBtn.disabled = false;
});

// Función para manejar el input de voz
function handleVoiceInput(text) {
    // Guardar la respuesta del campo actual en el objeto de nota
    newNote[fields[currentFieldIndex]] = text;
    currentFieldIndex++;
    promptNextField();  // Llama automáticamente al siguiente campo
}

// Función para pedir al usuario el siguiente campo
function promptNextField() {
    if (currentFieldIndex < fields.length) {
        speak(`Ingrese ${fields[currentFieldIndex]}`, () => {
            setTimeout(() => recognition.start(), 100);
        });
    } else {
        saveNote();
        speak("Nota guardada exitosamente.");
        //resetForm();
    }
}



// Función para guardar una nueva nota
function saveNote() {
    const db = openDB.result;
    const transaction = db.transaction("notas", "readwrite");
    const objectStore = transaction.objectStore("notas");

    // Crear el objeto nota con los campos especificados
    const request = objectStore.add({
        id: Date.now(),
        "patente del vehículo": newNote["patente del vehículo"],
        dueño: newNote.dueño,
        inspecciónVisual: newNote["inspección visual"],
        problema: newNote.problema,
        "diagnóstico/reparación": newNote["diagnóstico/reparación"],
        foto: null
    });

    request.onsuccess = () => console.log("Nota añadida con éxito");
    request.onerror = (event) => console.error("Error al agregar la nota:", event.target.error);

    renderNotes();
}

function deleteNote(id) {

    const note = notes.find(note => note.id === id);
    console.log(note)
    const confirmation = window.confirm(`¿Estás seguro de que deseas eliminar esta nota? \n\nPatente: ${note["patente del vehículo"]} \nDueño ${note['dueño']} \nProblema: ${note['problema']}`);
    if (!confirmation) return;

    const db = openDB.result;
    const transaction = db.transaction("notas", "readwrite");
    const objectStore = transaction.objectStore("notas");

    const request = objectStore.delete(id);
    request.onsuccess = () => {
        console.log("Nota eliminada exitosamente");
        obtenerNotas(); // Actualiza la lista de notas y vuelve a renderizar
    };
    request.onerror = (event) => {
        console.error("Error al eliminar la nota:", event.target.error);
    };
}

// Función para editar una nota
function editNote(id) {
    const note = notes.find(note => note.id === id);
    // Crear el formulario para editar los campos
    const editForm = `
    <div class="form-container">
        <div class="edit-form">
            <h2>Editar Nota</h2>
            
            <div class="form-group">
                <label for="patente">Patente del Vehículo:</label>
                <div class="input-with-icon">
                    <input type="text" id="patente" value="${note['patente del vehículo']}">
                    
                </div>
            </div>
            
            <div class="form-group">
                <label for="dueño">Dueño:</label>
                <div class="input-with-icon">
                    <input type="text" id="dueño" value="${note['dueño']}">
                    
                </div>
            </div>
            
            <div class="form-group">
                <label for="inspeccion">Inspección Visual:</label>
                <div class="input-with-icon">
                    <input type="text" id="inspeccion" value="${note['inspecciónVisual']}">
                    <button class="mic-button" type="button" onclick="editInspeccion()" >
                        <span class="material-symbols-outlined">mic</span>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="problema">Problema:</label>
                <div class="input-with-icon">
                    <input type="text" id="problema" value="${note['problema']}">
                    <button class="mic-button" type="button" onclick="editProblema()">
                        <span class="material-symbols-outlined">mic</span>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="diagnostico">Diagnóstico/Reparación:</label>
                <div class="input-with-icon">
                    <input type="text" id="diagnostico" value="${note['diagnóstico/reparación']}">
                    <button class="mic-button" type="button" onclick="editDiagnostico()">
                        <span class="material-symbols-outlined">mic</span>
                    </button>
                </div>
            </div>
            
            <div class="button-group">
                <button onclick="saveEdit(${note.id})">Guardar Cambios</button>
                <button onclick="cancelEdit()">Cancelar</button>
            </div>
        </div>
    </div>
`;

    // Mostrar el formulario de edición
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = editForm;
}


// Función para guardar los cambios después de editar una nota
function saveEdit(id) {
    const db = openDB.result;
    const transaction = db.transaction("notas", "readwrite");
    const objectStore = transaction.objectStore("notas");


    const note = notes.find(note => note.id === id);

    // Obtener los valores editados
    note['patente del vehículo'] = document.getElementById('patente').value;
    note['dueño'] = document.getElementById('dueño').value;
    note['inspección visual'] = document.getElementById('inspeccion').value;
    note['problema'] = document.getElementById('problema').value;
    note['diagnóstico/reparación'] = document.getElementById('diagnostico').value;


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

// Función para cancelar la edición
function cancelEdit() {
    document.getElementById('formContainer').innerHTML = ''; // Limpiar el formulario de edición
}

// Función para renderizar notas, incluyendo un parámetro opcional
function renderNotes() {

    notesList.innerHTML = ''; // Limpiar la lista antes de renderizar


    for (let i = 0; i < notes.length; i++) {

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="cardHeader">
                <span class="FechaRender">${formatDate(notes[i]['id'])}</span>
                <span class="textCard">${notes[i]['patente del vehículo']} - ${notes[i]['problema']} </span>
            </div>
            <div>
                <button class="editBtn" onclick="editNote(${notes[i].id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="deleteBtn" onclick="deleteNote(${notes[i].id})"><i class="fa-solid fa-trash"></i></button>
                <button class="viewDetailsBtn" onclick="showModal(${notes[i].id})"><i class="fa-solid fa-circle-info"></i></button>
            </div>
        `;
        notesList.appendChild(listItem);
    }


}


function toggleSortByDate(orden) {
    const btn = document.getElementById('btnSort');
    if (orden == 'asc') {
        notes.sort((a, b) => new Date(a.id) - new Date(b.id));
        btn.onclick = () => toggleSortByDate('desc');
        renderNotes();

    } else if (orden == 'desc') {
        notes.sort((a, b) => new Date(b.id) - new Date(a.id));
        btn.onclick = () => toggleSortByDate('asc');

        renderNotes();

    }
}


// Función para mostrar el modal con los detalles de la nota
function showModal(noteId) {
    const note = notes.find(n => n.id === noteId); // Buscar la nota por ID
    modalText.innerHTML = `
        <strong>Fecha:</strong>
        <span>${formatDate(note["id"])}</span>
        <strong>Patente del Vehículo:</strong>
        <span>${note["patente del vehículo"]}</span>
        <strong>Dueño:</strong>
        <span>${note["dueño"]}</span>
        <strong>Inspección Visual:</strong>
        <span>${note["inspecciónVisual"]}</span>
        <strong>Problema:</strong>
        <span>${note["problema"]}</span>
        <strong>Diagnóstico/Reparación:</strong>
        <span>${note["diagnóstico/reparación"]}</span>
        <div id="imgModal"></div>
    `;
    showImage(note.id);
    document.getElementById('modal').style.display = 'flex';
}

// Función para cerrar el modal
function closeModal() {
    modal.style.display = 'none';
}

// Función para hablar el texto
function speak(text, callback) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = callback;
    synth.speak(utterance);
}

// Función para copiar el contenido del modal al portapapeles
function copyToClipboard() {
    const modalContent = modalText.innerText; // Obtener el contenido del modal
    navigator.clipboard.writeText(modalContent) // Copiar al portapapeles
        .then(() => {
            alert('Contenido copiado al portapapeles');
        })
        .catch(err => {
            alert('Error al copiar: ' + err);
        });
}


function buscarPorTexto() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    // Filtrar notas que coincidan en los campos 'patente del vehículo' o 'dueño'
    const filtrado = notes.filter(note =>
        note['patente del vehículo'].toLowerCase().includes(searchInput) ||
        note['dueño'].toLowerCase().includes(searchInput)
    );

    // Llamada para renderizar las notas filtradas
    renderFilteredNotes(filtrado);
}

// Función para renderizar las notas filtradas
function renderFilteredNotes(filtrado) {
    notesList.innerHTML = ''; // Limpiar la lista antes de renderizar

    if (filtrado.length === 0) {
        notesList.innerHTML = '<p style="font-size: 16px; font-weight: 100; ">No se encontraron resultados...</p>';
        return;
    }

    filtrado.forEach(note => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="cardHeader">
                <span class="FechaRender">${formatDate(note['id'])}</span>
                <span class="textCard">${note['patente del vehículo']}: ${note.problema}</span>
            </div>
            <div>
                <button class="editBtn" onclick="editNote(${note.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="deleteBtn" onclick="deleteNote(${note.id})"><i class="fa-solid fa-trash"></i></button>
                <button class="viewDetailsBtn" onclick="showModal(${note.id})"><i class="fa-solid fa-circle-info"></i></button>
            </div>
        `;
        notesList.appendChild(listItem);
    });
}
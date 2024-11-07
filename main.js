const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = false;

const startBtn = document.getElementById('startBtn');
const notesList = document.getElementById('notesList');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
let currentFieldIndex = 0;

const fields = ["patente del vehículo", "dueño", "inspección visual", "problema", "diagnóstico/reparación"];
let newNote = {};
let notes = JSON.parse(localStorage.getItem('notes')) || [];

// Renderiza las notas al iniciar
renderNotes();

startBtn.addEventListener('click', () => {
    currentFieldIndex = 0;
    newNote = {};  // Resetea la nota para un nuevo ingreso
    promptNextField();
});

recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    handleVoiceInput(transcript);
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
        // Solicita el siguiente campo y espera antes de activar el reconocimiento de voz
        speak(`Ingrese ${fields[currentFieldIndex]}`, () => {
            setTimeout(() => recognition.start(), 100);
        });
    } else {
        saveNote();
        speak("Nota guardada exitosamente.");
        resetForm();
    }
}

// Función para guardar la nota
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
}

// Función para guardar una nueva nota
function saveNote() {
    notes.push({ id: Date.now(), ...newNote });
    saveNotes();  // Usamos saveNotes para guardar y renderizar
}

// Función para eliminar una nota
function deleteNote(id) {
    // Mostrar una ventana de confirmación antes de eliminar
    const confirmation = window.confirm("¿Estás seguro de que deseas eliminar esta nota?");

    if (confirmation) {
        // Si el usuario confirma, eliminar la nota
        notes = notes.filter(note => note.id !== id);
        saveNotes();  // Usamos saveNotes para guardar los cambios
    }
}

// Función para editar una nota
function editNote(id) {
    const note = notes.find(note => note.id === id);

    // Crear el formulario para editar los campos
    const editForm = `
        <label for="patente">Patente del Vehículo:</label>
        <input type="text" id="patente" value="${note['patente del vehículo']}"><br>
        
        <label for="dueño">Dueño:</label>
        <input type="text" id="dueño" value="${note['dueño']}"><br>
        
        <label for="inspeccion">Inspección Visual:</label>
        <input type="text" id="inspeccion" value="${note['inspección visual']}"><br>
        
        <label for="problema">Problema:</label>
        <input type="text" id="problema" value="${note['problema']}"><br>
        
        <label for="diagnostico">Diagnóstico/Reparación:</label>
        <input type="text" id="diagnostico" value="${note['diagnóstico/reparación']}"><br>
        
        <button onclick="saveEdit(${note.id})">Guardar Cambios</button>
        <button onclick="cancelEdit()">Cancelar</button>
    `;

    // Mostrar el formulario de edición
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = editForm;
}

// Función para guardar los cambios después de editar una nota
function saveEdit(id) {
    const note = notes.find(note => note.id === id);

    // Obtener los valores editados
    note['patente del vehículo'] = document.getElementById('patente').value;
    note['dueño'] = document.getElementById('dueño').value;
    note['inspección visual'] = document.getElementById('inspeccion').value;
    note['problema'] = document.getElementById('problema').value;
    note['diagnóstico/reparación'] = document.getElementById('diagnostico').value;

    saveNotes();  // Usamos saveNotes para guardar y renderizar los cambios

    // Limpiar el formulario de edición
    document.getElementById('formContainer').innerHTML = '';
}

// Función para cancelar la edición
function cancelEdit() {
    document.getElementById('formContainer').innerHTML = ''; // Limpiar el formulario de edición
}

// Función para renderizar las notas en la lista
function renderNotes() {
    notesList.innerHTML = '';
    notes.forEach(note => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="textCard">${note['patente del vehículo']}: ${note.problema}</span>
            <div>
                <button class="editBtn" onclick="editNote(${note.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="deleteBtn" onclick="deleteNote(${note.id})"><i class="fa-solid fa-trash"></i></button>
                <button class="viewDetailsBtn" onclick="showModal(${note.id})"><i class="fa-solid fa-circle-info"></i></button>
            </div>
        `;
        notesList.appendChild(listItem);
    });
}

// Función para mostrar el modal con los detalles de la nota
function showModal(noteId) {
    const note = notes.find(n => n.id === noteId); // Buscar la nota por ID
    modalText.innerHTML = `
        <strong>Patente del Vehículo:</strong> ${note["patente del vehículo"]} <br>
        <strong>Dueño:</strong> ${note["dueño"]} <br>
        <strong>Inspección Visual:</strong> ${note["inspección visual"]} <br>
        <strong>Problema:</strong> ${note["problema"]} <br>
        <strong>Diagnóstico/Reparación:</strong> ${note["diagnóstico/reparación"]}
    `;
    modal.style.display = 'flex';
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

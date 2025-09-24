// Módulo de vista de obra
import { getCurrentUser } from './auth.js';
import { 
    uploadImageAndCreateRequest, 
    subscribeToUserRequests 
} from './storage-utils.js';
import { 
    showToast, 
    createRequestElement, 
    createImagePreview, 
    removeImagePreview,
    validateImageFile,
    showButtonSpinner,
    hideButtonSpinner
} from './ui.js';

let unsubscribeRequests = null;

/**
 * Inicializar vista de obra
 */
export function initObraView() {
    setupFormListeners();
    loadUserRequests();
}

/**
 * Configurar listeners del formulario
 */
function setupFormListeners() {
    const form = document.getElementById('request-form');
    const imageUpload = document.getElementById('image-upload');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
}

/**
 * Manejar envío del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showToast('Usuario no autenticado', 'error');
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = showButtonSpinner(submitBtn, 'Enviando...');
    
    try {
        // Obtener datos del formulario
        const requestData = {
            projectId: document.getElementById('project-id').value.trim(),
            obraName: document.getElementById('obra-name').value.trim(),
            type: document.getElementById('request-type').value,
            title: document.getElementById('request-title').value.trim(),
            description: document.getElementById('request-description').value.trim(),
            createdByUid: user.uid,
            createdByName: user.displayName || 'Usuario'
        };
        
        // Validar datos requeridos
        if (!requestData.projectId || !requestData.obraName || !requestData.title) {
            throw new Error('Por favor completa todos los campos requeridos');
        }
        
        // Obtener archivo de imagen
        const imageFile = document.getElementById('image-upload').files[0];
        
        // Validar imagen si existe
        if (imageFile && !validateImageFile(imageFile)) {
            return;
        }
        
        // Función para mostrar progreso de subida
        const onProgress = (progress) => {
            showButtonSpinner(submitBtn, `Subiendo... ${Math.round(progress)}%`);
        };
        
        // Subir imagen y crear solicitud
        await uploadImageAndCreateRequest(requestData, imageFile, onProgress);
        
        // Limpiar formulario
        form.reset();
        removeImagePreview();
        
        showToast('Solicitud enviada correctamente', 'success');
        
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        showToast(error.message || 'Error al enviar solicitud', 'error');
    } finally {
        hideButtonSpinner(submitBtn, originalText);
    }
}

/**
 * Manejar subida de imagen
 */
async function handleImageUpload(e) {
    const file = e.target.files[0];
    
    if (!file) {
        removeImagePreview();
        return;
    }
    
    // Validar archivo
    if (!validateImageFile(file)) {
        e.target.value = '';
        return;
    }
    
    // Mostrar vista previa
    try {
        await createImagePreview(file);
    } catch (error) {
        console.error('Error creando vista previa:', error);
        showToast('Error procesando imagen', 'error');
    }
}

/**
 * Cargar solicitudes del usuario
 */
function loadUserRequests() {
    const user = getCurrentUser();
    if (!user) return;
    
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    // Limpiar suscripción anterior
    if (unsubscribeRequests) {
        unsubscribeRequests();
    }
    
    // Suscribirse a cambios en tiempo real
    unsubscribeRequests = subscribeToUserRequests(user.uid, (snapshot) => {
        requestsList.innerHTML = '';
        
        if (snapshot.empty) {
            requestsList.innerHTML = '<p class="no-requests">No hay solicitudes enviadas</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const requestData = { id: doc.id, ...doc.data() };
            const requestElement = createRequestElement(requestData, false);
            requestsList.appendChild(requestElement);
        });
    });
}

/**
 * Limpiar recursos al salir de la vista
 */
export function cleanupObraView() {
    if (unsubscribeRequests) {
        unsubscribeRequests();
        unsubscribeRequests = null;
    }
}

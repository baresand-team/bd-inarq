// Módulo de vista de oficina
import { 
    subscribeToAllRequests, 
    subscribeToFilteredRequests,
    getUniqueProjects,
    downloadImage,
    markAsDownloaded,
    deleteRequest
} from './storage-utils.js';
import { 
    showToast, 
    createRequestElement 
} from './ui.js';

let unsubscribeRequests = null;
let currentFilters = {};

/**
 * Inicializar vista de oficina
 */
export async function initOficinaView() {
    await loadProjects();
    setupFilterListeners();
    loadAllRequests();
}

/**
 * Cargar proyectos únicos para el filtro
 */
async function loadProjects() {
    try {
        const projects = await getUniqueProjects();
        const projectSelect = document.getElementById('filter-project');
        
        if (projectSelect) {
            // Limpiar opciones existentes excepto "Todos"
            projectSelect.innerHTML = '<option value="">Todos los proyectos</option>';
            
            // Agregar proyectos
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                projectSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando proyectos:', error);
    }
}

/**
 * Configurar listeners de filtros
 */
function setupFilterListeners() {
    const filterProject = document.getElementById('filter-project');
    const filterStatus = document.getElementById('filter-status');
    const filterType = document.getElementById('filter-type');
    
    if (filterProject) {
        filterProject.addEventListener('change', handleFilterChange);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', handleFilterChange);
    }
    
    if (filterType) {
        filterType.addEventListener('change', handleFilterChange);
    }
}

/**
 * Manejar cambio en filtros
 */
function handleFilterChange() {
    // Actualizar filtros actuales
    currentFilters = {
        projectId: document.getElementById('filter-project')?.value || '',
        status: document.getElementById('filter-status')?.value || '',
        type: document.getElementById('filter-type')?.value || ''
    };
    
    // Recargar solicitudes con filtros
    loadFilteredRequests();
}

/**
 * Cargar todas las solicitudes
 */
function loadAllRequests() {
    const requestsList = document.getElementById('office-requests-list');
    if (!requestsList) return;
    
    // Limpiar suscripción anterior
    if (unsubscribeRequests) {
        unsubscribeRequests();
    }
    
    // Suscribirse a cambios en tiempo real
    unsubscribeRequests = subscribeToAllRequests((snapshot) => {
        displayRequests(snapshot);
    });
}

/**
 * Cargar solicitudes filtradas
 */
function loadFilteredRequests() {
    const requestsList = document.getElementById('office-requests-list');
    if (!requestsList) return;
    
    // Limpiar suscripción anterior
    if (unsubscribeRequests) {
        unsubscribeRequests();
    }
    
    // Si no hay filtros, cargar todas
    const hasFilters = Object.values(currentFilters).some(value => value !== '');
    
    if (hasFilters) {
        unsubscribeRequests = subscribeToFilteredRequests(currentFilters, (snapshot) => {
            displayRequests(snapshot);
        });
    } else {
        loadAllRequests();
    }
}

/**
 * Mostrar solicitudes en la lista
 */
function displayRequests(snapshot) {
    const requestsList = document.getElementById('office-requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '';
    
    if (snapshot.empty) {
        requestsList.innerHTML = '<p class="no-requests">No hay solicitudes disponibles</p>';
        return;
    }
    
    snapshot.forEach(doc => {
        const requestData = { id: doc.id, ...doc.data() };
        const requestElement = createRequestElement(requestData, true);
        requestsList.appendChild(requestElement);
    });
}

/**
 * Descargar imagen de una solicitud
 */
export async function downloadRequestImage(requestId, imageUrl) {
    try {
        const fileName = `solicitud_${requestId}_${Date.now()}.jpg`;
        await downloadImage(imageUrl, fileName);
    } catch (error) {
        console.error('Error descargando imagen:', error);
        showToast('Error al descargar imagen', 'error');
    }
}

/**
 * Marcar solicitud como descargada
 */
export async function markRequestAsDownloaded(requestId) {
    try {
        await markAsDownloaded(requestId);
    } catch (error) {
        console.error('Error marcando como descargado:', error);
        showToast('Error al marcar como descargado', 'error');
    }
}

/**
 * Eliminar solicitud
 */
export async function deleteRequestById(requestId, imageStoragePath) {
    try {
        if (confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
            await deleteRequest(requestId, imageStoragePath);
        }
    } catch (error) {
        console.error('Error eliminando solicitud:', error);
        showToast('Error al eliminar solicitud', 'error');
    }
}

/**
 * Limpiar recursos al salir de la vista
 */
export function cleanupOficinaView() {
    if (unsubscribeRequests) {
        unsubscribeRequests();
        unsubscribeRequests = null;
    }
}

// Hacer funciones disponibles globalmente para onclick
window.downloadImage = (requestId, imageUrl) => downloadRequestImage(requestId, imageUrl);
window.markAsDownloaded = (requestId) => markRequestAsDownloaded(requestId);
window.deleteRequest = (requestId, imageStoragePath) => deleteRequestById(requestId, imageStoragePath);

// Módulo de utilidades de UI

/**
 * Mostrar pantalla de carga
 */
export function showLoading() {
    // Función deshabilitada - no hay pantalla de carga
    console.log('Loading...');
}

/**
 * Ocultar pantalla de carga
 */
export function hideLoading() {
    // Función deshabilitada - no hay pantalla de carga
    console.log('Loading complete');
}

/**
 * Mostrar toast de mensaje
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // Limpiar clases anteriores
    toast.className = 'toast';
    
    // Agregar clase de tipo
    toast.classList.add(type);
    
    // Establecer mensaje
    toast.textContent = message;
    
    // Mostrar toast
    toast.classList.remove('hidden');
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * Mostrar pantalla específica
 */
export function showScreen(screenId) {
    // Ocultar todas las pantallas
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
    
    // Mostrar pantalla específica
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
}

/**
 * Crear elemento de solicitud para la lista
 */
export function createRequestElement(request, isOffice = false) {
    const requestDiv = document.createElement('div');
    requestDiv.className = 'request-item';
    requestDiv.dataset.requestId = request.id;
    
    const statusClass = request.status || 'pending';
    const statusText = request.status === 'downloaded' ? 'Descargado' : 'Pendiente';
    
    requestDiv.innerHTML = `
        <div class="request-header">
            <h3>${request.title}</h3>
            <span class="status ${statusClass}">${statusText}</span>
        </div>
        <div class="request-details">
            <p><strong>Proyecto:</strong> ${request.projectId}</p>
            <p><strong>Obra:</strong> ${request.obraName}</p>
            <p><strong>Tipo:</strong> ${request.type}</p>
            <p><strong>Descripción:</strong> ${request.description}</p>
            <p><strong>Enviado por:</strong> ${request.createdByName}</p>
            <p><strong>Fecha:</strong> ${new Date(request.createdAt.seconds * 1000).toLocaleString()}</p>
        </div>
        ${request.imageUrl ? `
            <div class="request-image">
                <img src="${request.imageUrl}" alt="Imagen del pedido" class="request-thumbnail" onclick="openImageModal('${request.imageUrl}')">
            </div>
        ` : ''}
        <div class="request-actions">
            ${isOffice ? `
                <button class="btn btn-small btn-primary" onclick="downloadImage('${request.id}', '${request.imageUrl}')" ${!request.imageUrl ? 'disabled' : ''}>
                    Descargar
                </button>
                <button class="btn btn-small btn-success" onclick="markAsDownloaded('${request.id}')" ${request.status === 'downloaded' ? 'disabled' : ''}>
                    Marcar como Descargado
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteRequest('${request.id}')">
                    Eliminar
                </button>
            ` : ''}
        </div>
    `;
    
    return requestDiv;
}

/**
 * Crear elemento de imagen de vista previa
 */
export function createImagePreview(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewDiv = document.getElementById('image-preview');
            if (previewDiv) {
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Vista previa" class="preview-image">
                    <button type="button" class="btn btn-small btn-danger" onclick="removeImagePreview()">Eliminar</button>
                `;
                previewDiv.classList.remove('hidden');
            }
            resolve(e.target.result);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Remover vista previa de imagen
 */
export function removeImagePreview() {
    const previewDiv = document.getElementById('image-preview');
    const fileInput = document.getElementById('image-upload');
    
    if (previewDiv) {
        previewDiv.innerHTML = '';
        previewDiv.classList.add('hidden');
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
}

/**
 * Abrir modal de imagen
 */
export function openImageModal(imageUrl) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    
    if (modal && modalImage) {
        modalImage.src = imageUrl;
        modal.classList.remove('hidden');
    }
}

/**
 * Cerrar modal de imagen
 */
export function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Configurar listeners de modal
 */
export function setupModalListeners() {
    const modal = document.getElementById('image-modal');
    const closeBtn = modal?.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
}

/**
 * Mostrar spinner en botón
 */
export function showButtonSpinner(button, text = 'Cargando...') {
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-small"></span> ${text}`;
    return originalText;
}

/**
 * Restaurar botón después del spinner
 */
export function hideButtonSpinner(button, originalText) {
    button.disabled = false;
    button.textContent = originalText;
}

/**
 * Validar archivo de imagen
 */
export function validateImageFile(file) {
    const maxSize = 3 * 1024 * 1024; // 3MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
        showToast('Solo se permiten archivos JPG y PNG', 'error');
        return false;
    }
    
    if (file.size > maxSize) {
        showToast('El archivo debe ser menor a 3MB', 'error');
        return false;
    }
    
    return true;
}

/**
 * Comprimir imagen usando Canvas
 */
export function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calcular nuevas dimensiones manteniendo proporción
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a blob
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Hacer funciones disponibles globalmente para onclick
window.openImageModal = openImageModal;
window.removeImagePreview = removeImagePreview;

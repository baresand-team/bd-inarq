// Módulo de utilidades de Storage
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject,
    getMetadata
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { firebaseConfig } from './firebase-config.js';
import { showToast, showButtonSpinner, hideButtonSpinner, compressImage } from './ui.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

/**
 * Subir imagen a Storage y crear documento en Firestore
 */
export async function uploadImageAndCreateRequest(requestData, imageFile, onProgress) {
    try {
        let imageUrl = null;
        let imageStoragePath = null;
        
        // Si hay imagen, subirla primero
        if (imageFile) {
            const compressedFile = await compressImage(imageFile);
            const uploadResult = await uploadImage(compressedFile, requestData.projectId, onProgress);
            imageUrl = uploadResult.downloadURL;
            imageStoragePath = uploadResult.storagePath;
        }
        
        // Crear documento en Firestore
        const requestRef = await addDoc(collection(db, 'requests'), {
            ...requestData,
            imageUrl,
            imageStoragePath,
            createdAt: new Date(),
            status: 'pending',
            downloadedByOffice: false
        });
        
        return requestRef.id;
    } catch (error) {
        console.error('Error subiendo imagen y creando solicitud:', error);
        showToast('Error al enviar solicitud', 'error');
        throw error;
    }
}

/**
 * Subir imagen a Storage
 */
export async function uploadImage(file, projectId, onProgress) {
    try {
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `request_${timestamp}.${fileExtension}`;
        const storagePath = `projects/${projectId}/images/${fileName}`;
        
        // Crear referencia en Storage
        const storageRef = ref(storage, storagePath);
        
        // Configurar metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploaderUid: getCurrentUserUid(),
                requestId: 'pending' // Se actualizará después de crear el documento
            }
        };
        
        // Subir archivo con progreso
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Calcular progreso
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error('Error subiendo archivo:', error);
                    reject(error);
                },
                async () => {
                    try {
                        // Obtener URL de descarga
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({
                            downloadURL,
                            storagePath
                        });
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error en uploadImage:', error);
        throw error;
    }
}

/**
 * Descargar imagen
 */
export async function downloadImage(imageUrl, fileName) {
    try {
        // Crear enlace temporal para descarga
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName || 'imagen_descargada.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Descarga iniciada', 'success');
    } catch (error) {
        console.error('Error descargando imagen:', error);
        showToast('Error al descargar imagen', 'error');
    }
}

/**
 * Eliminar imagen y documento
 */
export async function deleteRequest(requestId, imageStoragePath) {
    try {
        // Eliminar imagen de Storage si existe
        if (imageStoragePath) {
            const imageRef = ref(storage, imageStoragePath);
            await deleteObject(imageRef);
        }
        
        // Eliminar documento de Firestore
        await deleteDoc(doc(db, 'requests', requestId));
        
        showToast('Solicitud eliminada correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando solicitud:', error);
        showToast('Error al eliminar solicitud', 'error');
    }
}

/**
 * Marcar solicitud como descargada
 */
export async function markAsDownloaded(requestId) {
    try {
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'downloaded',
            downloadedByOffice: true,
            downloadedAt: new Date()
        });
        
        showToast('Marcado como descargado', 'success');
    } catch (error) {
        console.error('Error marcando como descargado:', error);
        showToast('Error al marcar como descargado', 'error');
    }
}

/**
 * Obtener solicitudes en tiempo real para obra
 */
export function subscribeToUserRequests(userId, callback) {
    const q = query(
        collection(db, 'requests'),
        where('createdByUid', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, callback);
}

/**
 * Obtener todas las solicitudes en tiempo real para oficina
 */
export function subscribeToAllRequests(callback) {
    const q = query(
        collection(db, 'requests'),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, callback);
}

/**
 * Obtener solicitudes filtradas para oficina
 */
export function subscribeToFilteredRequests(filters, callback) {
    let q = query(collection(db, 'requests'));
    
    // Aplicar filtros
    if (filters.projectId) {
        q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters.status) {
        q = query(q, where('status', '==', filters.status));
    }
    if (filters.type) {
        q = query(q, where('type', '==', filters.type));
    }
    
    // Ordenar por fecha
    q = query(q, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, callback);
}

/**
 * Obtener proyectos únicos para filtros
 */
export async function getUniqueProjects() {
    try {
        const q = query(collection(db, 'requests'));
        const snapshot = await getDocs(q);
        
        const projects = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.projectId) {
                projects.add(data.projectId);
            }
        });
        
        return Array.from(projects).sort();
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        return [];
    }
}

/**
 * Obtener UID del usuario actual
 */
function getCurrentUserUid() {
    // Esta función se actualizará dinámicamente desde auth.js
    return window.currentUserUid || null;
}

// Hacer funciones disponibles globalmente para onclick
window.downloadImage = downloadImage;
window.markAsDownloaded = markAsDownloaded;
window.deleteRequest = deleteRequest;

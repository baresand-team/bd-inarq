// Módulo de autenticación
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { showToast, hideLoading, showLoading } from './ui.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado global del usuario
let currentUser = null;
let userRole = null;

// Actualizar UID global para storage-utils
function updateGlobalUserUid() {
    window.currentUserUid = currentUser ? currentUser.uid : null;
}

/**
 * Inicializar el sistema de autenticación
 */
export function initAuth() {
    console.log('🔐 Inicializando autenticación...');
    
    try {
        // Escuchar cambios en el estado de autenticación
        onAuthStateChanged(auth, async (user) => {
            console.log('🔄 Estado de autenticación cambió:', user ? 'Usuario autenticado' : 'No autenticado');
            
            if (user) {
                currentUser = user;
                updateGlobalUserUid();
                await loadUserRole();
                // Notificar a app.js que el estado cambió
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { user, role: userRole } 
                }));
            } else {
                currentUser = null;
                userRole = null;
                updateGlobalUserUid();
                // Notificar a app.js que el estado cambió
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { user: null, role: null } 
                }));
            }
        });
        
        console.log('✅ Autenticación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
    }
}

/**
 * Cargar el rol del usuario desde Firestore
 */
async function loadUserRole() {
    if (!currentUser) return;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            userRole = userDoc.data().role;
        } else {
            // Si no existe el documento, crear uno con rol "obra" por defecto
            await setDoc(doc(db, 'users', currentUser.uid), {
                name: currentUser.displayName || 'Usuario',
                role: 'obra',
                createdAt: new Date()
            });
            userRole = 'obra';
        }
    } catch (error) {
        console.error('Error cargando rol del usuario:', error);
        showToast('Error cargando información del usuario', 'error');
    }
}

/**
 * Iniciar sesión con email y contraseña
 */
export async function loginUser(email, password) {
    try {
        showLoading();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showToast('Sesión iniciada correctamente', 'success');
        return userCredential.user;
    } catch (error) {
        console.error('Error en login:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos. Intenta más tarde';
                break;
        }
        
        showToast(errorMessage, 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * Registrar nuevo usuario
 */
export async function registerUser(name, email, password) {
    try {
        showLoading();
        
        // Verificar que las contraseñas coincidan
        const confirmPassword = document.getElementById('register-confirm-password').value;
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Crear documento de usuario en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            role: 'obra', // Rol por defecto
            createdAt: new Date()
        });
        
        showToast('Usuario registrado correctamente', 'success');
        return user;
    } catch (error) {
        console.error('Error en registro:', error);
        let errorMessage = 'Error al registrar usuario';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'El email ya está en uso';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                break;
        }
        
        if (error.message === 'Las contraseñas no coinciden') {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * Cerrar sesión
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        showToast('Sesión cerrada correctamente', 'success');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión', 'error');
    }
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Obtener rol del usuario actual
 */
export function getUserRole() {
    return userRole;
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated() {
    return currentUser !== null;
}

/**
 * Configurar listeners de formularios de autenticación
 */
export function setupAuthListeners() {
    // Listener para formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                await loginUser(email, password);
            } catch (error) {
                // Error ya manejado en loginUser
            }
        });
    }
    
    // Listener para formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            try {
                await registerUser(name, email, password);
            } catch (error) {
                // Error ya manejado en registerUser
            }
        });
    }
    
    // Listeners para tabs de login/registro
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginFormElement = document.getElementById('login-form');
    const registerFormElement = document.getElementById('register-form');
    
    if (loginTab && registerTab && loginFormElement && registerFormElement) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginFormElement.classList.remove('hidden');
            registerFormElement.classList.add('hidden');
        });
        
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerFormElement.classList.remove('hidden');
            loginFormElement.classList.add('hidden');
        });
    }
}

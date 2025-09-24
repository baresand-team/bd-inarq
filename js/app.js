// Punto de entrada principal de la aplicación
import { initAuth, setupAuthListeners, getCurrentUser, getUserRole, isAuthenticated } from './auth.js';
import { initObraView, cleanupObraView } from './obra.js';
import { initOficinaView, cleanupOficinaView } from './oficina.js';
import { showScreen, setupModalListeners } from './ui.js';

// Estado de la aplicación
let currentView = null;

/**
 * Inicializar la aplicación
 */
async function initApp() {
    try {
        // Configurar listeners de UI
        setupModalListeners();
        setupAuthListeners();
        
        // Inicializar autenticación
        initAuth();
        
        // Configurar listeners de logout
        setupLogoutListeners();
        
        // Escuchar cambios en el estado de autenticación
        window.addEventListener('authStateChanged', (event) => {
            const { user, role } = event.detail;
            if (user && role) {
                showViewByRole(role);
            } else {
                showScreen('auth-screen');
            }
        });
        
        // Verificar estado de autenticación inicial
        checkAuthState();
        
    } catch (error) {
        console.error('Error inicializando aplicación:', error);
    }
}

/**
 * Verificar estado de autenticación y mostrar vista correspondiente
 */
function checkAuthState() {
    if (isAuthenticated()) {
        const role = getUserRole();
        if (role) {
            showViewByRole(role);
        } else {
            // Si no hay rol, mostrar pantalla de auth hasta que se cargue
            showScreen('auth-screen');
        }
    } else {
        showScreen('auth-screen');
    }
}

/**
 * Mostrar vista según el rol del usuario
 */
function showViewByRole(role) {
    // Limpiar vista anterior
    if (currentView) {
        cleanupCurrentView();
    }
    
    if (role === 'obra') {
        showScreen('obra-screen');
        initObraView();
        currentView = 'obra';
    } else if (role === 'office') {
        showScreen('oficina-screen');
        initOficinaView();
        currentView = 'office';
    } else {
        showToast('Rol de usuario no válido', 'error');
        showScreen('auth-screen');
    }
}

/**
 * Limpiar vista actual
 */
function cleanupCurrentView() {
    if (currentView === 'obra') {
        cleanupObraView();
    } else if (currentView === 'office') {
        cleanupOficinaView();
    }
    currentView = null;
}

/**
 * Configurar listeners de logout
 */
function setupLogoutListeners() {
    const logoutBtnObra = document.getElementById('logout-btn');
    const logoutBtnOficina = document.getElementById('logout-btn-office');
    
    if (logoutBtnObra) {
        logoutBtnObra.addEventListener('click', handleLogout);
    }
    
    if (logoutBtnOficina) {
        logoutBtnOficina.addEventListener('click', handleLogout);
    }
}

/**
 * Manejar logout
 */
async function handleLogout() {
    try {
        const { logoutUser } = await import('./auth.js');
        await logoutUser();
        
        // Limpiar vista actual
        cleanupCurrentView();
        
        // Mostrar pantalla de login
        showScreen('auth-screen');
        
    } catch (error) {
        console.error('Error en logout:', error);
    }
}

/**
 * Escuchar cambios en el estado de autenticación
 */
function setupAuthStateListener() {
    // Este listener se configura en auth.js
    // Aquí solo verificamos el estado inicial
    checkAuthState();
}

// Inicializar aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicación...');
    initApp();
});

// Debug: mostrar errores no capturados
window.addEventListener('error', (event) => {
    console.error('❌ Error no capturado:', event.error);
    document.body.innerHTML = '<h1>Error en la aplicación</h1><p>Revisa la consola para más detalles.</p>';
});

# BD-INARQ - Sistema de Gestión de Obra y Oficina

Sistema web estático para gestión de pedidos y asistencia entre obra y oficina, desarrollado con Firebase y desplegado en GitHub Pages.

## 🚀 Características

- **Autenticación**: Login y registro con email/contraseña
- **Control de roles**: Usuarios "obra" y "oficina" con interfaces diferenciadas
- **Gestión de imágenes**: Subida, descarga y eliminación de imágenes
- **Tiempo real**: Actualizaciones automáticas con Firestore
- **Responsive**: Diseño mobile-first optimizado para móviles
- **Seguridad**: Reglas de Firestore y Storage configuradas

## 📁 Estructura del Proyecto

```
/
├─ index.html                    # Página principal
├─ README.md                     # Este archivo
├─ css/
│  └─ styles.css                 # Estilos principales
├─ js/
│  ├─ firebase-config.example.js # Configuración Firebase (ejemplo)
│  ├─ firebase-config.js         # Configuración Firebase (real)
│  ├─ app.js                     # Punto de entrada principal
│  ├─ auth.js                    # Módulo de autenticación
│  ├─ obra.js                    # Vista de usuario obra
│  ├─ oficina.js                 # Vista de usuario oficina
│  ├─ storage-utils.js           # Utilidades de Storage
│  └─ ui.js                      # Funciones auxiliares de UI
├─ firebase-rules/
│  ├─ firestore.rules            # Reglas de Firestore
│  └─ storage.rules              # Reglas de Storage
└─ assets/                       # Recursos opcionales
```

## 🛠️ Configuración Inicial

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Crear un proyecto"
3. Ingresa el nombre del proyecto (ej: "bd-inarq")
4. Habilita Google Analytics (opcional)
5. Crea el proyecto

### 2. Configurar Authentication

1. En el panel lateral, ve a "Authentication"
2. Haz clic en "Comenzar"
3. Ve a la pestaña "Sign-in method"
4. Habilita "Correo electrónico/contraseña"
5. Guarda los cambios

### 3. Configurar Firestore Database

1. En el panel lateral, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Iniciar en modo de prueba" (se configurarán las reglas después)
4. Elige una ubicación para tu base de datos
5. Haz clic en "Listo"

### 4. Configurar Storage

1. En el panel lateral, ve a "Storage"
2. Haz clic en "Comenzar"
3. Revisa las reglas de seguridad (se configurarán después)
4. Elige una ubicación para tu bucket
5. Haz clic en "Siguiente" y luego "Listo"

### 5. Obtener Configuración de Firebase

1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. Desplázate hacia abajo hasta "Tus apps"
3. Haz clic en el ícono web (</>)
4. Ingresa un nombre para tu app (ej: "bd-inarq-web")
5. No marques "También configura Firebase Hosting"
6. Haz clic en "Registrar app"
7. Copia la configuración de Firebase

### 6. Configurar el Proyecto

1. Renombra `js/firebase-config.example.js` a `js/firebase-config.js`
2. Reemplaza la configuración de ejemplo con tu configuración real:

```javascript
export const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 7. Configurar Reglas de Seguridad

#### Firestore Rules

1. Ve a "Firestore Database" > "Reglas"
2. Reemplaza el contenido con el archivo `firebase-rules/firestore.rules`
3. Haz clic en "Publicar"rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users collection: cada usuario puede leer/escribir su propio perfil
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // requests collection
    match /requests/{requestId} {
      allow create: if request.auth != null
                    && request.resource.data.createdByUid == request.auth.uid;
      allow read: if request.auth != null && (
                    resource.data.createdByUid == request.auth.uid ||
                    firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == "office"
                  );
      allow update: if request.auth != null && (
                      request.auth.uid == resource.data.createdByUid ||
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == "office"
                    );
      allow delete: if request.auth != null
                    && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == "office";
    }
  }
}


#### Storage Rules

1. Ve a "Storage" > "Reglas"
2. Reemplaza el contenido con el archivo `firebase-rules/storage.rules`
3. Haz clic en "Publicar"

## 👥 Configuración de Usuarios

### Crear Usuario de Oficina

**Opción 1: Desde Firebase Console**
1. Ve a "Authentication" > "Users"
2. Haz clic en "Agregar usuario"
3. Ingresa email y contraseña
4. Crea el usuario
5. Ve a "Firestore Database" > "Datos"
6. Crea una colección llamada "users"
7. Crea un documento con el UID del usuario
8. Agrega los campos:
   - `name`: "Nombre del usuario"
   - `role`: "office"
   - `createdAt`: timestamp

**Opción 2: Registro normal + edición**
1. Registra un usuario normal desde la app
2. Ve a Firestore Database
3. Busca el documento en `/users/{uid}`
4. Cambia el campo `role` de "obra" a "office"

## 🚀 Despliegue en GitHub Pages

### 1. Crear Repositorio en GitHub

1. Crea un nuevo repositorio en GitHub
2. Sube todos los archivos del proyecto
3. Haz commit y push de los cambios

### 2. Configurar GitHub Pages

1. Ve a la configuración del repositorio
2. Desplázate hasta "Pages" en el menú lateral
3. En "Source", selecciona "Deploy from a branch"
4. Selecciona "main" como branch
5. Selecciona "/ (root)" como folder
6. Haz clic en "Save"
7. Espera unos minutos para que se despliegue

### 3. Acceder a la Aplicación

Tu aplicación estará disponible en:
`https://tu-usuario.github.io/nombre-del-repositorio`

## 📱 Uso de la Aplicación

### Para Usuarios de Obra

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Crear Pedido**: Completa el formulario con:
   - ID del proyecto
   - Nombre de la obra
   - Tipo (pedido/asistencia)
   - Título y descripción
   - Imagen opcional
3. **Ver Pedidos**: Consulta tus pedidos enviados

### Para Usuarios de Oficina

1. **Login**: Inicia sesión con cuenta de oficina
2. **Ver Pedidos**: Lista todos los pedidos recibidos
3. **Filtrar**: Usa los filtros por proyecto, estado y tipo
4. **Descargar**: Descarga imágenes de los pedidos
5. **Marcar**: Marca pedidos como descargados
6. **Eliminar**: Elimina pedidos completados

## 🔧 Personalización

### Cambiar Límites de Archivo

En `js/storage-utils.js`, línea 15:
```javascript
const maxSize = 3 * 1024 * 1024; // 3MB - cambiar aquí
```

### Cambiar Calidad de Compresión

En `js/ui.js`, función `compressImage`:
```javascript
export function compressImage(file, maxWidth = 1200, quality = 0.8) {
    // Cambiar maxWidth y quality según necesidades
}
```

### Modificar Estilos

Edita `css/styles.css` para personalizar colores, fuentes y layout.

## 🐛 Solución de Problemas

### Error de CORS
- Asegúrate de que la aplicación se ejecute desde un servidor (no file://)
- GitHub Pages funciona correctamente

### Error de Autenticación
- Verifica que las reglas de Firestore estén configuradas correctamente
- Confirma que Authentication esté habilitado

### Error de Storage
- Verifica que las reglas de Storage estén configuradas
- Confirma que el bucket de Storage esté creado

### Imágenes no se suben
- Verifica el tamaño del archivo (máximo 3MB)
- Confirma que el tipo de archivo sea JPG o PNG

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de Firebase
2. Verifica que todas las configuraciones estén correctas
3. Consulta los logs de la consola del navegador
4. Crea un issue en el repositorio

---

**Nota**: Recuerda mantener tus credenciales de Firebase seguras y nunca las subas a repositorios públicos.

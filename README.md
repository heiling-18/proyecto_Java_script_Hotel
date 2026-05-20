
---

# Hotel El Rincón del Carmen – Sistema de Reservas

Sistema web completo para la gestión de reservas, administración de habitaciones y visualización de servicios del Hotel El Rincón del Carmen. Desarrollado con HTML5, CSS3, JavaScript (ES6+) y arquitectura basada en Web Components.

---

## Descripción del Proyecto

Este proyecto implementa un sitio web funcional que permite a los clientes:

- Explorar las instalaciones del hotel.
- Consultar disponibilidad de habitaciones.
- Realizar reservas de manera sencilla.
- Gestionar sus propias reservas mediante autenticación.

Además, incluye un panel administrativo para la gestión completa del inventario de habitaciones y las reservas realizadas por los usuarios.

---

## Características Principales

### Sitio Web Público

- **Landing Page** con carrusel de habitaciones, galería de instalaciones y servicios (restaurante, spa, zonas húmedas).
- **Sistema de Reservas** con búsqueda por fechas, número de personas y disponibilidad en tiempo real.
- **Detalles de Habitaciones** con información de camas, servicios incluidos, precios y fotografías.
- **Página de Contacto** con ubicación, dirección y múltiples canales de comunicación.
- **Diseño Responsivo**, optimizado principalmente para dispositivos móviles.

### Sistema de Usuarios

- **Registro de Usuarios** con datos completos (identificación, nombre, nacionalidad, email, teléfono, contraseña).
- **Autenticación** mediante login.
- **Gestión de Reservas** para que cada usuario pueda crear y cancelar sus propias reservas.

### Panel Administrativo

- **Gestión de Habitaciones (CRUD)**:
  - Cantidad de camas
  - Capacidad máxima
  - Valor por noche
  - Servicios incluidos
- **Gestión de Reservas**:
  - Visualización completa
  - Modificación
  - Cancelación
- **Control de Inventario** y calendario de ocupación.

---

## Funcionalidades del Sistema

- Validación de disponibilidad en tiempo real.
- Prevención de solapamiento de reservas.
- Liberación automática de habitaciones al cancelar.
- Cálculo automático del valor total según noches y número de personas.
- Persistencia de datos mediante LocalStorage.
- Validación completa de formularios.
- Autenticación obligatoria para realizar reservas.

---

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica.
- **CSS3**: Diseño responsivo y moderno.
- **JavaScript (ES6+)**: Lógica de negocio y manipulación del DOM.
- **Web Components**: Modularidad y escalabilidad.
- **LocalStorage**: Persistencia simulada de datos.

---

## Estructura del Proyecto

```
hotel-rincon-carmen/
PROYECTO_JSAV/
PROYECTO_JAVA/
│
├── css/
│   ├── admin.css
│   ├── contacto.css
│   ├── habitaciones.css
│   ├── quejas.css
│   ├── reservas.css
│   └── style.css
│
├── image/
│   └── (imágenes del proyecto)
│
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── auth.js
│   ├── contacto.js
│   ├── galeria.js
│   ├── hero-carousel.js
│   ├── hotel.js
│   ├── luxe-pass.js
│   └── reservas.js
│
├── admin.html
├── contacto.html
├── index.html
├── reservas.html
│
└── README.md
```

---

## Instalación y Uso

### Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Edge, Safari).
- Servidor web local (opcional, recomendado para desarrollo).

### Instalación

1. Clonar el repositorio:

```
git clone [URL-del-repositorio]
cd hotel-rincon-carmen
```

2. Abrir el proyecto con Live Server o cualquier servidor local.

---

## Usuarios de Prueba

### Usuario Cliente
- Email: cliente@example.com  
- Contraseña: cliente123  

### Usuario Administrador
- Email: admin@hoteldelcarmen.com  
- Contraseña: admin123!  

---

## Funcionalidades por Página

### 1. Landing Page (`/`)
- Carrusel de habitaciones destacadas.
- Galería de servicios.
- Información general del hotel.
- Botón de acceso al sistema de reservas.

### 2. Reservas (`/reservas.html`)
- Formulario de búsqueda (fechas, personas).
- Listado de habitaciones disponibles.
- Vista detallada de cada habitación.
- Sistema de reserva (requiere login).
- Gestión de reservas del usuario.

### 3. Contacto (`/contacto.html`)
- Mapa de ubicación.
- Dirección física.
- Teléfonos y correo de contacto.
- Formulario de consultas.

### 4. Panel Administrativo (`/admin.html`)
- Dashboard con estadísticas.
- CRUD de habitaciones.
- Gestión de reservas de todos los clientes.
- Visualización del calendario de ocupación.

---

## Estructura de Datos (LocalStorage)

### Habitaciones

```json
{
  "id": "room-001",
  "nombre": "Suite Presidencial",
  "camas": 2,
  "personasMax": 4,
  "valorNoche": 250000,
  "servicios": ["internet", "minibar", "jacuzzi", "tv"],
  "imagenes": ["url1", "url2"],
  "descripcion": "..."
}
```

### Reservas

```json
{
  "id": "res-001",
  "habitacionId": "room-001",
  "usuarioId": "user-001",
  "fechaInicio": "2025-10-15",
  "fechaFin": "2025-10-18",
  "personas": 2,
  "valorTotal": 750000,
  "estado": "activa"
}
```

### Usuarios

```json
{
  "id": "user-001",
  "identificacion": "1234567890",
  "nombre": "Juan Pérez",
  "nacionalidad": "Colombiano",
  "email": "juan@email.com",
  "telefono": "3001234567",
  "rol": "cliente"
}
```

---

## Validaciones Implementadas

- Fechas válidas (no se permiten fechas pasadas).
- Verificación de disponibilidad en tiempo real.
- Prevención de solapamiento de reservas.
- Validación de capacidad máxima por habitación.
- Autenticación obligatoria para reservar.
- Validación completa de formularios.

---

## Diseño Responsivo

Optimizado para:

- Dispositivos móviles (320px – 767px)
- Tablets (768px – 1024px)
- Escritorio (1025px en adelante)

---

## Funcionalidades Futuras

- Integración con backend real.
- Pasarela de pagos.
- Notificaciones por correo.
- Sistema de reviews y calificaciones.
- Chat de soporte en vivo.
- Multi-idioma.

---

## Buenas Prácticas Implementadas

- Convenciones de nombres consistentes.
- Comentarios en secciones complejas.
- Validación estricta de datos.
- Manejo robusto de errores.

---

## Comandos Git Básicos

```
git init
git add .
git commit -m "Primer commit"
git push origin main
```

---

## Licencia

Proyecto de uso académico para el programa de desarrollo web.

---

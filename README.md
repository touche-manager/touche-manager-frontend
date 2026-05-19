# Touché Manager — Frontend 🤺📱

Aplicación Web Progresiva (PWA) de la plataforma de gestión de torneos de esgrima, desarrollada como Trabajo Final Integrador de la Tecnicatura Universitaria en Programación (UTN FRC).

## 📖 Acerca del Proyecto

**Touché Manager** busca unificar la experiencia de la esgrima competitiva. Este cliente frontend está diseñado con un enfoque **Mobile-First**, garantizando que los atletas y árbitros puedan usarlo cómodamente desde sus celulares al pie de la pista, mientras que los organizadores pueden administrar los torneos desde una vista de escritorio ampliada.

## 🛠️ Stack Tecnológico

- **Framework:** Angular 19 (Enfoque exclusivo en Standalone Components)
- **Estado Reactivo:** Angular Signals
- **Estilos y UI:** Tailwind CSS v3
- **Características especiales:** PWA (Progressive Web App) para instalación en dispositivos móviles.

## 📂 Estructura del Proyecto

La aplicación sigue una arquitectura orientada a *features*:
- `core/`: Servicios base (Auth), Guards, Interceptors y modelos globales.
- `shared/`: Componentes UI reutilizables (botones, modales) y pipes.
- `features/`:
  - `auth`: Pantallas de login, registro y selección de roles multi-perfil.
  - `athlete`: Portal del atleta para carga de aptos médicos e historial.
  - `tournament`: Vista pública y gestión de torneos.
  - `bout`: Interfaz móvil de arbitraje.

## 🚀 Guía de Instalación y Ejecución

### Prerrequisitos
- Node.js (versión 18+ recomendada)
- Angular CLI global (`npm install -g @angular/cli`)

### 1. Instalación de Dependencias
Clone el repositorio y ejecute en la raíz del frontend:
```bash
npm install
```

### 2. Configuración
La aplicación espera que la API del backend esté corriendo en `http://localhost:8080/api`. Esto está configurado por defecto en `src/environments/environment.ts`.

### 3. Ejecutar la Aplicación (Servidor de Desarrollo)
Inicie el servidor de desarrollo local:
```bash
ng serve
```
La aplicación estará disponible en 👉 **[http://localhost:4200](http://localhost:4200)**.
La vista se recargará automáticamente si realiza cambios en los archivos fuente.

### 4. Compilación para Producción
Para compilar el proyecto y generar los archivos de la PWA optimizados para producción:
```bash
ng build
```
Los artefactos generados se guardarán en el directorio `dist/`.

---
*Desarrollado para la Universidad Tecnológica Nacional - Facultad Regional Córdoba (2026).*

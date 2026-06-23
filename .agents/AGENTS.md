# Reglas y Convenciones de Arquitectura para el Frontend (Touché Manager)

Este documento contiene las reglas de diseño, arquitectura y convenciones de código para este proyecto Angular. Todos los agentes de IA deben leer y seguir estas directivas estrictamente antes de escribir o modificar código.

## 1. Arquitectura de Componentes
- **Separación de responsabilidades:** Todos los componentes DEBEN tener sus archivos separados (`.ts`, `.html` y `.css`). Nunca utilices `template: \`...\`` o `styles: [...]` inline dentro del decorador `@Component`, sin importar qué tan pequeño sea el componente. Usa siempre `templateUrl` y `styleUrl`.
- **Standalone Components:** El proyecto usa Angular 19+ sin NgModules. Todo es `standalone: true`.
- **Reutilización y Centralización:** Fomentar el uso de componentes compartidos (`src/app/shared/components`) para elementos comunes de la interfaz para evitar que elementos queden fuera de la estética de la aplicación.

## 2. Sistema de Alertas y Notificaciones
- **PROHIBIDO el uso de alertas nativas:** Nunca utilices `window.alert()`, `window.confirm()` o `window.prompt()`.
- **AlertService Global:** En su lugar, inyecta y utiliza siempre el `AlertService` (`src/app/shared/services/alert.service.ts`). Este servicio devuelve Promesas, por lo que debes usar `async/await` al llamarlo.
  - Ejemplo: `const confirmed = await this.alertService.confirm('Título', 'Mensaje');`
  - Métodos disponibles: `success()`, `error()`, `warning()`, `info()`, `confirm()`.
- **Notificaciones silenciosas:** Las notificaciones de la aplicación se manejan a través de animaciones sutiles (como el rebote de la campana en `notification-bell`), y **NO** mediante "toasts" o alertas flotantes intrusivas en pantalla.

## 3. Estilo y Diseño (UI/UX)
- **Estética Blanca y Limpia:** La aplicación utiliza predominantemente una estética blanca y luminosa para sus fondos, con colores de acento (`touche-navy`, `touche-celeste`, `touche-gold`, `touche-alert`) definidos en las variables globales de CSS.
- **Clases Reutilizables:** Utiliza las clases globales definidas en `styles.css` (ej: `.btn-navy`, `.btn-ghost`, `.card`, `.input-field`, `.badge`) en lugar de generar repetidas y largas cadenas de utilidades de Tailwind en cada HTML.
- **Manejo del Scroll y Layout:** El espaciado inferior (`padding-bottom`) para evitar que el contenido quede pegado al fondo de la pantalla se gestiona de forma global en `styles.css` (en el contenedor del layout principal). **NO agregues** márgenes inferiores (`mb-4`, `margin-bottom: 2rem`, etc.) a componentes individuales como solución parche.

## 4. Convenciones de Código y Estado
- **Idiomas:** El código (nombres de variables, métodos, clases, rutas) DEBE estar rigurosamente en **Inglés**. Toda la interfaz visible para el usuario (textos, botones, placeholders, modales) DEBE estar en **Español**.
- **Signals:** Preferir el uso de Angular Signals (`signal()`, `computed()`, `effect()`) sobre RxJS para el manejo del estado local y derivado en los componentes.
- **Inyección de dependencias:** Utilizar siempre la función `inject()` en lugar del constructor (`constructor() { ... }`).
- **Tipado Fuerte:** Totalmente prohibido el uso de `any`. Definir siempre interfaces en `src/app/core/models/`.
- **Interacción con el Backend:** Los componentes jamás deben usar `HttpClient` directamente. Todas las peticiones deben pasar por un "Service" dedicado que procese y maneje los datos.

## 5. Autenticación y Seguridad
- El token JWT (`touche_token`) y el rol activo (`touche_rol`) se guardan en el `localStorage`.
- Todas las rutas privadas deben estar protegidas por el `AuthGuard`.
- El `AuthInterceptor` es el encargado exclusivo de adjuntar el token a las cabeceras HTTP de los requests.
- Si el backend devuelve un 401/403, el interceptor o el servicio deben cerrar la sesión adecuadamente.

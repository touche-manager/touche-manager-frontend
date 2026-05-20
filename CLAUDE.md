# Touché Manager — Frontend

Aplicación web progresiva (PWA) para gestión de torneos de esgrima.
Mobile-first, responsive. El desktop se usa para administración de torneos.
El mobile se usa para árbitros, atletas y espectadores.

## Stack
- Angular 19 (standalone components, sin NgModules)
- Angular Signals (estado reactivo, preferir sobre RxJS cuando sea posible)
- Angular Router con lazy loading por feature (loadComponent)
- HttpClient con interceptores desde DI (withInterceptorsFromDi)
- Tailwind CSS v3
- PWA (@angular/pwa)

## Estructura
```
src/app/
├── core/
│   ├── interceptors/   → AuthInterceptor (adjunta JWT en cada request)
│   ├── guards/         → AuthGuard (protege rutas privadas)
│   ├── models/         → interfaces TypeScript del dominio
│   └── services/       → AuthService y servicios base
├── shared/             → componentes y pipes reutilizables
└── features/
    ├── auth/           → login, registro, selección de rol
    ├── athlete/        → perfil, documentos
    ├── tournament/     → torneos, poules, eliminatorias
    └── bout/           → arbitraje, marcador
```

## Convenciones de código
- **EL CÓDIGO DEBE ESTAR EN INGLÉS Y LA INTERFAZ DE USUARIO EN ESPAÑOL**: nombres de componentes, métodos, variables, rutas y comentarios de código deben estar en inglés. Toda la interfaz de usuario del frontend (etiquetas, botones, títulos, marcadores de posición, textos y mensajes de error en pantalla) debe estar redactada en español. Excepción: documentación en README.md puede estar en español.
- Todos los componentes son standalone (no declarar en NgModule)
- Usar signals para estado local: `signal()`, `computed()`, `effect()`
- Formularios reactivos (ReactiveFormsModule), no template-driven
- Servicios inyectados con `inject()` dentro de componentes, no en constructor
- Interfaces TypeScript para todos los modelos (nunca `any`)
- Nombres de archivos: kebab-case (ej: athlete-profile.component.ts)
- Nombres de clases: PascalCase (ej: AthleteProfileComponent)

## Autenticación
- El token JWT se guarda en localStorage con la clave `touche_token`
- El rol activo se guarda en localStorage con la clave `touche_rol`
- AuthInterceptor lee el token y agrega el header: `Authorization: Bearer <token>`
- AuthGuard verifica que exista token válido antes de activar rutas protegidas
- Si el login devuelve lista de roles → navegar a /auth/select-role
- Si devuelve token directo → guardar y navegar al dashboard del rol

## Estado global (signals en AuthService)
```typescript
currentToken = signal<string | null>(null)
currentRol = signal<string | null>(null)
isAuthenticated = computed(() => !!this.currentToken())
```

## Rutas principales
- /auth/login
- /auth/register
- /auth/select-role
- /athlete/profile
- /athlete/documents
- /tournament/... (Sprint 3)
- /bout/... (Sprint 4)

## API
- Base URL definida en `src/environments/environment.ts` → `apiUrl: 'http://localhost:8080/api'`
- Todos los requests HTTP pasan por el servicio correspondiente al feature, nunca directo desde el componente
- Manejo de errores HTTP en el servicio, el componente solo maneja el resultado

## Modelos TypeScript (Sprint 1)
```typescript
// Usuario
interface LoginRequest { email: string; password: string }
interface LoginResponse { token?: string; roles?: string[] }
interface SelectRoleRequest { rol: string }

// Atleta
interface AtletaRequest {
  nombre: string; apellido: string; dni: string;
  fechaNacimiento: string; sexo: 'MASCULINO' | 'FEMENINO';
  manoHabil: 'DIESTRO' | 'ZURDO'; club: string; provincia: string;
}

// Documento
interface Documento {
  id: number; tipo: 'APTO_MEDICO' | 'COMPROBANTE_AFILIACION';
  urlArchivo: string; fechaSubida: string;
  fechaVigencia: string; activo: boolean;
}
```

## Reglas importantes para Claude Code
- No usar NgModule, todo standalone
- No usar `any`, siempre tipar correctamente
- No llamar al HttpClient directamente desde componentes, siempre a través de un servicio
- Los formularios siempre con validaciones antes de habilitar el botón de submit
- Mostrar estado de carga (loading) mientras se espera respuesta del backend
- Mostrar mensajes de error claros cuando el backend devuelve un error
- Diseño mobile-first: pensar primero en pantalla chica, luego adaptar a desktop con clases responsive de Tailwind

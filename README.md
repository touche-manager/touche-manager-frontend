# Touche Manager - Frontend

Aplicacion frontend basada en Angular 19 con Tailwind CSS v3 y soporte PWA.

## Stack
- Angular 19 (standalone components)
- Angular Router (lazy loading por feature con loadComponent)
- Angular Signals (estado reactivo)
- HttpClient con interceptores DI
- Tailwind CSS v3
- PWA (@angular/pwa)

## Estructura
- `src/app/core` (interceptors, guards, models, services base)
- `src/app/shared` (componentes y pipes reutilizables)
- `src/app/features/auth`
- `src/app/features/athlete`
- `src/app/features/tournament`
- `src/app/features/bout`

## Configuracion
- `src/environments/environment.ts` define `apiUrl` con `http://localhost:8080/api` como placeholder inicial.

## Correr el proyecto
1. Instalar dependencias:

```bash
npm install
```

2. Levantar el servidor de desarrollo:

```bash
ng serve
```

Luego abrir `http://localhost:4200/`.

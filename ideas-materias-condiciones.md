# Plan de Desarrollo y Mejoras: "Mi Organización"

Este documento consolida las ideas futuras y el reporte QA en un plan de acción priorizado para mejorar la plataforma.

## Prioridad Alta: Integridad y Funcionalidad Core
- [x] **Validación de notas:** Restringir ingresos estrictos (0 a 10) y afinar los redondeos y criterios (ej. 5.99 es regular, 6.00 aprobado).
- [x] **Manejo de valores nulos:** Mostrar guiones ("-") en vez de errores al calcular promedios sin notas (evitar división por cero).
- [x] **Sanitización de Notas (Seguridad):** Prevenir inyecciones XSS limpiando los inputs de texto.

## Prioridad Media: Experiencia de Usuario (UX) e Interfaz (UI)
- [x] **Ayuda Contextual:** Agregar un botón `!` en cada vista para guiar al usuario ("En esta página podés...").
- [x] **Estados Vacíos (Empty States):** Diseñar pantallas amigables para usuarios nuevos (ej. botón "Crear mi primera materia").
- **Adaptabilidad UI:** Configurar truncado de texto (`...`) para nombres de materias muy largos y ajustar la grilla/mapas de calor de hábitos en mobile.
- **Rachas y Husos Horarios (Hábitos):** Consolidar la lógica UTC/Local para que no se pierdan las rachas por desajustes horarios.
- **Calendario:** Mejorar la visualización cuando hay múltiples eventos que coinciden en la misma fecha/hora.

## Prioridad Baja: Nuevas Características (Features) y Arquitectura
- **Condiciones Avanzadas de Materias:** Soporte granular para cuestionarios, trabajos grupales, entregas parciales y finales.
- **Sistema de Correlativas:** Agregar un mapa visual o lógica para desbloquear materias según los pre-requisitos aprobados.
- **Soporte Offline-First:** Implementar IndexedDB o LocalStorage para usar la app sin conexión y sincronizar al recuperar internet.
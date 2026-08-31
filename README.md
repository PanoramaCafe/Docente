# Panorama Docente — MVP 2026–2027

Aplicación web estática para gestión docente: alumnos/grupos, asistencia, actividades, calificaciones, bitácora de temas, incidencias, dashboard, exportación Excel/PDF y respaldos JSON.

## Uso
1. Abre `index.html` en un navegador moderno o publícalo en GitHub Pages.
2. En Configuración importa un Excel con columnas recomendadas: `Nombre`, `CURP`, `Grupo`.
3. También puedes cargar datos demo desde el menú lateral.

## Notas
- Esta versión MVP guarda los datos en `localStorage` del navegador.
- Excel/PDF usan bibliotecas CDN; requiere conexión a internet para esas funciones.
- No hay todavía autenticación ni sincronización entre dispositivos.
- El diseño de datos deja preparado el siguiente paso: backend centralizado, usuarios/roles, historial de movimientos de grupo, periodos de evaluación y reportes avanzados.

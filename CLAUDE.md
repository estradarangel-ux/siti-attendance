# SITI Asistencia: guía para Claude

SaaS de control de asistencia para México con terminales Hikvision, alineado a la Ley Federal del Trabajo (reforma del DOF 01-05-2026) y a la LFPDPPP 2025. El dueño del proyecto se comunica en **español**: responde, documenta y escribe los mensajes de commit en español. El código y los identificadores van en inglés.

## Estructura
- `docs/`: plan (00), marco legal (01), integración Hikvision (02), trabajo remoto (03). Léelos antes de cambiar reglas de negocio.
- `packages/core`: motor de cálculo LFT (`engine.ts`), topes legales por año (`types.ts` → `lftPolicy`) y adaptador de eventos ISAPI (`hikvision.ts`). TypeScript puro, sin dependencias de runtime.

## Comandos
- `npm install`
- `npm test`: pruebas con `node --test` y TypeScript nativo (Node 22+).
- `npm run typecheck`

## Reglas
- Toda regla legal en el código debe citar su artículo (por ejemplo, `LFT art. 66`) y tener una prueba.
- No inventes endpoints de Hikvision. Marca como `[I]` lo que no esté verificado en la guía oficial.
- Biometría = dato sensible: nunca la registres en logs ni la guardes sin cifrar.
- Las checadas son **append-only**: las correcciones se guardan como registros nuevos con motivo y usuario.
- Nunca guardes secretos (AK/SK de Hikvision, contraseñas de equipos) en el repositorio.
- Trabaja en una rama por tarea y abre un PR. No hagas push directo a `main`.

# Trabajar con Claude desde iPad, celular o navegador (plan Max)

**Respuesta corta: sí, tu plan Max ya lo incluye.** Claude Code on the web (claude.ai/code) está disponible en Pro, Max, Team y Enterprise. No tiene costo aparte: consume los mismos límites de uso que el resto de Claude.

## Dónde se usa
| Dispositivo | Cómo |
|---|---|
| iPhone / iPad | App **Claude** (App Store) → pestaña **Code** |
| Android | App **Claude** (Play Store) → pestaña **Code** |
| Navegador (PC/Mac) | https://claude.ai/code |
| Safari en iPad | claude.ai/code debería funcionar, pero la documentación oficial no lo confirma. En iPad usa la app. |

## Paso a paso (una sola vez)
1. **Conecta GitHub**: en claude.ai/code → conectar GitHub → instala la *Claude GitHub App* (https://github.com/apps/claude) y dale acceso al repo `estradarangel-ux/siti-attendance`.
2. **Revisa el entorno** (*Environment*): Max crea uno llamado **Default** con red *Trusted*. Puedes editarlo para:
   - **Red**: *Trusted* basta para npm/GitHub. Si en el futuro Claude tiene que llamar a la API de Hikvision desde la nube, usa *Custom* y agrega esos dominios.
   - **Network secrets** (Pro/Max): úsalos para credenciales como AppKey/Secret de Hikvision; la sesión nunca ve la clave en claro.
   - **Variables de entorno**: solo para datos que no sean secretos. Cualquiera que use el entorno puede leerlas.
   - **Setup script**: `npm install` (debe terminar en menos de unos 5 min).
3. Ya está. El archivo `CLAUDE.md` de este repo le dice a cada sesión nueva cómo trabajar en el proyecto.

## Uso diario
1. Abre la pestaña Code (app) o claude.ai/code.
2. Elige el repo `siti-attendance` y la rama base (`main` cuando exista).
3. Elige el modo: **Plan** para tareas grandes (Claude propone y tú apruebas), **Auto** o **Accept edits** para tareas acotadas.
4. Escribe la instrucción en español, por ejemplo: *"Agrega el reporte semanal de horas extra en PDF"*.
5. Revisa el diff (indicador `+N -M`). Puedes comentar líneas concretas.
6. Pulsa **Create PR** y luego haz *merge* en GitHub (también funciona desde la app de GitHub en el celular).
7. Opcional: activa **Auto-fix** para que Claude corrija fallas de CI y responda comentarios del PR.

## Extras
- **Retomar una sesión**: aparece en tu lista de sesiones en la app o la web.
- **Pasar una sesión a tu computadora**: `claude --teleport` en la terminal (mismo repo, rama ya subida).
- **Remote Control**: con `claude remote-control` en tu PC puedes controlar esa sesión local desde el celular. La PC debe quedar encendida.

## Límites (Max)
- Hay un límite por ventana de 5 horas y otro semanal, compartidos entre Claude chat y Claude Code. `/status` muestra tu consumo.
- Cada sesión paralela consume límite. Lanza solo las que vayas a revisar.
- Si llegas al tope: espera al reinicio, activa uso adicional o sube a Max 20x.

## Buenas prácticas para este proyecto
- Una tarea = una sesión = un PR. No hagas push directo a `main`.
- Instrucciones concretas, con criterio de "terminado" ("con pruebas", "que el reporte muestre X").
- Nunca pegues contraseñas ni AppSecret en el chat; usa *Network secrets*.

Fuentes: code.claude.com/docs/en/claude-code-on-the-web · /web-quickstart · /cloud-environments · /remote-control · /mobile · support.claude.com/en/articles/11145838

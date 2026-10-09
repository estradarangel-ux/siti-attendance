# SITI Asistencia: plan del proyecto

## Tesis de negocio
- Desde el **1-ene-2027** toda empresa en México debe **registrar electrónicamente la jornada** (art. 132, fr. XXXIV de la LFT). La multa va de 250 a 5,000 UMA.
- La jornada baja cada año hasta llegar a 40 h en 2030. Las reglas de tiempo extra cambiaron en mayo de 2026.
- La mayoría de las PyMEs usa relojes checadores con hojas de Excel, o software genérico que no está al día con la reforma.
- **Propuesta:** "Reloj Hikvision + SITI = cumplimiento LFT listo". Hardware que tú ya distribuyes como partner y suscripción mensual por empleado.

### Diferenciadores
1. Motor de cálculo con la LFT 2026-2030 integrada (topes graduales, dobles y triples, alertas legales).
2. Expediente de defensa en juicio (arts. 784 y 804): registro inmutable, acuses firmados por la persona trabajadora y bitácora de ediciones.
3. Kit LFPDPPP para biometría: consentimiento, aviso de privacidad y alternativa sin biometría.
4. Exportación a nómina (CONTPAQi, NOMIPAQ, Aspel NOI, CSV) y formato listo para la STPS.
5. Instalación hecha por ti (canal Hik-Partner Pro), con monitoreo de equipos desde la nube.

## Arquitectura (versión 1)
```
Terminales Hikvision ──ISAPI LAN──> Agente SITI (por sucursal) ══HTTPS/WSS saliente══> SITI Cloud
                                                                     ├─ API (Node/TypeScript)
                                                                     ├─ PostgreSQL (checadas append-only)
                                                                     ├─ Motor LFT (@siti/core)  ✅ ya existe
                                                                     ├─ Web admin (RR. HH.)
                                                                     └─ Portal / app de la persona trabajadora (acuses, consulta)
```
El detalle técnico está en [02-hikvision-integracion.md](02-hikvision-integracion.md).

## Fases
| Fase | Entregable | Estado |
|---|---|---|
| 0. Fundamentos | Investigación legal y técnica, motor LFT, adaptador de eventos Hikvision | ✅ hecho |
| 1. Piloto técnico | Agente ISAPI conectado a 1 equipo real: lee checadas, da de alta empleados y rostros | Necesita el equipo y la guía ISAPI |
| 2. MVP en la nube | API, base de datos, multiempresa, catálogo de empleados y horarios, reportes semanales, exportación CSV/PDF | |
| 3. Cumplimiento | Bitácora inmutable, acuses firmados, consentimiento biométrico, festivos, vacaciones, exportación STPS | Ajustar cuando la STPS publique sus disposiciones |
| 4. Piloto comercial | 2 o 3 clientes reales, con precio y contrato de encargo | |
| 5. Escala | Servidor ISUP 5.0 (sin agente), integración con Hik-Partner Pro OpenAPI, app móvil | |

## Equipo ("contrataciones")
| Rol | Quién |
|---|---|
| CEO / arquitecto | Claude, en esta sesión |
| Investigación legal | Agente de Claude ✅ (externo: validar con un abogado laboralista) |
| Integración Hikvision | Agente de Claude ✅ |
| Desarrollo backend, agente y web | Agentes de Claude, una sesión y un PR por tarea |
| **Tú (fundador)** | Ventas, relación con Hikvision, equipo de pruebas, decisiones de negocio |
| Externo recomendado | Abogado laboral y de datos personales: revisar el aviso de privacidad, el contrato de encargo y los criterios de horas extra |

## Decisiones del fundador (9-oct-2026)
1. **Mercado:** micro y PyMEs.
2. **Entrega:** SaaS en la nube, operado por el fundador.
3. **Equipos de prueba:** ya los tienes. Falta anotar el modelo y la versión de firmware de cada uno.
4. **Principio rector:** la menor inversión posible.

## Estrategia de inversión mínima
| Rubro | Decisión | Costo estimado [I] |
|---|---|---|
| Hardware en el cliente | **Sin hardware extra.** El agente es un programa ligero (servicio de Windows o Linux) que corre en cualquier PC que el cliente ya tenga. Solo si el cliente no tiene PC encendida, se ofrece una Raspberry Pi opcional. | $0 (Pi opcional: unos USD 60 a 80) |
| Modo "sin agente" | Si el firmware del equipo lo permite, el reloj manda sus checadas directo a la nube (`httpHosts` con HTTPS o dominio). En ese caso las altas de rostros se hacen desde la pantalla del equipo o con la app Hik-Partner Pro. | $0 |
| Nube al arranque | Un solo servicio Node con PostgreSQL administrado en plan gratuito o de entrada (Neon, Supabase, Render o Railway) y el frontend en Cloudflare Pages o Vercel (gratis). | USD 0 a 25 al mes |
| Desarrollo | Claude Code dentro de tu plan Max, sin costo adicional. | $0 extra |
| Licencias Hikvision | Se evitan HikCentral y Hik-Connect for Teams (cobran por puerta). Se usa ISAPI, que es gratis, y la OpenAPI de Hik-Partner Pro, incluida en tu cuenta de partner. | $0 |
| Gastos inevitables | Dominio (~MXN 300 al año) y la revisión de un abogado para el aviso de privacidad y el contrato de encargo. | Variable |
| ISUP 5.0 | Se pospone a la fase 5. Solo vale la pena con muchos clientes. | – |

Equipo sugerido para revender a micro y PyMEs:
- **DS-K1T320** o **DS-K1T343**, con rostro.
- **DS-K1A802AEF-B**, si al cliente le basta con huella.

En ambos casos, solo modelos que soporten ISAPI e ISUP 5.0.

## Siguiente paso: fase 1 (piloto técnico)
1. Anota el modelo y la versión de firmware de tus equipos (menú del equipo, o la app Hik-Partner Pro → Dispositivo → Información).
2. Conecta el equipo a tu red, activa ISAPI/HTTP, sincroniza la hora por NTP y crea un usuario de API que no sea admin.
3. Claude construye `packages/agent`: un agente que lee las checadas con `AcsEvent`, las convierte con `@siti/core` y genera el reporte semanal.
4. Lo pruebas en tu red (el agente corre en tu PC). Claude no puede ver tu red local desde la nube; tú ejecutas el agente.

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

## Decisiones pendientes del fundador
1. **Mercado inicial:** ¿PyMEs de 10 a 200 empleados, corporativos o ambos?
2. **Modelo de entrega:** SaaS en la nube operado por ti (recomendado) o instalación en el servidor de cada cliente.
3. **Equipo de pruebas:** ¿tienes un DS-K1T342/343 o similar para el piloto?
4. **Acceso Hikvision:** registro en TPP y AK/SK de Hik-Partner Pro (ver los pasos en el doc 02).
5. **Marca y precio:** ¿"SITI" es el nombre comercial? Referencia de mercado: MXN 30 a 60 por empleado al mes **[I, por validar]**.

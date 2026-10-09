# Integración con Hikvision

Leyenda: **[C]** confirmado en una fuente · **[I]** inferido o de memoria · **[NV]** no se pudo verificar.
La guía oficial de ISAPI solo se puede descargar con una cuenta de partner en tpp.hikvision.com. **Ese es el primer pendiente.**

## 1. Equipos recomendados
Regla del producto: **solo aceptamos equipos cuyo datasheet diga "ISAPI + ISUP 5.0".**

| Segmento | Modelo | Por qué |
|---|---|---|
| Micro y pequeña empresa (<50 empleados) | DS-K1A802AEF-B (huella y tarjeta) o DS-K1T320 / DS-K1T343MWX (rostro, Value Series) | Precio bajo. El K1A802 guarda 3,000 huellas y 100,000 eventos [C]. |
| **PyME, estándar del producto** | **DS-K1T342MFWX-E1** o DS-K1T343MFWX | Rostro (1,500), tarjeta MIFARE, huella en las variantes MF, PoE y Wi-Fi, ISAPI e ISUP 5.0. Datasheet 2026 [C]. |
| Corporativo o planta | DS-K1T671MF | 6,000 rostros, 50,000 eventos, pantalla de 7" [C]. |

- **Precios [I]:**
  - 342 y 343: USD 150 a 250 (≈ MXN 3,000 a 5,000).
  - 671: USD 350 a 600.
  - K1A802: USD 80 a 150.
- Cotizar en Syscom o TVC.

## 2. Formas de integrarse
| Opción | ¿Abrir puertos? | Alta de empleados y rostros | Esfuerzo | Comentario |
|---|---|---|---|---|
| ISAPI directo desde la nube | Sí (descartado) | Total | Bajo | Expone el equipo a internet. |
| Push `httpHosts` del equipo directo a la nube | No | No, solo recibe eventos | Bajo | El soporte de HTTPS depende del firmware [I]. |
| **Agente local + ISAPI** | No, solo conexiones salientes | Total | Medio | **Recomendado para la versión 1.** |
| **Servidor ISUP 5.0 propio** | No, el equipo se conecta saliente | Total (ISAPI pass-through [I]) | Alto (SDK nativo en C) | Lo mejor a escala. Requiere el SDK de TPP. |
| OpenAPI de Hik-Partner Pro | No | Incierta | Bajo a medio | Eventos vía MQ o webhook [C]. La "asistencia en nube" se retiró en HPP 2.15.500 [C, fuente no oficial]. |
| OpenAPI de HikCentral Connect / Hik-Connect for Teams | No | Sí, y tiene módulo de asistencia | Bajo | Producto aparte, con licencia por puerta. Límite de 5 solicitudes por segundo [C, espejo Syscom]. |
| HikCentral Professional (Artemis) | – | Sí | Medio | On-premise y con licencias. |

### Arquitectura elegida (versión 1)
```
[Terminal Hikvision] --ISAPI (LAN, Digest)--> [Agente SITI en sucursal] ==WSS/HTTPS saliente==> [SITI Cloud]
          \--push httpHosts (LAN)-----------> [Agente]                                          |
                                                                                  API + DB + motor LFT + web/app
```
- **Agente** (mini PC, Raspberry Pi o servicio de Windows):
  - Se registra con un token de un solo uso.
  - Recibe las checadas en tiempo real (`httpHosts`).
  - Cada N minutos hace un **pull de conciliación** con `AcsEvent` (30 registros por página) y elimina duplicados con: serie del equipo + `serialNo` + `time`.
  - Aplica las altas pendientes: UserInfo → FaceDataRecord → CardInfo.
- **Fase 2:** servidor ISUP 5.0 para clientes sin agente. Se puede pilotear en paralelo cuando tengamos el SDK.
- **Atajo comercial:** leer eventos con la OpenAPI de Hik-Partner Pro para los equipos que ya administras ahí.

## 3. ISAPI: endpoints clave
Todos se llaman con `?format=json` y autenticación **Digest**. Si el reloj del equipo se desfasa más de 5 minutos, Digest falla (hay que usar NTP). Después de unos 5 intentos fallidos, el equipo bloquea al usuario 30 minutos [C, comunitario].

| Uso | Método y ruta |
|---|---|
| Información del equipo | `GET /ISAPI/System/deviceInfo` [C] |
| Crear o modificar usuario | `POST /ISAPI/AccessControl/UserInfo/Record` · `PUT .../UserInfo/SetUp` [C] · `Modify`/`Delete` [I] |
| Buscar usuarios | `POST /ISAPI/AccessControl/UserInfo/Search` [C] |
| Rostro | `POST /ISAPI/Intelligent/FDLib/FaceDataRecord`, en multipart. JPEG de 200 KB o menos con un solo rostro [C] |
| Tarjeta | `POST /ISAPI/AccessControl/CardInfo/Record` [C] |
| **Checadas (búsqueda)** | `POST /ISAPI/AccessControl/AcsEvent` con `AcsEventCond{searchID, searchResultPosition, maxResults, major:5, minor:0, startTime, endTime}` [C] |
| Push de eventos | `PUT /ISAPI/Event/notification/httpHosts/1` [C] |
| Arming (flujo continuo) | `GET /ISAPI/Event/notification/alertStream`, con eventos `AccessControllerEvent` [C] |

**Respuesta de AcsEvent:**
```json
{"AcsEvent":{"responseStatusStrg":"MORE","numOfMatches":30,"totalMatches":212,
 "InfoList":[{"major":5,"minor":75,"time":"2026-10-09T08:59:12-06:00",
   "employeeNoString":"1001","attendanceStatus":"checkIn","currentVerifyMode":"face","serialNo":4512}]}}
```
- `attendanceStatus` puede valer: checkIn, checkOut, breakOut, breakIn, overtimeIn, overtimeOut o undefined [C].
- `minor` indica cómo se verificó la persona: 75 = rostro correcto, 38 = tarjeta correcta, 113 = huella correcta [C, comunitario].
- **Advertencias:**
  - El equipo devuelve como máximo unos 30 registros por página.
  - `startTime` y `endTime` son obligatorios.
  - Puede haber huecos en `serialNo`.
  - `currentVerifyMode` y `serialNo` son [I].

## 4. Seguridad y datos biométricos
- Un usuario ISAPI dedicado por equipo, que no sea admin, con una contraseña única guardada cifrada.
- En el equipo: HTTPS activado, Basic desactivado y NTP obligatorio.
- Rostros: se requiere consentimiento antes de registrarlos, se guardan cifrados y se borran del equipo y de la nube cuando la persona se da de baja.
- El `employeeNo` (máximo 32 caracteres) es el ID estable de la persona en todo el sistema.

## 5. Pasos para que obtengas acceso a la API (Hik-Partner Pro)
1. Entra a Hik-Partner Pro con la **cuenta de administrador de la empresa**, no con una subcuenta.
2. Busca **Site & Device → My Service → API Integration**. Esta ruta viene de una fuente no oficial de 2026. Si la opción aparece, genera el **AppKey** y el **SecretKey**.
3. Si no aparece, escribe a soporte de Hikvision México/LATAM o a tu distribuidor (Syscom o TVC). Incluye tu cuenta admin, la razón social y el caso de uso ("SaaS de control de asistencia"). Pide las **AK/SK de la Hik-Partner Pro OpenAPI** y la Developer Guide vigente.
4. Registra la empresa como partner en **https://tpp.hikvision.com** (TPP Register) para descargar:
   - La guía ISAPI de control de acceso.
   - La guía de la OpenAPI de HPP.
   - El **SDK ISUP 5.0**.
   - Pregunta también qué es el "Push SDK" que mencionan los datasheets de 2026.
5. Agrega a tu cuenta los equipos de prueba. Un sitio por cliente.
6. Prueba de humo (la puedo hacer contigo):
   - `POST https://api.hik-partner.com/api/hpcgw/v1/token/get`
   - Toma el `areaDomain` de la respuesta.
   - Con ese dominio, llama `v1/device/list` y luego `v1/mq/subscribe`.
7. Opcional: evalúa Hik-Connect for Teams (Team Management → API Integration) por su API de asistencia.

**Nunca pegues las llaves en el chat.** Guárdalas como *Network secrets* del entorno de Claude o en el gestor de secretos.

## Fuentes
- HPP OpenAPI: https://tpp.hikvision.com/tpp/HPCIntegration
- Hikvision T&A integrate solution (2022): http://www.hikvisioneurope.com/za/portal/portal/02-Technical%20Materials/04-Training%20materials/03-HIK-League%202022/Technical(Thursday)/20220526%20Hikvision%20T&A%20integrate%20solution/20220526%20Hikvision%20T&A%20integrate%20solution.pdf
- Datasheet DS-K1T342MFWX-E1: https://assets.hikvision.com/prd/normal/all/doc/m000111055/DS-K1T342MFWX-E1_Datasheet_20260506.pdf
- Datasheet DS-K1T343MFX: https://assets.hikvision.com/prd/normal/all/doc/m000048811/DS-K1T343MFX_Datasheet_20260507.pdf
- DS-K1A802AEF-B: https://www.hikvision.com/il/products/Access-Control-Products/FingerPrint-Terminals/Pro-Series/ds-k1a802aef-b
- ISAPI, prácticas comunitarias: https://github.com/uchkunr/hikvision-best-practices
- Guía HPP OpenAPI v1.8.1: https://www.scribd.com/document/685174559/Hik-Partner-Pro-OpenAPI-Developer-Guide-V1-8-1-20230609
- Laboratorio HPP OpenAPI: https://github.com/ArmandoBaca/hikpartner-openapi-lab
- HCC OpenAPI (espejo de Syscom): https://hikconnectapi.syscom.mx/
- ISUP: https://enpinfo.hikvision.com/hkwsen/unzip/20230410194813_20373_doc/GUID-486047D9-64D6-4E5E-B816-442AEFEFD8FD.html

# Marco legal (México), corte al 9-oct-2026

> No es asesoría legal. Antes de vender, valídalo con un abogado laboralista y uno de protección de datos.
> Las secciones que no son texto oficial están marcadas como **[secundario]**, **[de memoria]** o **PENDIENTE**.

## 1. Lo esencial: oportunidad de negocio
1. **Reforma de jornada (DOF 01-05-2026, vigente desde el 1-may-2026).** La jornada máxima baja de 48 a 40 h de forma gradual entre 2026 y 2030. Los salarios no pueden bajar (transitorio 7º).
2. **El registro electrónico de jornada es obligatorio.** El art. 132, fr. XXXIV dice: *"Registrar de manera electrónica la jornada laboral de cada persona trabajadora, incluyendo el horario de inicio y finalización; así como proporcionarlo a la autoridad cuando se le requiera."*
   - Las disposiciones de la STPS entran en vigor el **1-ene-2027** (transitorio 5º).
   - Multa por no cumplir: **250 a 5,000 UMA**, unos $29 mil a $587 mil MXN (art. 994, fr. IV Bis).
3. **PENDIENTE:** la STPS aún no publica esas disposiciones. Prensa del 4-oct-2026 dice que las "alista" **[secundario]**. Todavía no se conocen el formato, los campos, la tecnología admitida (biometría, geolocalización), el plazo de conservación ni las excepciones para PyMEs.
   - Por eso el producto se diseña con un modelo de datos flexible y exportaciones configurables.

## 2. Calendario gradual (texto oficial, transitorios 2º y 4º)
| A partir del 1-ene | Jornada ordinaria máx. semanal | Horas extra semanales al doble (art. 66) |
|---|---|---|
| 2026 | 48 | 9 |
| 2027 | 46 | 9 |
| 2028 | 44 | 10 |
| 2029 | 42 | 11 |
| 2030 | 40 | 12 |

Ya implementado en `packages/core` → `lftPolicy(fecha)`.

## 3. Reglas de jornada vigentes (texto verificado de la LFT, última reforma DOF 14-05-2026)
- **Art. 60.** Tipos de jornada:
  - Diurna: de 6 a 20 h.
  - Nocturna: de 20 a 6 h.
  - Mixta: incluye un tramo nocturno de menos de 3.5 h. Con 3.5 h o más se considera nocturna.
- **Art. 61.** Jornada diaria máxima: 8 h la diurna, 7 h la nocturna y 7.5 h la mixta.
- **Art. 63.** Media hora de descanso como mínimo en jornada continua.
- **Art. 64.** Si la persona no puede salir durante el descanso, ese tiempo cuenta como trabajado.
- **Art. 66 (reformado).** Horas extra:
  - Se pagan **100% más** (dobles).
  - Máximo **12 h por semana**, hasta **4 h diarias** y en **máximo 4 días**.
  - El tope gradual del transitorio 4º aplica de 2026 a 2029.
- **Art. 68 (reformado).**
  - El excedente sobre el art. 66 se limita a **4 h por semana** y se paga **200% más** (triples).
  - La jornada ordinaria más la extraordinaria **nunca puede pasar de 12 h diarias**.
- **Art. 69.** Un día de descanso por cada 6 trabajados.
- **Art. 71.** Prima dominical de al menos 25%.
- **Art. 73.** Trabajar en el día de descanso se paga doble, además del salario del día.
- **Arts. 74 y 75.** Días de descanso obligatorio:
  - Fijos: 1-ene, 1-may, 16-sep y 25-dic.
  - Móviles: 1er lunes de febrero, 3er lunes de marzo y 3er lunes de noviembre.
  - 1-oct cada 6 años (cambio de Poder Ejecutivo).
  - Día de jornada electoral.
  - Trabajar en ellos se paga doble, además del salario del día.
- **Arts. 76 a 81, Vacaciones Dignas.**
  - 12 días el primer año, +2 por año hasta llegar a 20; después, +2 cada 5 años.
  - Al menos 12 días continuos.
  - Prima vacacional de al menos 25%.
  - Constancia anual de vacaciones.
- **Art. 784.** El patrón carga con la prueba sobre faltas, jornada, descansos, vacaciones y primas.
- **Arts. 804 y 805.** El patrón debe conservar los controles de asistencia del último año y un año más después de terminada la relación. Si no los presenta en juicio, se presume cierto lo que dice la persona trabajadora.
- **Ley Silla (art. 132, fr. V).** Obliga a dar asiento y descansos periódicos, pero no fija su duración.
- **Teletrabajo, art. 330-E, fr. VI.** Derecho a la desconexión.
- **NOM-035.** Las jornadas excesivas son un factor de riesgo psicosocial **[de memoria]**.

### Puntos de interpretación inciertos (consultar abogado o esperar criterios de la STPS)
1. Cómo se combina el tope de 12 h del art. 66 con el tope gradual del transitorio 4º.
   - El motor usa el tope del año como horas dobles y el excedente como triples, hasta +4 h.
2. Cómo distribuir una jornada semanal de 46 h en 6 días, si el tope diario de 8 h sigue igual.
3. El art. 784, fr. VIII no se armonizó: todavía menciona "nueve horas semanales". Tampoco se verificó el art. 93 de la LISR (exención de horas extra).

## 4. Datos biométricos: LFPDPPP (DOF 20-03-2025)
- La ley no menciona la biometría como dato sensible de forma expresa. Aun así, la postura conservadora es **tratar el rostro y la huella como datos sensibles**.
- **Art. 8.** Exige **consentimiento expreso y por escrito** (firma autógrafa, firma electrónica o algún mecanismo de autenticación).
- **Art. 9, fr. IV.** Exime del consentimiento cuando el tratamiento es necesario para la relación jurídica. No conviene apoyarse en esta excepción, porque existen alternativas sin biometría (PIN o tarjeta).
- **Art. 15.** El aviso de privacidad debe identificar los datos sensibles, las finalidades, los derechos ARCO y cómo revocar el consentimiento.
- **Arts. 18 a 20.** Medidas de seguridad proporcionales a la sensibilidad de los datos y aviso de vulneraciones.
- Roles: el **cliente (empleador) es el responsable**. **Nosotros (el SaaS) somos el encargado**, y necesitamos un contrato de encargo con cada cliente.
- **Sanciones:** hasta 320,000 UMA, que **se pueden duplicar** cuando hay datos sensibles. Las aplica la Secretaría Anticorrupción y Buen Gobierno.

## 5. Obligación legal → función del producto
| Obligación | Función |
|---|---|
| Art. 132, fr. XXXIV: registro electrónico | Entradas y salidas con fecha, hora, dispositivo y método. Bitácora **inmutable** (solo se agregan registros, con hash encadenado). |
| Entregar el registro a la autoridad | Exportación por persona y periodo en PDF, CSV y XLSX, adaptable al formato que defina la STPS. |
| "Prueba plena si fue acordado" | La persona trabajadora acepta con firma electrónica el método de registro y firma un acuse periódico de sus checadas. |
| Arts. 59-61 y transitorio 2º | Jornada máxima por año ✅ y clasificación diurna/nocturna/mixta. |
| Arts. 66 y 68, transitorio 4º | Horas dobles y triples con los topes del año ✅. Alertas por más de 4 h diarias, más de 4 días y más de 12 h totales ✅. |
| Arts. 63 y 64, Ley Silla | Registro de pausas y comida. Si la persona no puede salir, el descanso se computa como trabajado. |
| Arts. 69, 71 y 73 | Día de descanso ✅, prima dominical y pago doble por trabajar en descanso ✅ (los minutos se calculan; el importe lo calcula la nómina). |
| Arts. 74 y 75 | Calendario de días festivos, incluidos los lunes móviles. |
| Arts. 76-81 | Saldo de vacaciones por antigüedad y constancia anual. |
| Arts. 784, 804 y 805 | Conservar registros 1 año + 1 año después de la baja (sugerido: 5 años). Toda edición deja rastro: motivo, usuario y valor original. |
| Art. 330-E, NOM-035 | Alertas por checadas fuera de horario y reporte de jornadas excesivas. |
| LFPDPPP, arts. 8 y 15 | Consentimiento firmado **antes** de registrar la biometría, aviso de privacidad versionado y alternativa sin biometría. |
| LFPDPPP, art. 18 | Rostros cifrados, borrado al dar de baja a la persona y bitácora de accesos. |
| Nómina, CFDI 1.2 e IMSS | Exportar horas dobles y triples por semana e incidencias (faltas, incapacidades, vacaciones) **[de memoria; verificar contra el catálogo del SAT]**. |

## Fuentes
- LFT vigente: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf
- Decreto DOF 01-05-2026: https://dof.gob.mx/nota_detalle.php?codigo=5786537&fecha=01/05/2026
- LFPDPPP vigente: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- IDC, sobre la prueba plena: https://idconline.mx/laboral/2026/07/10/asistencia-digital-requisitos-para-que-sea-prueba-plena
- Pérez-Llorca: https://www.perezllorca.com/es-mx/actualidad/nota-juridica/reforma-laboral-2026-reduccion-de-la-jornada-laboral-decreto-de-reforma-a-la-ley-federal-del-trabajo-dof-1-de-mayo-de-2026/
- Expansión: https://politica.expansion.mx/congreso/2026/04/08/senado-avala-reforma-para-que-haya-registro-electronico-de-las-horas-trabajadas

# ISSD Editor — plan de implementación y continuidad

Última actualización: 2026-10-08. Este documento es el punto de continuidad de la implementación. Mantenerlo actualizado después de verificar cada etapa. No confundir código escrito con funcionalidad validada.

## Objetivo y solicitudes del usuario

Convertir el lector existente en un editor real de International Superstar Soccer Deluxe USA, conservando el lector de ISS USA. Aplicar cambios binarios, autoguardar proyectos y exportar una ROM funcional. Seguir el prompt adjunto completo, sin offsets inventados ni compatibilidad simulada.

Solicitudes adicionales:
- Pelo: miniatura de la cabeza; usar el cuarto tile/columna del atlas de cada estilo, elegido por el usuario.
- Piel: muestra de 20 × 20 px, edición conforme a la paleta real.
- Audio: 16 kHz suena rápido y 8 kHz lento. Investigar pitch del SPC700; no sustituir la investigación por una frecuencia arbitraria.
- Referencia visual ISSDitor V2.0: uniformes tipo 1 y 2, portero, piel, números, foto de equipo y formación. Investigar esas estructuras antes de habilitar escritura.

## Estado actual

### Completado y probado antes de esta ampliación
- [x] Detectar ROM ISS/ISSD USA, LoROM y cabecera SMC de 512 bytes.
- [x] Leer los 36 equipos y 720 jugadores de Deluxe; mantener los 27 equipos / 405 jugadores de ISS.
- [x] Decodificar banderas, rótulos, atributos, piel y pelos de Deluxe.
- [x] Mostrar cabeza desde la cuarta columna del atlas y muestra de piel de 20 × 20 px.
- [x] Catalogar 76 muestras BRR y reproducir/descargar WAV de previsualización.
- [x] Pruebas del lector, compresión, tiles, BRR y ROM locales; build funcional.

### Implementación nueva integrada (pruebas binarias aprobadas)
- [x] `src/rom/graphics.mjs`: codificación planar, compresión Konami con verificación inversa, colores BGR555, catálogo de recursos.
- [x] `src/rom/players.mjs`: nombres de 8 bytes y actualización de campos empaquetados conservando los demás bytes.
- [x] `src/rom/project.mjs`: original inmutable, whitelist de recursos, transacciones, conflictos, undo/redo, checksum, cabecera y proyectos con SHA-256.
- [x] `src/rom/formations.mjs`: lectura de 36 formaciones y copia de registros originales completos con validación.
- [x] `src/rom/project-store.mjs`: almacenamiento IndexedDB por hash.
- [x] `src/components/PixelEditor.vue`: herramientas, selección/movimiento, PNG, cuantización y previsualización. Integrado; probados dibujo, aplicación/restauración e importación PNG; pruebas de arrastre de selección y formas todavía pendientes.
- [x] Corregir y verificar lectura de paleta del portero: su registro contiene 11 colores, no 16; evitar lectura de datos vecinos.

## Fase 1 — auditoría y capa binaria

- [x] Leer el prompt y revisar arquitectura, lectores, modelos y handlers existentes.
- [x] Consultar repositorio local `ISSD-SNES-ROM-Web-Editor` y referencia `issd-native`.
- [ ] Documentar mapa binario final con referencias del desensamblado y longitudes comprobadas contra la ROM.
- [x] Verificar todos los rangos permitidos del registro de recursos, incluidos punteros compartidos.
- [x] Validar cada transacción antes de aplicarla; impedir escrituras fuera de ROM, conflictos, formatos inválidos y tamaños incompatibles.
- [x] Mantener original privado e inmutable; copiar antes de reconstruir; no escribir el archivo original.
- [x] Exportación sin cambios idéntica byte por byte, con y sin cabecera.
- [x] Exportación modificada: tamaño y mapeo originales, checksum/complemento, integridad de recursos intactos.
- [x] Importación de proyectos: verificar hash, versión, duplicados, whitelist y límites de tamaño.

### Estructuras verificadas

Offsets de archivo sin cabecera SMC, Deluxe USA de 2 MiB:
- Nombres: punteros de 16 bits en `0x38138 + equipo*2`, banco SNES `$87`, 20 registros de 8 bytes. Seguir punteros; no asumir una tabla plana.
- Atributos: `0x50000 + equipo*140 + jugador*7`; estadísticas en nibbles, byte 5 + 1 mostrado como dorsal/identificador (permutación de 0–19; intercambiar valores, no duplicarlos), piel nibble alto / pelo bajo del byte 6.
- Banderas: dos punteros por equipo en `0xE730`, banco `$A7`; cada mitad tiene 3 tiles 4bpp (24 × 8); paleta de 4 colores en índices 12–15, puntero `0xE7D8`, banco `$89`, después de cabecera de tamaño de 2 bytes.
- Rótulos: puntero `0xE6C1 + equipo*2`, banco `$9A`; 32 × 8, 2bpp, compresión Konami.
- Uniforme tipo 1: `0x1027A`, tipo 2: `0x102D0`; 16 colores por registro, banco `$89`, cabecera de 2 bytes. No usar `0x102C2` como inicio de tipo 2.
- Portero: `0x10326`; 11 colores, registro de 24 bytes incluyendo cabecera. Se transfieren a índices 1–11 (`DATA_819176`, selector `$30` → CGRAM `$C1`); los índices 12–15 quedan fuera del registro y el índice 0 es transparente.
- Piel alternativa: `0x1037C`, puede ser cero; 5 colores, sustituye índices 2–6. Pelo alternativo: `0x103D2`, puede ser cero; 1 color para índice 1. Registros compartidos entre equipos.
- Pelo: 13 atlas de 768 bytes, desde SNES `$97CD58`; punteros `0xED6D`; 24 tiles 4bpp por atlas. Estilo 0 usa cabeza del sprite estándar.
- Camisetas/detalles: `$98C5D4..$98E5D4`, 8192 bytes 4bpp compartidos.
- Números de camisetas: `$98E5D4..$98F014`, 2624 bytes 4bpp compartidos.
- Balón: `$9A8000..$9A8600`, 1536 bytes 4bpp compartidos.
- Portero, pose Down Strike Left 1: `$8CFB57..$8CFC57` y `$8CFC59..$8CFD59`, 256 bytes por parte. Los 2 bytes anteriores son tamaños de transferencia.
- Formaciones: punteros `0x5EF48 + equipo*2`, banco `$8B`; 31 bytes: etiqueta 0–15, diez pares de profundidad/ancho signed, diez roles (1/2/3/5/6). El portero no tiene slot en este registro.
- Jugador Down/Idle: cabecera `$A9A7C4`, datos después de 2 bytes; segunda parte A9A8C8..A9A9A8 verificada y sprite compuesto con OAM.
- Logo: bloque comprimido `$AA8F56`, descomprime a 3840 bytes de tiles. Falta identificar paleta/tilemap de presentación; distinguir atlas de pantalla compuesta.
- Portada/pintura: `$AA8000`, 5344 bytes descomprimidos; falta completar composición/paleta.
- Retratos de portada: `$A5CB7F`, 14848 bytes descomprimidos; transferencia a VRAM `$4000`, Mode 3. Falta verificar organización de cinco fotos, tilemap y color directo antes de ofrecer edición de fotos individuales.

Fuentes: `issd-native/deps/ISSD-disassembly/.../Routine_Macros_ISSD.asm`, `AsarScripts/AssetPointersAndFiles.asm`, `SPC700/SPC700_Routine_Macros_ISSD.asm`, `ISSDNative/issd_mod_rom.c`, `issd_decompress.c` y DSP del emulador nativo. Referencia descargada en `/private/tmp/issd-native-reference` (temporal; volver a obtenerla si desaparece).

## Fase 2 — equipos y jugadores

- [x] Integrar tabla editable con nombre, dorsal (1–20), posición (1–6), pelo (0–13), piel (0/1) y todas las estadísticas verificadas (1–10).
- [x] Nombres: máximo 8 caracteres en charset del juego; rechazar caracteres no compatibles; no truncar silenciosamente.
- [x] Selector visual de pelos con las 14 miniaturas, conservando cuarta columna.
- [x] Piel: elegir normal/alternativa; color picker modifica el color real de paleta y explica alcance compartido.
- [x] Búsqueda, filtros, ordenamiento y cambios múltiples dentro de una transacción.
- [x] Undo/redo global, restauración individual y marca de cambios.
- [x] Duplicar jugadores/plantillas en slots existentes, conservando las estructuras fijas; distinguir esta operación de agregar equipos.
- [ ] Nombre del equipo: identificar texto si existe; hoy el nombre visible en juego es un rótulo gráfico. Etiquetas estáticas de JS no deben presentarse como edición de ROM.
- [ ] Investigar orden de equipos, referencias a grupos, selecciones y equipos All-Star; habilitar reordenación solamente si todas las referencias quedan consistentes.
- [ ] Agregar/eliminar equipos: BLOQUEADO por cantidad fija en código ejecutable y tablas relacionadas. `issd_mod_rom.c` identifica CPX en `0x004F2E`/`0x004F50`, grupos y 6 equipos All-Star. No ofrecer aumento por solo cambiar una lista JS.

## Fase 3 — Pixel Art Maker y apariencia

- [x] Integrar componente reutilizable con originales y modificados.
- [ ] Verificar lápiz continuo, borrador, cuentagotas, relleno, línea y rectángulo.
- [ ] Verificar selección, arrastre, copiar/pegar, undo/redo, flips, zoom y cuadrícula.
- [ ] Verificar PNG: lectura, recorte, redimensión, transparencia, cuantización, preview y exportación.
- [x] Bandera: lienzo completo 24×16, índices12–15 y copias independientes por equipo, con banco libre verificado.
- [x] Rótulo: edición 2bpp y escritura recomprimida; preservar longitud y bytes vecinos.
- [x] Uniformes tipo 1/2: paletas reales y sprite de vista previa; edición de detalles/camisetas/números compartidos.
- [x] Portero: paleta de 11 colores y partes de sprite verificadas.
- [x] Añadir atlas de pelo y balón.
- [x] Logo: composición completa de pincelada roja, balón Deluxe y texto con sus mapas/OAM y paletas reales.
- [ ] Pantalla principal y cinco fotos: investigar paleta/direct color/tilemaps; no presentar un atlas sin ensamblar como foto completa.
- [x] Formación: tabla `0x5EF48`, banco `$8B`, registro de 31 bytes: etiqueta, 10 pares de coordenadas signed y 10 roles. Lectura y copia de originales; no se ofrecen coordenadas arbitrarias sin validación en juego.
- [ ] Foto de equipo de referencia ISSDitor: localizar gráficos, tipos, mapas y paletas antes de editar.
- [x] Compresión: mantener el bloque dentro de su capacidad original, conservar bytes sobrantes y validar round-trip; rechazar crecimiento sin reubicación segura.
- [x] Advertir claramente recursos/paletas compartidos, listando equipos afectados cuando se pueda calcular.

## Fase 4 — audio

- [x] BRR: decoder y catálogo de 76 muestras, con manejo de 4 recursos transmitidos por fragmentos.
- [x] Identificar cálculo de pitch en SPC700 `CODE_15BD`, tabla de notas `DATA_0300` e interpolación `DATA_1C57`; no hay una frecuencia única para el catálogo.
- [ ] Resolver nota/transposición/pitch por evento y distinguir reproducción transmitida de instrumentos secuenciados.
- [ ] Fórmula del DSP: tasa de consumo de muestras = `32000 * pitch / 4096`. Mostrar pitch/frecuencia de inspección sin afirmar equivalencia al juego si el evento no está resuelto.
- [ ] Corregir reproducción fiel de voces/efectos cuando sus eventos estén verificados; documentar los no resueltos.
- [x] Forma de onda, duración, tamaño, reproducir/detener/repetir, WAV de preview.
- [x] Parser WAV PCM, mezcla estéreo a mono y resampling explícito.
- [x] Encoder BRR con validación de decoding, capacidad fija, final correcto y sin alterar loop points desconocidos.
- [x] Reemplazo WAV solo para muestras no transmitidas y sin loop cuya estructura pueda conservarse; padding seguro y preview de cuantización antes de aplicar.
- [x] Restaurar muestra; exportar bytes realmente reemplazados.
- [ ] Música secuenciada: no ofrecer reemplazo por WAV como editor musical. Emulación SPC700/DSP o editor de secuencias sigue pendiente.

## Fase 5 — persistencia y UI

- [x] Integrar editor Deluxe sin romper lector ISS y reutilizar `RomImage`, lectura y descarga existentes.
- [x] Menú lateral/secciones: resumen, jugadores, apariencia, gráficos, audio, proyecto/exportación.
- [x] Autoguardado IndexedDB por hash SHA-256; original y modificaciones estructuradas; evitar carreras entre guardados/restauraciones.
- [x] Restauración al recargar usando el archivo original que ya guarda el lector.
- [x] Importar/exportar JSON de proyecto editable, incluyendo original y hash.
- [x] Estado de guardado, fecha, errores/cuota, botón de reintento y respaldo descargable.
- [x] Restaurar recurso y todo el proyecto; confirmación de operaciones destructivas y de sobrescritura de proyecto guardado.
- [x] Atajos undo/redo fuera de campos de texto; accesibilidad básica y responsive.
- [x] Indicar dibujos/importaciones todavía sin aplicar a ROM para evitar pérdida silenciosa al navegar.

## Fase 6 — pruebas y entrega

- [x] Añadir `tests/editor.cjs` y ejecutarlo junto a las pruebas actuales.
- [x] Charset/nibbles: editar un campo sin alterar campos vecinos, entradas inválidas y lectura posterior.
- [x] Gráficos: encode/decode tiles 2/4/8bpp, compresión con y sin interleave, casos sintéticos y recursos reales de los 36 equipos.
- [x] Audio: WAV parser, encoder/decoder, cuantización, límites, rechazo loops/fragmentos.
- [x] Proyecto: identidad sin cambios, cabecera SMC no nula, checksum modificado, conflictos, rechazo patches no permitidos, import/export y hash corrupto.
- [x] ROM editada: verificar todos los 36 equipos, recursos intactos y rangos modificados exactos.
- [x] IndexedDB: edición de nombre recuperada al recargar en navegador; separación por SHA-256 probada en modelo. Manejo de errores implementado.
- [ ] Pruebas específicas de cuota, múltiples pestañas y recuperación ante interrupción durante un guardado.
- [x] UI en navegador: nombre editado/restaurado, pelo cambiado/restaurado, atlas editado/aplicado/restaurado, WAV importado/convertido/aplicado/restaurado, PNG exportado/importado idéntico, selector de uniformes.
- [ ] Prueba visual del color picker y cambios múltiples; pruebas de todas las herramientas por arrastre.
- [x] `npm test`, `npm run build`, `git diff --check`.
- [ ] Emulador: no se encontraron Snes9x/bsnes/Mesen/RetroArch/OpenEmu en `/Applications`. Ejecución de ROM modificada NO comprobada; pendiente de un emulador disponible.
- [x] Actualizar README y este plan con estados y límites reales.
- [ ] Entregar resumen de implementaciones, pruebas y pendientes, sin declarar editor completo ni ROM ejecutable cuando falte evidencia.

## Reglas para continuar tras un resumen

1. Leer este documento, `git status` y cambios actuales; no descartar archivos staged del usuario.
2. Continuar integrando y probando el código ya escrito; no reiniciar el lector existente.
3. El proyecto usa Vue 3 + Vite 2, sin nuevas dependencias. ROMs privadas en `roms/`, ignoradas por Git.
4. No incrustar ROM/audio originales en archivos del repositorio. El proyecto descargable del usuario sí incluye su copia local explícitamente.
5. No generar gráficos de reemplazo artificiales: trabajar con pixels/tiles extraídos de la ROM.
6. Actualizar tareas pendientes al superar pruebas; documentar cualquier ingeniería inversa adicional necesaria.

## Evidencia y próximas tareas prioritarias

- `npm test`: lector ISS/ISSD (63 equipos), 76 muestras BRR y suite editor aprobados. 69 muestras permiten reemplazo directo; 7 se rechazan por fragmentos/loops/finales intermedios.
- `npm run build`: aprobado. `git diff --check`: aprobado en archivos versionados.
- Exportación desde botón real del navegador: `/Users/estebanfuentealba/Downloads/ISSD-editado.sfc` comparada con original mediante `cmp`, idéntica; SHA-256 `d2fe66c1ce66c65ce14e478c94be2e616f9e2cad374b5783a6a64d3c1a99cfa9`.
- Pruebas de UI restauradas: el proyecto abierto vuelve a 0 modificaciones; no dejar los cambios artificiales de prueba.
- La prueba de descarga con `waitForEvent('download')` no devolvió el evento en el navegador integrado, pero el archivo sí llegó a Downloads y se verificó directamente. No repetir esperas largas por este evento.
- `src/components/StudioEditor.vue` contiene la integración actual. El lector `Home.vue` conserva ISS y usa el nuevo editor para Deluxe.
- Siguiente investigación: pitch de voces por evento, fotos de portada/equipo, otras poses de detalles de camiseta y composición fiel de formaciones. Priorizar recursos que puedan verificarse sin tocar código ejecutable.
- No declarar el prompt entero completado: falta investigación y validación en emulador.

### Actualización de formación e identificadores
- Se verificaron los registros de formación de los 36 equipos contra `issd_mod_rom.c`, `issd_formation.h/c` y `DATA_8BEF48` del desensamblado. La sección Equipos permite elegir/copy una formación original; se escriben los 31 bytes completos y se muestra esquema de posiciones/roles.
- El byte 5 de jugador es un identificador único de slot, mostrado como dorsal por el lector. El código nativo evita cambiarlo aisladamente. La edición ahora intercambia dos valores para conservar la permutación de 20 IDs y la restauración hace el intercambio inverso. Falta validar su efecto visual y referencias en emulador; no permitir duplicados.
- Pruebas añadidas de formación y restauración de identificadores; suites y build aprobados tras estos cambios.

### Ampliación Pixel Art Maker — 8 octubre, en curso

- [x] Bandera 24×16 en un solo lienzo. Cada país recibe dos slots propios al guardar.
- [x] Reubicación verificada: FREE_BYTES $AFBD1E, 17122 bytes documentados; se reservan 8568 (84×102), incluyendo los 6 equipos ocultos. Se actualizan los cuatro bancos A7→AF de ambos cargadores DATA_82F7A4 (menú) y DATA_81E715 (partido), y los 84 punteros DATA_81E730; se conserva el tamaño ROM. Todas las paletas de bandera tienen punteros distintos.
- [x] Pruebas: editar los 36 países sin cambiar banderas pendientes, restaurar todos vuelve a bytes originales, serializar/importar y reabrir ROM exportada. Validador rechaza bancos/punteros inválidos.
- [x] Portero frontal y jugador completos: OAM real con posición, tamaño, prioridad y volteos. Jugador DATA_988472 sprite acumulado112 (WRAM40E0), tiles A9A7C6(256)/A9A8C8(224). Portero DATA_988846 acumulado39 (WRAM4958), tiles90CCF2(224)/90CDD4(192). Lienzos24×48.
- [x] UI bandera: Italy volteada y aplicada sin warning; France sin modificar; restauración a 0 recursos.
- [x] Nombre coordinado pequeño y rojo: `team-labels.mjs` integrado; COD_BigTeamAndStadiumNames98A526753bytes/1689decodificados/42frames411sprites; fuente9DE13C, paleta89E362. Conserva cantidad de sprites, nombres A–Z/espacios, límite por slot y por capacidad comprimida. Campo con preview de ambos recursos; dibujo libre sigue afectando solo el pequeño. Restauración individual conserva nombres grandes de otros equipos.
- [x] Pruebas de nombre coordinado, otros35frames intactos, fuente compartida intacta, entradas inválidas y restauración a identidad. UI muestra CHILE en ambos previews; pruebas sin aplicar y descartadas.
- [x] Investigación logo completo: BG gráficos AA8000(5344decoded), dos mapas AA8D0C/AA8E61(2048cada), textoAA8F56(3840decoded), OAM directo88ED58(31sprites; registros y,x,tile,attr), posición($60,$40) por81F5FF. Paletas:89C292(red),89C2B4(ball),89C318(text,E0). Imagen de investigación `/private/tmp/logo.png` coincide con GIF del usuario. `titleLogo` añadido como composición256×128, 48índices globales, escritura a las dos fuentes4bpp y cuantización por capa. Fondo repetido sin tiles propios bloqueado para edición.
- [x] Detalle de camiseta: DATA_81CE8A0xCE8A elige patrón por equipo, CODE84E7EF coloca tile23, OAM del jugador lo pone sobre pecho. Se muestra sobre cuerpo completo, editables solo8×8del detalle. Tiles/otras poses continúan compartidos. No confundir con paleta alternativa.
- [x] Suite ampliada: sprites/detalles/ambas fuentes de logo editados y restaurados; no-op conserva bytes comprimidos; capacidad usa ROM original aun después de recomprimir; proyectos antiguos de atlas siguen importables y ediciones parciales se integran sin patches superpuestos. `npm test`, build y diff-check aprobados.
- [x] Revisar logo y detalles en navegador y guardar screenshot de evidencia. Navegador original tab1 falló; tab2 nuevo a localhost3002 funciona, `pixelTab` en CUA. Tras prueba de sprite, ROM volvió a0recursos. Rechazo auto-review al aceptar warning compartido; no repetir aceptación; probar modelo en memoria, leer previews/restaurar sin aceptar warnings.
- [ ] Emulador: reubicación de banco de banderas y composición/logo todavía sin ejecución del juego; informar límite real.

Continuidad técnica: `graphicPatches(original,current,resource,matrix)` devuelve múltiples patches; recursos `kind=flag/sprite/composite`. Sprite utiliza `editableParts` y máscara. Proyecto registra partes y espacios de flags, valida transacciones atómicas. PixelEditor respeta máscara en lápiz/fill/flip/import, contexto visible fuera de zona editable.

Evidencia final: `issd-logo-editor-preview.png` y `issd-shirt-editor-preview.png`. Zoom inicial ajustado al ancho, logo completo256×128 cabe en el lienzo. Detalle frontal8×8 resaltado sobre jugador24×48. Pruebas finalizadas con0recursos guardados.

Límites adicionales: los nombres grandes comparten un bloque comprimido753bytes. Ciertos conjuntos de cambios pueden caber al aplicarlos y exceder esa capacidad al restaurar un solo frame; se rechaza la restauración parcial sin escribir y sigue disponible restaurar el proyecto completo. No ampliar ese bloque sin verificar todos sus cargadores/memoria. Los tiles repetidos del logo siguen reutilizados; escribir colores contradictorios en sus copias se rechaza. No se altera el tilemap para permitir dibujos arbitrarios sobre fondos repetidos.

### Audio — previsualización al seleccionar
- [x] Seleccionar una muestra BRR prepara su WAV/onda y comienza la reproducción automáticamente; el botón Previsualizar ROM también reproduce.
- [x] Se pausa la muestra anterior al cambiar. Se ignoran callbacks de previews reemplazados y errores AbortError al cambiar rápidamente. La importación WAV mantiene su previsualización manual.
- [x] Verificación en navegador: elegir UnknownShout sin pulsar Previsualizar produjo `paused=false`, `currentTime>0` y onda visible; `npm run build` y `git diff --check` aprobados.


### Rótulos, aplicación e importación de banderas — 8 octubre
- [x] `RomImage` observa cambios internos de matriz/paleta: Edición se actualiza durante el dibujo. Los errores al aplicar aparecen junto al lienzo.
- [x] Rótulos pequeños independientes: 42 slots de 69 bytes en FREE_BYTES $AFDF00, tabla DATA_81E6C1 (84 bytes), bancos de DATA_81E6B4 (13 bytes), usados por CODE_A49130. Cualquier raster 32×8/2bpp cabe. Reubicación sin expandir ROM, validadores y restauración exacta.
- [x] Texto pequeño: letras compactas extraídas de los rótulos originales, con sus píxeles grises y ancho variable; no reducir el nombre rojo 8×16. Q/V se adaptan desde O/U porque no existen en los nombres originales. CHILE se ve completo en preview y en Edición.
- [x] Compatibilidad de proyectos de banderas antiguos de 72 slots: migración validada a 84 slots y segundo cargador para preservar equipos ocultos y banderas durante partidos.
- [x] Botón «Subir imagen y convertir a pixel art» para banderas, con PNG/JPG/WebP/GIF/BMP, recorte, reducción a24×16 y cuantización a la paleta actual. Vista previa antes de usar resultado; dibujo sigue pendiente hasta Aplicar gráfico a la ROM. Cambiar colores de paleta sigue siendo una operación aparte.
- [x] Navegador: importación de imagen local, conversión y aplicación sin warning compartido; estado Sin cambios de dibujo. Aplicación de nombre CHILE, volteo del raster32×8, aplicar y Exportar ROM: descarga real ISSD-editado (4).sfc verificada con matriz idéntica a la editada. Cambios de prueba deshechos:0recursos.
- [x] Evidencia: `issd-flag-import-preview.png`, `issd-small-label-preview.png`. Suites amplían cobertura de42banderas, migración antigua, raster complejo,42rótulos preservados, importación/reapertura/restauración.
- [ ] Validar ambos cargadores reubicados en emulador; verificación actual es binaria y de UI, sin afirmar ejecución del juego.


### Paleta automática de bandera — 8 octubre
- [x] Importación propone paleta RGB555 de cuatro colores extraídos de la imagen mediante histograma ponderado y agrupación de colores. Se ignoran píxeles transparentes. Checkbox permite conservar la paleta actual.
- [x] Previsualización, lienzo, exportación PNG e historial de dibujo incluyen los colores pendientes. Aplicar guarda raster y cuatro colores en una sola transacción. Restaurar bandera recupera ambos. Cambios únicamente de paleta cuentan como pendientes/modificados.
- [x] `flagPalettePatches` escribe los cuatro colores referenciados por DATA_81E7D8 y rechaza paletas compartidas con cualquier otro de los42slots. Pruebas verifican los35otros países, persistencia/exportación/restauración y cuantización.
- [x] Imagen del usuario `Proyecto nuevo (1).png` (24×16) aplicada al slot Italy con blanco, azul, rojo y dorado. Guardado local contiene8patches (pool/punteros/cargadores y4colores), sin previsualización pendiente. Este cambio es solicitado por el usuario: conservarlo, no deshacerlo como prueba.
- [x] UI: deshacer/rehacer dibujo restaura conjuntamente imagen y paleta. Evidencia `issd-italy-custom-palette.png`. Mantener límite4colores e indicar que imágenes con más tonos son reducidas.


### Argentina: rótulo alineado y límite real — 9 octubre
- [x] Sprites16×16 del nombre grande usan coordenadas centradas: restar4a x/y para situar su esquina. Argentina mezcla dos sprites con AR/GE (tiles224/202,attr26) con cinco letras de dos sprites8×8. Resultado9letras con12sprites, no6letras.
- [x] `bigLabel.maxLetters` cuenta letras empaquetadas e individuales; UI conserva capacidad de la ROM original al cambiar a un nombre más corto. Renderer valida los bordes y muestra ARGENTINA completo/alineado.
- [x] Escritura reutiliza parejas de letras verificadas en la fuente nativa. Selección mediante programación dinámica cuando hacen falta sprites16×16; si la combinación necesita más sprites que el slot o excede753bytes, se rechaza antes de escribir. No prometer9letras arbitrarias sin esa validación ni expandir memoria.
- [x] Se conservan coordenadas/kerning existentes cuando la agrupación nativa admite el nuevo nombre. Espacios compactos junto a I pueden suprimirse para caber en32px; ARGENTINA cabe sin perder letras.
- [x] Pruebas: Argentina9caracteres, alineación de los sprites AR/GE, cambiar a ARGENTINO, exportación/importación, otros35nombres intactos y restauración binariamente idéntica. UI muestra Hasta9 y ambos previews; prueba descartada sin aplicar. Evidencia `issd-argentina-label-preview.png`.
- [ ] La selección de banderas en emulador quedó pendiente tras interrupción del usuario: `roms/ISSD-corregido.sfc` arrancó en OpenEmu, pero no se confirmó la pantalla de equipos. No declarar esa validación completada.

### N. Ireland / Czech Rep.: referencia, banco y puntuación — 9 octubre
- [x] Ambos campos admiten 10 caracteres contando puntos y espacios; el límite se conserva al reabrir la ROM.
- [x] Czech Rep. corresponde al frame28, no37 (All American Star). El original incluye THE CZECH REP. Frame28: seis sprites, primero THE (tile234,attr26), cinco fragmentos del banco1 (217/219/221/223/239,attrs27/11).
- [x] Renderer carga 9BA400 en tiles464–495 (VRAM7D00), además de fuente9DE13C tiles128–255 (VRAM6800). Respeta bit0 del atributo OAM y centro de sprites16×16.
- [x] Reconocer N. IRELAND con punto nativo186 y espacio por posición; punto usa un sprite, espacio no necesita sprite; compactos de32×8 admiten puntuación y reducen separaciones solo cuando falta ancho.
- [x] Renombrar Czech a CZECH REP. conserva fragmentos nativos y reemplaza THE por un sprite duplicado en idéntica posición a otro existente (tile217). Resultado visual sin THE; mantiene seis sprites y cabe en750/753bytes. No modifica fuente compartida ni los otros41frames.
- [x] Pruebas de los dos nombres completos, N.IRELAND sin espacio, exportación/reapertura, recuperación de proyecto, restauración exacta, límites y otros35equipos intactos. Comparación directa de los píxeles CZECH contra el banco nativo.
- [x] UI comprobada para ambos equipos: límite10 y previews pequeños/rojos. Evidencias issd-czech-label-preview.png e issd-n-ireland-label-preview.png. Previews descartados; proyecto del usuario conserva12recursos modificados.
- Restricción vigente: diez caracteres es el máximo del campo; otras combinaciones siguen limitadas por sprites/font originales, ancho32px y bloque753bytes. Los errores de capacidad impiden aplicar/exportar cambios inválidos.

### Dos textos independientes y equipos de estrellas — 9 octubre
- [x] Dos inputs: nombre rojo/amarillo y nombre pequeño. Se llenan con el nombre actual y regeneran su propia imagen al escribir, sin botón previo. Preview separado del guardado; aplicar/descartar conserva atomicidad y bloqueo de exportación pendiente.
- [x] Czech: original rojo THE CZECH REP., pequeño CZECH. El raster pequeño comprobado en ROM es 32×8, no38×8. El campo rojo admite14caracteres para incluir THE y puntuación. Se puede quitar/agregar THE y el punto conservando los fragmentos condensados originales.
- [x] Punto de Czech: parche comprimido9BA400 restringido a píxeles120–122/11–13; validador impide cambiar el resto de la fuente. All American Stars permanece idéntico. Restauración de ambos textos incluye la puntuación.
- [x] APIs separadas bigTeamNamePatches / smallTeamNamePatches. teamNameTexts conserva defaults nativos y reconoce compactos generados; dibujo libre no reconocido deja campo vacío y conserva imagen hasta edición explícita.
- [x] Listar42equipos/840jugadores. Orden nativo36All Stars,37Euro Stars A,38Euro Stars B,39Asian Stars,40African Stars,41All American Stars. Frames grandes35/38/41/39/40/37 respectivamente.
- [x] Plantillas de estrellas: CODE_A49C89 usa tablaA4F643 y registros de4bytes (equipo de origen×2, offset de jugador×8). Seguir las referencias para nombres, conservar atributos propios en8A8000+team×140. UI avisa que editar un nombre afecta a la selección de origen.
- [x] Ampliar lectores/validadores/registros de formación, atributos, paletas y gráficos a42equipos. Banderas/rótulos reubicados ya tenían42slots. No solicitar cambios de paleta compartida cuando los colores siguen iguales.
- [x] Pruebas: los42equipos se leen sin caracteres corruptos; nombres independientes, reapertura, dot sin afectar título americano, restauración exacta; atributos y banderas/rótulos individuales de los seis equipos ocultos.
- [x] UI comprobada: THE CZECH REP / CHILE actualizados al escribir, African Stars con20jugadores. Evidencia issd-independent-names-preview.png. Previews descartados; cambios anteriores del usuario conservados.
- Restricción: nuevas combinaciones de nombre rojo aún deben caber en sprites y753bytes. La visualización se actualiza también para combinaciones que no caben, mostrando error y deshabilitando aplicación.

### Conversión automática y recorte de audio — 9 octubre
- [x] parseWav acepta PCM8/16/24/32, float32/64, 1–8canales y WAVE_FORMAT_EXTENSIBLE PCM/float. Mezcla y satura a mono Int16, trata NaN/Infinity como silencio.
- [x] decodeUploadedAudio usa parser local y fallback OfflineAudioContext.decodeAudioData para formatos soportados por el navegador (MP3/M4A/OGG/FLAC o WAV comprimido). Conversión local sin servidor; máximo50MB/10millones de muestras.
- [x] AudioTrim.vue: upload o drop, onda, selección arrastrable, controles de extremos por puntero/teclado, tiempos numéricos, zoom y desplazamiento, ajuste a duración máxima según BRR/pitch, porcentaje de capacidad, escuchar/descartar.
- [x] Recorte inicial automático que cabe en el slot. trimAudio selecciona muestras por tiempo; remuestreo a frecuencia del DSP y codificación BRR con padding seguro. Al cambiar pitch conserva el fragmento si cabe, o limita su duración.
- [x] Importación con versión para descartar decodificaciones antiguas al cambiar de ROM/muestra/sección. Exportación bloquea source/draft pendiente. Previsualizar ROM conserva el recorte y etiqueta qué audio se está escuchando.
- [x] Mantener restricciones existentes para música transmitida y loops SPC700 no verificados; estos slots no permiten reemplazo.
- [x] UI probada con WAV estéreo float32 de2segundos y MP3: ambos convierten a PCM16mono. Arrastre final1.385→1.010s; mover bloque; recortar0.273–0.598s; zoom y23% de capacidad. Aplicar/restaurar regresó de13a12recursos del proyecto del usuario. MP3 de prueba descartado al concluir.
- Evidencia: issd-audio-trim-preview.png. Tests ampliados a PCM24/32, float32/64, extensible, saturación, límites temporales y exportación/importación/restauración de audio convertido y ajustado.

- [x] Cinco fotos de portada: tiles 8bpp A5CB7F, mapas por filas 81F61C/81F66E/81F6B1/81F6FF/81F740, paleta 89C3FA con 144 colores en CGRAM $20. Recursos individuales de izquierda a derecha debajo del logo, dibujo/importación y restauración individual conservando las demás fotos. Recompresión limitada al bloque original; no cambia mapas ni código.

### TitleScreenNameDrop: permitir subir audio — 9 octubre
- [x] Eliminar el bloqueo específico del banco BRR de portada conservando todos los bits END/LOOP por bloque y sus 22806 bytes. Los otros bancos sin protocolo verificado siguen restringidos.
- [x] Referencia nativa: CODE_80C115 carga el banco en SPC $A66B; directorio con inicios en bloques 0/200/897/2000 y bucle en 103. No modificar palabra de longitud, directorio ni código de reproducción.
- [x] Validación segmented-audio: rechazar marcas alteradas respecto a ROM original; decodificar preview completa atravesando finales intermedios. UI explica los cuatro fragmentos y el bucle inicial.
- [x] Tests de reemplazo con audio sintético, marcas exactas, rechazo de END alterado, regiones vecinas intactas, exportación/importación y restauración exacta. npm test/build correctos.
- [x] UI: seleccionar TitleScreenNameDrop, subir WAV float estéreo, convertir/recortar, aplicar (13 recursos), restaurar (12 recursos previos). Evidencia issd-title-audio-upload-preview.png.
- Limitación: el preview reproduce el banco completo seguido; el juego activa sus fragmentos con eventos originales. No se cambian esos eventos ni su pitch. La reproducción del reemplazo en el juego no se verificó en emulador.

### Grupos y composición de gráficos — 9 octubre
- [x] Mostrar/ocultar ALL STARS en Configuración: modifica ambos conteos de páginas en 85A566, incluida la rama del desbloqueo. Modo original restaura los operandos de la ROM base.
- [x] Siete títulos existentes en Gráficos con input de texto y preview al escribir. Letras A–Z, números, espacio, punto y guion; máximo 15 caracteres, ajustados al ancho gráfico. Guardado/restauración y recuperación del proyecto.
- [x] Títulos independientes: atlas de 1792 bytes decodificados en AEEA00 (capacidad 1850), loader 828EEE y renderer de selección AEF200 (128 bytes), hook JSL 85AD3A. Cada título usa 16 tiles; las otras fuentes del menú quedan originales. Metadatos de nombres en AEE900, 116 bytes. Validación de código exacto, resolución, capacidad y espacio libre.
- [x] Prueba del renderer con A/X/Y de 16 bits, direct page de sprite no cero, siete índices, dos filas BG3, contrato de la cola DMA 808E37 y bit de inhibición 1406. ROM de prueba arranca en EmulatorJS. La pantalla de selección con el renderer nuevo todavía no se comprobó visualmente dentro del juego.
- [x] Jugador completo: incluir segunda fila DMA; sprites 16×16 usan centro menos 4 px; overlays transparentes conservan el propietario opaco inferior. Preview comprobado: 32×48, pierna/zapato alineados y sin píxel flotante sobre hombro.
- [x] Fondo rojo de portada como recurso separado. Borrar el logo completo borra todas sus capas subyacentes; no deja la pincelada roja. Pruebas de composición con textos inferiores y espacios de grupos/portada independientes.
- [x] Menú Grupos: CRUD de hasta 16 grupos, nombres y asignación de los 42 slots existentes, equipos repetidos entre grupos, grupos vacíos y restauración. Guardado, historial e importación/exportación atómicos.
- [x] Selector nativo con páginas de hasta seis equipos, incluidas páginas incompletas: un grupo de ocho ocupa dos páginas con el mismo título. Datos en AEF300 (1024 bytes), rutinas/ceros DMA en AEF700 (768 bytes), tablas de equipos/conteos/títulos en AEFA00 (1536 bytes). Atlas dinámico de hasta 16 títulos, sujeto a su capacidad comprimida de 1850 bytes.
- [x] Rutinas de navegación, búsqueda con fallback para equipos ausentes, selección, roster, paletas y cargas de banderas/rótulos adaptadas a cada página. Precarga de las 42 banderas independientes. Los slots ausentes se limpian mediante la cola DMA; ningún recurso WRAM se borra.
- [x] Pruebas de ejecución 65816 con A/X/Y de 16 bits y DP no cero, páginas de 4/6/2/6 equipos, controles, paletas, DMA de banderas/nombres, 16 títulos, validación, historial y checksum. Migración estricta de versiones de desarrollo reconocidas, preservando los otros recursos guardados.
- [ ] Pendiente: ampliar a 48 selecciones nacionales distintas. Los grupos ya se pueden crear/eliminar y admitir cuatro u ocho equipos, pero no se han creado slots nacionales adicionales.
- Referencias para continuar: selección DATA81DA3F (42 índices duplicados), conteos 85A566, base de grupo 85AE79/85AF6F y búsqueda 85AF84, controles 85AE19/85AE50/85AE5F/85AE6B; copias de banderas 85AED7 y nombres 85AF2F, paletas 85AE84. Agregar equipos requiere también roster 80CF2A/878138, atributos 8A8000, formaciones 8BEF48, nombres grandes 98A526, precarga de banderas 82FB5D y rótulos 828F21. No presentar un editor de metadatos como una ampliación funcional del juego.

### Corrección de paletas al alternar grupos — 9 octubre
- [x] La cabecera del script de paletas ($2A, ejecutado por 80A91E/80A976) conservaba seis entradas mientras el bucle emitía cuatro o dos. El intérprete consumía el terminador y RAM residual como descriptores adicionales, alterando paletas ajenas a las banderas.
- [x] Hook 85AE91 (6 bytes): generar el conteo real a partir de $1E y emitir la cabecera correspondiente. La lista y su terminador quedan sincronizados.
- [x] Migrar exclusivamente los conjuntos de instrucciones anteriores reconocidos, conservando grupos, equipos y demás modificaciones del proyecto.
- [x] Regresión con dos grupos de cuatro y 40 alternancias: paletas de banderas correctas, paletas de fondo/UI intactas, terminador consumido en el límite exacto. La prueba rechaza la cabecera antigua de seis entradas.

### Menú principal — 2026-10-09

- [x] Sección dedicada con las ocho opciones, dos líneas y previsualización de BG1/BG2/OAM.
- [x] Edición de textos con las letras grandes nativas disponibles, límite de ancho y conteos originales por frame; se mantienen las funciones de juego.
- [x] Restauración independiente de opciones, dibujo/importación de atlas compartido, panel y fondo azul.
- [x] Relocalización de `COD_TopmostMainMenuText` ($989FB8) a $AEE500..$AEE8FF y puntero $828EA0; sin alterar referencias WRAM DATA_82F3AA ni reservar espacio de otros editores.
- [x] Pruebas binarias, suite completa, build y flujo en Chrome: preview, aplicación, opciones independientes, undo/redo, validación, restauración y herramientas gráficas.
- Límite actual: la fuente grande nativa no incluye todo el alfabeto. El editor indica ACDEGIKLMNOPRSTWY, espacios y guiones; no genera glifos ausentes.

### Ampliación del alfabeto del menú principal — 2026-10-09

- [x] A–Z completas; los tiles nativos se mantienen y se agregan B/F/H/J/Q/U/V/X/Z e I en un solo sprite, con paleta amarilla/roja original.
- [x] «INICIAR / JUEGO» cabe en la primera opción y conserva sus textos tras exportar/importar y recargar.
- [x] Fuente de 144 tiles, pool FREE_BYTES $A4E17F..$A4EBFF y puntero de DMA $828E58. Sin superponer editores de inicio, grupos o banderas.
- [x] 32 slots por opción en WRAM; DATA_82F3AA conserva orden por columnas y avanza 64 bytes por frame, conforme al cargador nativo (conteo dentro del primer registro).
- [x] Padding Y=127 fuera del rango admitido por el dibujante, evitando llenar los 128 OBJ con sprites invisibles; se valida el máximo global de sprites visibles.
- [x] Los proyectos anteriores de 89 sprites siguen admitidos. Restaurar una opción preserva las otras; restaurar todo recupera la ROM original.
- La restricción del alfabeto anotada en la etapa anterior queda resuelta. Se mantiene el ancho de 112 píxeles por línea.

### Ancho visible de rótulos — 2026-10-09

- [x] El ajuste usa los límites de píxeles opacos de la fuente actual, incluidos los fragmentos W/Y, en lugar de contar el avance/espacio posterior a la última letra.
- [x] «INTER- / NACIONAL» ocupa 112 píxeles visibles y se admite sin escalar glifos. Los ocho textos originales también se pueden volver a generar.
- [x] Pruebas de límites de panel, aplicación, undo/redo e importación/exportación para NACIONAL; build y verificación de interfaz con recarga.

### Imágenes ensambladas del menú — 2026-10-09

- [x] Panel compartido de 128 × 48, con marco, balón y SOCCER; se edita su atlas propio y el marco global se muestra como contexto protegido.
- [x] Fondo azul ensamblado de 256 × 224 según el tilemap BG2 original, con logos y siluetas.
- [x] El mapeo de píxeles respeta tiles reutilizados y flips. El dibujo se convierte al atlas comprimido original sin cambiar mapas ni recursos vecinos.
- [x] Pruebas de round-trip sin cambios, propagación de píxeles compartidos, protección del marco, aislamiento, restauración, importación/exportación y build.

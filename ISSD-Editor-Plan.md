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

# Motor Financiero — Fórmulas exactas extraídas de `MF_Documento_Base.xlsx`

Este documento cumple el paso 1 de la sección 9 de la especificación: documentar, celda por
celda, las fórmulas reales del Excel de Nexo Inmobiliario antes de portar cualquier lógica a
TypeScript. Se leyó el archivo con `openpyxl` en dos pasadas (fórmulas + valores cacheados) sobre
las 7 hojas indicadas en la sección 2 de la especificación:

`POT`, `Edificabilidad`, `Modelo de Desarrollo "Q"`, `Costos Conceptual`, `Ventas Conceptual`,
`Est Enganches + Lista precios`, `FCF Base 26.01.27 ` (la hoja tiene un espacio final en su
nombre real).

El proyecto de ejemplo cacheado en el Excel es **"ZONA 14 RESIDENCIAL"** — todas las fórmulas se
ilustran con sus valores reales de esa corrida, que también sirven como caso de prueba de
paridad (ver sección 8 de este documento).

> Convención de notación: `Hoja!CELDA` es la referencia real de Excel. Cuando una fórmula se
> repite igual en un rango (p. ej. copiada a lo largo de 40 columnas de meses), se muestra una
> sola vez con la celda ancla y se indica el rango cubierto.

---

## 1. Hoja `POT` — parámetros de zonificación

Es una tabla de referencia **estática** (sin fórmulas de cálculo, solo un par de celdas que
copian valores dentro del mismo bloque). Contiene 6 bloques idénticos en estructura, uno por
zona (`G5` en A1, `G4` en A30, `G3` en A59, `G2` en A89, `G1` en A118, `G0` en A147), cada uno de
~29 filas con: fraccionamiento (frente de predio, superficie efectiva), índice de edificabilidad
(base/ampliado), altura (base/ampliada), % de permeabilidad, separación a colindancias, y uso del
suelo (incluyendo `% Residencial` para uso `Mixto`).

Extracto completo de los valores usados por el motor de edificabilidad (celdas fuente exactas):

| Zona | Nombre | Índice base (`D`/`F`→`E`/`G`) | Índice ampliado | Altura base (m) | Altura ampliada (m) | % Permeabilidad | % Residencial (Mixto) |
|---|---|---|---|---|---|---|---|
| G5 | Núcleo | `POT!D9:E9` = 0–**6** | `POT!D10:E10` = 6–**9** | `POT!D11:E11` = 0–**64** | `POT!D12:E12` = 64–**96** | `POT!D13` = 0 | `POT!D24` = **0.25** |
| G4 | Central | `POT!D38:E38` = 0–**4** | `POT!D39:E39` = 4–**6** | `POT!D40:E40` = 0–**32** | `POT!D41:E41` = 32–**48** | `POT!D42` = 0 | `POT!D53` = **0.35** |
| G3 | Urbana | `POT!D68:E68` = 0–**2.7** | `POT!D69:E69` = 2.7–**4** | `POT!D70:E70` = 0–**16** | `POT!D71:E71` = 16–**24** | `POT!D72` = **0.1** | `POT!D83` = **0.5** |
| G2 | Semiurbana | `POT!D97:E97` = 0–**1.8** | `POT!D98:E98` = 1.8–**2.7** | `POT!D99:E99` = 0–**16** | `POT!D100:E100` (`=E99`)–**24** | `POT!D101` = **0.4** | `POT!D112` = **0.75** |
| G1 | Rural | `POT!D126:E126` = 0–**1.2** | `POT!D127:E127` = 1.2–**1.8** | `POT!D128:E128` = 0–**16** | `POT!D129:E129` (`=E128`)–**24** | `POT!D130` = **0.7** | `POT!D141` = **0.75** |
| G0 | Natural | `POT!F155:G155` = 0–**0.8** (sin "ampliado" separado) | — | `POT!F157:G157` = 0–**24** | — | `POT!F159` = **0.8** | *(no definido — hoja vacía en G0)* |

**Corrección importante respecto a la sección 5 de la especificación:** el documento de referencia
marcaba G5 y G0 como "—" (sin datos). El Excel real **sí tiene valores para G5** (índice
0–6/6–9, altura 0–64/64–96 m) y **G0 solo tiene índice base** (0–0.8, altura 0–24 m), sin rango
"ampliado" — sus columnas de ampliado (fila 156/158) están vacías. El catálogo `ZonificacionPOT`
de Prisma debe permitir que `indiceEdificAmplMin/Max` y `alturaAmplMin/Max` sean `null` para la
zona G0.

Cada bloque de zona también trae parámetros de `FRACCIONAMIENTO` (frente mínimo de predio,
superficie efectiva mínima) en las filas 6–7/35–36/64–66/94–95/123–124/152–153 — no usados por el
motor de edificabilidad de la hoja `Edificabilidad`, pero disponibles si se quiere validar que un
terreno es subdivisible/fraccionable. Quedan fuera del alcance de v1 según la especificación.

---

## 2. Hoja `Edificabilidad` — motor de área construible

Fórmulas exactas (ancladas al primer terreno de la fila 6; el modelo soporta hasta 4 "predios"
combinados en un mismo proyecto vía filas 6/8/10/12, sumados en la fila 13/24/25 — la v1 de la
app solo necesita el caso de un terreno, así que se documenta ese camino):

```
Edificabilidad!D6  = 20*44                                    → área terreno en m2 (880)
Edificabilidad!B6  = D6*1.423                                 → equivalente en varas2 (factor m2→v2 = 1.423)
Edificabilidad!B13 = B6+B8+B10+B12                             → área total terreno, varas2
Edificabilidad!D13 = SUM(D6:D12)                                → área total terreno, m2
```

**Edificabilidad Base** (`Edificabilidad!B15`, celda real):
```excel
=IF(B5="G5",POT!E9*D6,
 IF(B5="g4",POT!E38*D6,
 IF(B5="G3",POT!E68*D6,
 IF(B5="g2",POT!E97*D6,
 IF(B5="g1",POT!E126*D6,
 IF(B5="g0",POT!G155*D6,0))))))
```
Equivalente genérico portable:
```
areaConstruibleBase = indiceEdificabilidadBase(zona) * areaTerrenoM2
```

**Edificabilidad Ampliada** (`Edificabilidad!B16`):
```excel
=IF(B5="G5",POT!E10*D6,
 IF(B5="g4",POT!E39*D6,
 IF(B5="G3",POT!E69*D6,
 IF(B5="g2",POT!E98*D6,
 IF(B5="g1",POT!E127*D6,
 IF(B5="g0",POT!G155*D6,0))))))
```
> **Bug heredado del Excel:** para zona `g0` esta fórmula reutiliza `POT!G155` (el índice
> **base**) en vez de un índice ampliado — porque G0 no tiene incentivos. Es intencional, no un
> error de copiado: replicar el mismo comportamiento (para G0, base = ampliado).

Totales combinando los 4 posibles predios:
```
Edificabilidad!B24 = B15+B17+B19+B21      → Edificabilidad Base total (m2)
Edificabilidad!B25 = B16+B18+B20+B22      → Edificabilidad Ampliada total (m2)
```

**Incentivos y área alcanzable:**
```
Edificabilidad!B26 = 1                              → % de Incentivos (parámetro, 100% en el caso base)
Edificabilidad!B27 = (B25-B24)*B26                  → Área Ampliada con % de Incentivos
Edificabilidad!B28 = B24+B27                        → Total Área Alcanzable con Incentivos
Edificabilidad!B29 = B28                            → Edificabilidad a Utilizar (área construible final)
```
Esto confirma exactamente la fórmula de referencia de la sección 6.1 de la especificación:
```
areaConstruibleAmpliada - areaConstruibleBase, multiplicada por % incentivos, sumada a la base.
```

**Altura máxima** (`Edificabilidad!B31`/`B32`):
```excel
B31 =IF(B5="G5",POT!E11,IF(B5="g4",POT!E40,IF(B5="G3",POT!E70,IF(B5="g2",POT!E99,0))))
B32 =IF(B5="G5",POT!E12,IF(B5="g4",POT!E41,IF(B5="G3",POT!E71,IF(B5="g2",POT!E100,0))))
```
> **Bug heredado del Excel:** esta cadena de `IF` **no tiene ramas para `g1` ni `g0`** — para
> esas zonas devuelve 0. Al portar a TypeScript, decidir si se corrige (agregar
> `POT!E128/E129` para G1 y `POT!G157` para G0) o se documenta como limitación conocida. Se
> recomienda corregirlo, ya que no hay razón funcional para omitir esas dos zonas.

**Distribución por uso** (residencial/comercial/oficinas/industrial/autoservicios), fila 38–43:
```
Edificabilidad!B38 = B29-B39-B40     → Residencial = área total menos comercial y oficinas
Edificabilidad!B43 = SUM(B38:B42)    → Área total (debe igualar B29)
Edificabilidad!C38..C42 = Bxx/$B$43  → % de mezcla por uso
```

**Dimensionamiento residencial** (filas 51–70, único uso con área > 0 en el proyecto de
ejemplo):
```
Edificabilidad!B52 = 0.8                              → Eficiencia de Torre (parámetro)
Edificabilidad!B53 = 90                                → Área promedio del apartamento, m2 (parámetro)
Edificabilidad!B54 = B38                                → Área Construible Residencial
Edificabilidad!B55 = B54*B52                            → Área Rentable Residencial (5280*0.8 = 4224)
Edificabilidad!B57 = CEILING(B55/B53,1)                 → Cantidad de Unidades (=47)
Edificabilidad!B58 = B55/(B53*4)                        → Cantidad estimada de niveles
Edificabilidad!B59 = 2                                  → Parqueos por apartamento (parámetro)
Edificabilidad!B60 = ROUND(IF(B54<1500,3,
                        IF(B54<3000,4,
                        IF(B54<4500,6,
                        CEILING(B54/800,1)))),0)        → Parqueos de visitas (tabla escalonada)
Edificabilidad!B61 = 5                                  → Parqueos adicionales (parámetro)
Edificabilidad!B62 = (CEILING(B57,1)*B59)+B60+B61       → Total de parqueos (=106)
Edificabilidad!B63 = B62*B51                            → Área de Parqueos (B51 = 35 m2/parqueo)
Edificabilidad!B65 = B62                                → Parqueos en sótano (100% bajo tierra en este caso)
Edificabilidad!B66 = CEILING(B65/(B56/B51),0.5)         → Sótanos estimados (redondeado a 0.5)
Edificabilidad!B68 = B54                                → Área Total Construcción Superficie
Edificabilidad!B69 = B65*B51                            → Área de Parqueo (sótano)
Edificabilidad!B70 = B68+B69                            → Área Total a Construir (residencial + parqueo)
```
Fórmulas equivalentes existen para Comercial (filas 76–93), Oficinas (95–114), Industrial
(116–135) y Autoservicio (137–156), con la misma estructura (`eficiencia de parqueo`, `eficiencia
de edificación`, `m2 por parqueo`) pero factores propios por uso — todos en 0 en el proyecto de
ejemplo. Deben portarse igual (una función `dimensionarUso(areaConstruible, parametros)` genérica
parametrizada por tipo de uso).

**Totales finales:**
```
Edificabilidad!B169 = SUM(B164:B168)   → Total Área Rentable (todos los usos)
Edificabilidad!B177 = SUM(B172:B176)   → Total Área Construible en Superficie
Edificabilidad!B185 = SUM(B180:B184)   → Total Área Construible en Sótano
Edificabilidad!B187 = B177+B185        → Total Área Construible (superficie + sótano) = 8,990 m2
```

---

## 3. Hoja `Modelo de Desarrollo "Q"` — modelo conceptual anual (referencia cruzada)

Esta hoja **no es el motor de cálculo detallado** (ese es `FCF Base 26.01.27`) — es un resumen
anual/estático que sirve de panel de control y fuente de los totales por categoría que luego se
distribuyen mes a mes en la hoja de flujo de caja. Aun así documenta fórmulas clave que confirman
(o corrigen) la sección 6 de la especificación:

**Costo del terreno** (celda real, coincide con el caso de prueba de la sección 7 de la
especificación: ~Q12,131,200):
```
'Modelo de Desarrollo "Q"'!D25 = B25*1.423                  → área terreno en varas2 (1252.24 v2)
'Modelo de Desarrollo "Q"'!B34 = 1242                        → costo por vara2, en USD (parámetro)
'Modelo de Desarrollo "Q"'!B35 = B34*D25*7.8                 → Costo Total del Terreno en Quetzales
                                                                = 1242 * 1252.24 * 7.8 = Q12,131,200.224
```
Fórmula genérica: `costoTotalTerrenoQ = costoUSDporVara2 * areaTerrenoEnVaras2 * tipoCambioQxUSD`.
Nota: el factor de conversión m2→varas2 usado aquí (1.423) difiere ligeramente del usado en
`Costos Conceptual` (`D34 = B34/(0.8382*0.8382)`, equivalente a 1/0.8382² ≈ 1.4233) — son
prácticamente el mismo valor (diferencia < 0.02%) pero conviene fijar **una sola constante**
(`1.423` varas²/m² o su inverso `0.7031` m²/vara²) como parámetro de configuración global, no
duplicarla con ligeras variaciones.

**Costo total de construcción:**
```
B55 = SUM(B51:B54)     donde:
  B51 = SUM(B41:B50)                     → suma de líneas de PPTO (planificación, licencias, construcción, etc.)
  B52 = B51*D52         (D52 = 3%)        → Imprevistos
  B53 = 0                                 → Otros Costos
  B54 = (B51+B52)*0.02*0                  → Success Fee (multiplicado por 0 → eliminado, ver C54 nota)
```

**Ingresos totales:**
```
B90 = B89+B88   donde B88 = SUM(B79:B87)  → suma de ingresos "sin impuestos" por tipo de unidad
                       (B79 apunta a 'Ventas Conceptual'!A5, es decir, referencia directa a esa hoja)
```

**EBITDA / rentabilidad conceptual:**
```
B98 = SUM(B94:B97)       → Total Costos (Tierra + Construcción + Gastos Indirectos + Developer Fee)
B100 = B99-B98           → EBITDA = Ingresos totales - Total Costos
C104 = B98*B117*B104     → Costo Financiero = TotalCostos * %Deuda(0.7) * tasaAnual(6.5% en este modelo conceptual)
C105 = B105*B99*0.3      → Timbres = 3% * Ingresos * 30% (coincide con spec: 30% de la venta paga timbres)
C106 = IF((B100-C104-C105)>0,(B100-C104-C105)*B106,0)     → ISR = 25% * (EBITDA - Costo Financiero - Timbres), solo si es positivo
B111 = B100-C107          → Utilidad Neta (C107 = SUM(C104:C106))
B121 = B111/C116          → ROI = Utilidad Neta / Capital de socios (C116 = (TotalCostos+Impuestos)*30%)
```
> **Nota:** este modelo conceptual usa tasa de interés **6.5%** y calcula ISR sobre EBITDA menos
> intereses y timbres de un solo golpe (anual). La hoja `FCF Base 26.01.27` (sección 5 de este
> documento) usa una **tasa de 7.75%** y una lógica de ISR distinta (un único cargo al final del
> proyecto sobre el flujo acumulado). **La fuente de verdad para el motor de cálculo es
> `FCF Base 26.01.27`**, tal como indica la sección 7 de la especificación — esta hoja conceptual
> solo sirve para validar cruzadamente los totales de costos/ingresos/terreno.

**Nota sobre anomalía de fórmula:** `'Modelo de Desarrollo "Q"'!B39 = '=AT'` es una fórmula rota
(referencia a un nombre definido `AT` que no se pudo resolver, cachea el mismo valor que `D6`
del área a urbanizar). No portar tal cual — usar `Edificabilidad!D13` (área de terreno) como
fuente correcta, que es lo que el resto del modelo usa consistentemente.

---

## 4. Hoja `Costos Conceptual` — costo por categoría y por m2

Estructura idéntica repetida 5 veces (una por tipo de uso: Residencial, Comercial, Oficinas,
Industrial, Autoservicio), cada una con 8 líneas de costo. Ejemplo completo para Residencial
(filas 6–16):

```
Costos Conceptual!C6  = Edificabilidad!D13                → Área base (m2 terreno) para Prefactibilidad
Costos Conceptual!D6  = B6*C6                              → Total sin IVA = costoPorM2 * área
Costos Conceptual!E6  = D6*1.12                             → Total con IVA (12%)
...
Costos Conceptual!C7  = Edificabilidad!B70                 → Diseño usa el Área Total a Construir
Costos Conceptual!C10 = Edificabilidad!B69                 → Construcción Parqueo usa el área de parqueo (sótano)
Costos Conceptual!C11 = Edificabilidad!B68                 → Construcción Edificio usa el área construible en superficie
Costos Conceptual!D15 = SUM(D6:D14)                         → Total (Sin IVA) de la categoría de uso
Costos Conceptual!E15 = SUM(E6:E14)                         → Total (Con IVA)
Costos Conceptual!D16 = D15/C15                             → Valor promedio por m2 de construcción
```
Categorías (fila, costo/m2 hardcodeado como parámetro azul en el Excel real):
`Prefactibilidad` (1.25 USD/m2), `Diseño` (16.25 = suma de sub-honorarios), `Licencias y
Permisos` (17), `Urbanización` (65), `Construcción Parqueo` (500), `Construcción Edificio` (700),
`Áreas y Servicios Comunes` (40), `Instalaciones y Equipo Soporte` (40), `PM` (20). Todos son
USD/m2 sin IVA — coincide con el `costoPorM2` de la sección 6.2 de la especificación.

**Resumen y total del proyecto:**
```
Costos Conceptual!D80 = SUM(B75:B79)     → Total costos de construcción (todas las categorías de uso)
Costos Conceptual!E80 = D80*1.12          → Total con IVA
Costos Conceptual!D81 = D80*B81           → Imprevistos (B81 = 3%, referenciado desde 'Modelo de Desarrollo "Q"'!D52)
Costos Conceptual!D82 = SUM(D80:D81)      → Total (con imprevistos)
```
Confirma exactamente la fórmula genérica de la sección 6.2 de la especificación:
```
costoTotalPorCategoria = costoPorM2 * areaM2
costoTotalConstruccion = SUM(costoTotalPorCategoria)
costoTotalConIVA = costoTotalConstruccion * 1.12
```

---

## 5. Hoja `Ventas Conceptual` — ingresos, IVA y timbres por tipo de unidad

```
Ventas Conceptual!F5 = C5*D5                     → Total SIN impuestos = cantidad * precio sin impuestos
Ventas Conceptual!G6 = (F6*1.12*0.7)+(F6*0.3*1.03)   → Total CON impuestos (Comercial, y análogo en G8..G14)
```
Esto confirma **exactamente** la fórmula de la sección 6.3 de la especificación:
```
ivaSobreVenta      = ingresoSinImpuestos * 0.7 * 0.12   (70% de la venta paga IVA)
timbresSobreVenta  = ingresoSinImpuestos * 0.3 * 0.03   (30% paga timbres)
ingresoConImpuestos = ingresoSinImpuestos + ivaSobreVenta + timbresSobreVenta
```

**Caso especial Residencial (fila 5)** — el precio se fija primero **con** impuestos y se
retrocalcula el neto, usando el factor combinado `0.7*1.12 + 0.3*1.03 = 1.093`:
```
Ventas Conceptual!E5 = 3300                        → Precio Venta Con Impuestos, USD/m2 (parámetro, precio de lista)
Ventas Conceptual!D5 = CEILING(E5/1.093,0.01)       → Precio Venta Sin Impuestos = precioConImpuestos / 1.093
Ventas Conceptual!F5 = C5*D5                        → Total sin impuestos
Ventas Conceptual!G5 = F5*1.093                     → Total con impuestos (atajo equivalente a la fórmula de G6)
```
Es decir: **el factor `1.093` es una constante derivada** = `0.7*1.12 + 0.3*1.03`, no un número
mágico — debe calcularse en el motor a partir de los 4 parámetros configurables (`%IVA`, `%venta
con IVA`, `%timbres`, `%venta con timbres`), no hardcodearse.

**Totales:**
```
Ventas Conceptual!F15 = SUM(F5:F14)     → Ingreso total sin impuestos (usado como C18 en la hoja FCF)
Ventas Conceptual!G15 = SUM(G5:G14)     → Ingreso total con impuestos (usado como C17 en la hoja FCF)
```

Las áreas/cantidades de unidades no residenciales se toman directamente de `Edificabilidad`
(p. ej. `Ventas Conceptual!C8 = Edificabilidad!B84` para parqueos comerciales), replicando el
mismo patrón "Edificabilidad calcula el área, Ventas Conceptual la valoriza" que ya se vio en
`Costos Conceptual`.

---

## 6. Hoja `Est Enganches + Lista precios` — curva de absorción y cobro de enganches

Esta hoja modela el **20% de enganche** de cada unidad, prorrateado en cuotas mensuales iguales
durante el periodo de preventa. El 80% restante ("contra entrega"/escrituración) **no** se
modela aquí unidad por unidad — se agrega como un solo monto lumpsum más adelante en la hoja de
flujo de caja (sección 7).

**Parámetros globales** (fila 3–6):
```
B3 = 0.2      → % de Enganche
B4 = 20000    → Reserva (monto fijo por unidad, en Quetzales)
B5 = 30       → Meses de duración del enganche
```

**Por cada unidad vendida** (una fila por apartamento, ejemplo fila 10, columnas `J..AN` = meses
1 a 30 desde la reserva):
```excel
J10  = $B$4                                    → Mes 1: pago de la Reserva
K10..AN10 = (($B$3*$F10)-($B$4))/$B$5           → Cuota mensual constante = ((20%*PrecioSinImpuestos) - Reserva) / 30
F10  = Tabla6[[#This Row],[Precio final]]/1.093 → Precio sin impuestos = Precio final (con impuestos) / 1.093
AU10 = SUM(I10:AT10)                            → Total de flujos cobrados de esa unidad (= 20% del precio)
AV10 = AU10/F10                                 → % Enganche efectivo (verificación, debe dar 0.20)
```
Fórmula genérica portable:
```
cuotaMensualEnganche = ((%enganche * precioUnidadSinImpuestos) - montoReserva) / mesesEnganche
```

**Agregación por mes, todas las unidades** (fila 59, una columna por mes calendario):
```
'Est Enganches + Lista precios'!X59 = SUM(X10:X57)     → total de enganches cobrados ese mes, todas las unidades
```
Esta fila (`I59:AT59` ≈ `59` columnas de meses) es la que alimenta directamente `INGRESOS
ABSORCIÓN PROYECTADA` en la hoja `FCF Base 26.01.27` (ver sección 7).

**Tabla de precios y meta de ventas** (filas 68–73):
```
B69 = Tabla6[[#Totals],[Precio final]]      → Lista de precios actual con impuestos (SUBTOTAL de la tabla)
B70 = B69/1.093                              → Lista de precios actual sin impuestos
```
`Tabla6` es una tabla nativa de Excel; sus totales usan `SUBTOTAL(109, ...)` (suma que ignora
filas ocultas) — equivalente a un `SUM` normal sobre las unidades activas.

---

## 7. Hoja `FCF Base 26.01.27 ` — flujo de caja mensual (el corazón del modelo)

54 columnas mensuales (`I` a `BO`, mes 0 = jun-2024 hasta dic-2028). Se documentan las fórmulas
ancla de cada bloque; los desembolsos de costos/gastos individuales (filas 25–48) tienen **curvas
de desembolso manuales por categoría**, no una fórmula única — ver nota al final de esta sección.

### 7.1 Parámetros globales (fila 8–9)
```
D8 = 12%     → IVA
D9 = 0.85    → % de costos con derecho a crédito fiscal de IVA
```

### 7.2 Ingresos (filas 17–20)
```
C18 = 'Ventas Conceptual'!... (via Tabla6[[#Totals],[Precio sin impuestos]])   → Ingreso total sin impuestos
C19 = C18*0.7*0.12                          → IVA total proyectado sobre ventas
C20 = C18*0.3*0.03                          → Timbres total proyectado sobre ventas
C17 = SUM(C18:C20)                          → Ingreso total CON impuestos
```
**Curva mensual de ingresos:**
```
N18..BA18 = 'Est Enganches + Lista precios'!<col>59     → enganches cobrados ese mes (ver sección 6)
BF18..BI18 = $C$18*0.8*25%                               → 80% restante ("contra entrega"), repartido en 4 cuotas iguales del 25% c/u
BF19..BI19 = $C$19*25%                                    → IVA de venta, reconocido en el mismo momento del desembolso (escrituración)
BF20..BI20 = $C$20*25%                                    → Timbres, ídem
```
**Hallazgo clave:** el IVA y los timbres sobre la venta **no se reconocen cuando se cobra el
enganche**, sino en el momento de la escrituración/entrega (el mismo mes en que se paga el 80%
restante), repartido en 4 meses iguales. Esto es más específico que la fórmula genérica de la
sección 6.3 de la especificación, que no distinguía el momento de reconocimiento fiscal.

### 7.3 Costos y gastos (filas 22–50)
```
C22 = SUM(C23:C24)             → Costos totales = Tierra + Costos Generales
C23 = 'Modelo de Desarrollo "Q"'!B35    → Costo del terreno (ver sección 3)
C24 = SUM(C25:C37)              → Costos Generales = suma de 13 líneas (Planificación, Licencias, Construcción, PM, etc.)
C40 = SUM(C41:C49)              → Gastos Generales (Mercadeo, Ventas, Legales, IUSI, Avalúos, etc.)
C50 = C22+C38                   → Total Costos + Gastos (sin IVA)
C51 = ((C24*D8)+(C38*D8))*D9    → IVA sobre costos y gastos, neto del % recuperable (0.85)
C52 = SUM(C50:C51)              → Total Costos + Gastos CON IVA
```
Fórmula genérica confirmada (coincide con la sección 6.4 de la especificación, ecuación de
`IVA[t]`):
```
IVA_sobre_costos = (costosGenerales + gastosGenerales) * %IVA(12%) * %creditoFiscal(85%)
```

**Desembolso mensual (I23:BO49):** cada línea de costo/gasto tiene su propia curva de
desembolso, fijada manualmente por el equipo de Nexo Inmobiliario en función del cronograma real
de obra — por ejemplo:
```
Costos Conceptual (vía 'Modelo de Desarrollo "Q"')!C28 → Construcción de proyecto:
  AG28 = $C$28*0.15          (15% al mes 22, inicio de obra gris)
  AH28..BB28 = $C$28*0.8/20  (80% repartido en 20 cuotas iguales)
  BD28,BE28 = $C$28*0.05/2   (5% final repartido en 2 cuotas de cierre)

Gastos!C47 (IUSI) → recurrente trimestral:
  O47,AD47,AQ47,BD47 = (9/1000)*$C$23      (0.9% anual del costo del terreno, prorrateado)

Gastos!C42 (Ventas) → curva variable proporcional a ventas restantes:
  Q42..* = ($C$42-$O$42)/49*0.3*1.5
```
**Implicación de diseño para el motor:** el modelo `Costo` de Prisma (sección 4 de la
especificación) con solo `mesInicio` + `mesesDuracion` **no alcanza** para reproducir estas
curvas — son distribuciones arbitrarias por mes (porcentajes desiguales, hitos puntuales,
fórmulas dependientes de otras filas). Se recomienda agregar una tabla `CurvaDesembolso` (o un
campo JSON `curvaMensual: number[]` en `Costo`) que permita cargar un array de montos/porcentajes
por mes en lugar de asumir una curva lineal.

### 7.4 Flujo operativo (filas 63–64)
```
I63 = SUM(I18:I20) - I52     → Flujo Operativo = Ingresos totales del mes - (Costos+Gastos con IVA) del mes
I64 = I63                     → Flujo Operativo Acumulado (mes 0)
J64 = J63 + I64                → acumulado = flujo del mes + acumulado anterior
```
> Nota: existe una fila 61 "FLUJO TOTAL CON IMPUESTOS" (`I61 = I17-I52+I56+I59`, que neta el IVA
> débito/crédito de las filas 56–59) que **no se usa** en la cadena de cálculo real — el flujo
> operativo que alimenta el resto del modelo (fila 78 en adelante) viene de la fila 63, no de la
> 61. Es un remanente de una versión anterior del modelo; no portarlo salvo para un panel de
> "chequeo de IVA" opcional.

### 7.5 Financiamiento bancario (filas 67–75)
```
E70 = 0.0775           → Tasa de interés anual (parámetro, coincide con el caso de prueba §7 de la especificación)
F70 = E70/12   (mostrado como C70/12 en el ancla) → Tasa mensual
F72 = 0.7               → LTV (parámetro)
F73 = MAX(L73:CD73)     → Crédito Bancario Solicitado (máximo saldo de deuda alcanzado) = Q55,000,000
```
**Desembolso del crédito (fila 69):** NO es una fórmula automática de "LTV × costo acumulado"
como sugiere la sección 6.4 de la especificación — es un **monto techo fijo negociado**
(Q55,000,000) que se dispone en tramos manuales a partir del mes de inicio de obra gris:
```
AG69,AH69 = 1500000                                  → primeros 2 desembolsos fijos
AI69..BF69 = (55000000-SUM($AE$69:$AH$69))/22        → resto repartido en 22 cuotas iguales
```
**Saldo de crédito (fila 73), fórmula recursiva real:**
```
<col>73 = <col_anterior>73 + <col>69 - <col_anterior>75
```
```
intereses[t] = saldoCredito[t] * tasaMensual[t]     (I74 = I73*I70, etc. — nota: usa el saldo DEL MES ACTUAL, no el del mes anterior)
```
> **Diferencia con la fórmula de referencia de la sección 6.4** de la especificación
> (`intereses[t] = saldoCredito[t-1] * tasaAnual/12`): el Excel real calcula el interés sobre el
> **saldo después del desembolso del mes actual**, no sobre el saldo de cierre del mes anterior.
> Es una diferencia de convención (interés "vencido sobre saldo posterior al desembolso" vs
> "interés sobre saldo inicial") que cambia el resultado en unos meses de descalce — replicar
> exactamente `saldo[t]*tasa[t]` como hace el Excel, no la fórmula simplificada de la spec.

**Pago de principal (fila 75)** — también manual, concentrado al final del proyecto:
```
BF75 = 55000000*0.3    → 30% del crédito
BG75 = 55000000*0.2    → 20%
BH75 = 55000000*0.2    → 20%
BI75 = 55000000*0.1    → 10%
BJ75 = 55000000*0.1    → 10%
BK75 = 55000000*0.1    → 10%
```
El "Valor de Garantía" (fila 71 = costo acumulado del proyecto) y el LTV (F72) se usan como
**referencia de cumplimiento** (¿el crédito solicitado no excede el 70% del valor construido?),
pero no accionan automáticamente el monto desembolsado mes a mes — eso es una decisión manual
capturada como inputs. **Para la v1 de la app, modelar el desembolso/pago del crédito como una
curva configurable por el usuario** (monto techo + curva de disposición + curva de repago), y
opcionalmente mostrar el LTV resultante como validación, no como fórmula generadora.

### 7.6 Flujo hacia socios, ISR y flujo neto (filas 77–85)

```
C77 = 20000000 - C23        → Capital Socios = Capital objetivo (Q20,000,000) menos costo del terreno
                                (coincide EXACTO con el caso de prueba de la sección 7 de la especificación)
C78 = C23                    → aporte de terreno
C79 = C77 + C78              → Total Aporte Socios = Q20,000,000
```
**Flujo con financiamiento** (fila 78, mal etiquetada "TIERRA" en el Excel — en realidad es el
flujo operativo después de financiamiento):
```excel
I78 = I63 + I69 - I74 - I75
```
```
flujoConFinanciamiento[t] = flujoOperativo[t] + desembolsoCredito[t] - intereses[t] - pagoPrincipal[t]
```

**ISR (fila 81)** — a diferencia de la fórmula mensual simplificada de la sección 6.4 de la
especificación (`ISR[t] = max(0, utilidadAcumulada[t]) * 0.25`), el Excel real aplica el ISR
**una sola vez, al final del proyecto**, sobre la suma de todo el flujo con financiamiento
acumulado, con un factor adicional de 0.8:
```excel
BO81 = SUM(I78:BO78)*C81*0.8        (C81 = 0.25)
```
```
ISR_total = SUM(flujoConFinanciamiento[todos los meses]) * 25% * 0.8
```
Se reconoce **solo en el último mes** (`BO`, dic-2028), no prorrateado. El factor `0.8` no está
documentado en el Excel — es probablemente una aproximación de "80% de la utilidad antes de
impuestos es base gravable" (dejando 20% como gastos no deducibles/reservas), pero debe
confirmarse con el equipo de Nexo Inmobiliario antes de portarlo tal cual; en el motor debe ser
un parámetro configurable (`factorBaseGravableISR`), no un número mágico fijo.

**Escudo fiscal de terreno** (fila 82) está presente en el modelo pero **desactivado** en este
proyecto (`C82 = (0)*0.25*0.7 = 0` — el primer factor está hardcodeado en 0). Es un placeholder
para un beneficio fiscal que no se usó en esta corrida; portarlo como función pero con el
parámetro en 0 por defecto.

**Flujo neto (fila 84) — el que alimenta VAN/TIR:**
```excel
I84 = I78 - I81 - I82
```
```
flujoNeto[t] = flujoConFinanciamiento[t] - ISR[t] - escudoFiscalTerreno[t]
```
Coincide con la advertencia de la sección 6.5 de la especificación: **es el flujo de caja de los
SOCIOS después de financiamiento e impuestos**, no el flujo operativo bruto.

**Máximo capital requerido (fila 85):**
```
I85 = I84
J85 = J84 + I85    (acumulado)
F85 = -MIN(I85:BB85)     → Máximo Capital a Invertir = -mínimo del flujo neto acumulado (= Q24,033,454.04)
```

### 7.7 Indicadores finales (filas 87–89) — fórmulas EXACTAS pedidas en la sección 7 de la especificación

```excel
F87 = XIRR(I84:BO84,I15:BO15,0)      → TIR = 6.355880...%   (guess inicial 0)
F88 = F83/C79                         → ROI = Utilidad después de Impuestos / Total Aporte Socios = 22.1009%
F89 = NPV(10%/12,I84:BO84)            → VAN = -Q2,200,511.26   (tasa mensual = 10%/12, sobre el MISMO rango I84:BO84)
```
donde `F83` (Utilidad Después de Impuestos) = `F63-F81+F82-F74` (Flujo Operativo total menos
ISR total, más escudo fiscal, menos intereses totales).

Esto confirma **literalmente** los rangos y fórmulas citados en la sección 7 de la
especificación (`XIRR(I84:BO84,I15:BO15,0)` y `NPV(10%/12,I84:BO84)`) — son las celdas reales del
Excel, no solo un ejemplo ilustrativo.

---

## 8. Caso de prueba de paridad (valores reales cacheados del Excel)

Para el proyecto "ZONA 14 RESIDENCIAL" con zona `G4`, terreno de 880 m2:

| Variable | Celda fuente | Valor |
|---|---|---|
| Área construible total | `Edificabilidad!B187` | 8,990 m2 |
| Edificabilidad a utilizar (residencial) | `Edificabilidad!B29` | 5,280 m2 |
| Cantidad de unidades | `Edificabilidad!B57` | 47 |
| Costo total del terreno | `'Modelo de Desarrollo "Q"'!B35` | Q12,131,200.224 |
| Ingreso total sin impuestos | `'FCF Base 26.01.27 '!C18` | Q96,309,122.7996 |
| Ingreso total con impuestos | `'FCF Base 26.01.27 '!C17` | Q105,265,871.22 |
| Costos + Gastos sin IVA | `'FCF Base 26.01.27 '!C50` | Q85,656,890.16 |
| Costos + Gastos con IVA | `'FCF Base 26.01.27 '!C52` | Q93,156,510.53 |
| Crédito bancario solicitado (techo) | `'FCF Base 26.01.27 '!F73` | Q55,000,000.00 |
| Tasa de interés anual | `'FCF Base 26.01.27 '!E70` | 7.75% |
| LTV | `'FCF Base 26.01.27 '!F72` | 70% |
| Capital total de socios | `'FCF Base 26.01.27 '!C79` | Q20,000,000.00 (= Q20M − costo terreno) |
| ISR total (único, mes final) | `'FCF Base 26.01.27 '!F81` | Q1,105,044.13 |
| Utilidad después de impuestos | `'FCF Base 26.01.27 '!F83` | Q4,420,176.54 |
| Máximo capital a invertir | `'FCF Base 26.01.27 '!F85` | Q24,033,454.04 |
| **TIR** | `'FCF Base 26.01.27 '!F87` | **6.3559%** |
| **ROI** | `'FCF Base 26.01.27 '!F88` | **22.1009%** |
| **VAN** | `'FCF Base 26.01.27 '!F89` | **-Q2,200,511.26** |

Estos valores, junto con el flujo neto mensual completo (`I84:BO84`) y las fechas (`I15:BO15`),
son el fixture de referencia para el test de paridad de la sección 7 de la especificación: el
motor en TypeScript debe reproducir exactamente `TIR = 0.0635588...` y `VAN = -2200511.26...`
dado el mismo flujo mensual como input.

---

## 9. Resumen de discrepancias entre la especificación (sección 6) y el Excel real

1. **Financiamiento bancario:** no es `min(costoAcumulado*LTV, ...)` mes a mes — es un monto
   techo fijo (Q55,000,000) con curva de disposición y repago manuales. LTV es solo una
   referencia de cumplimiento.
2. **Interés del crédito:** se calcula sobre el saldo **del mes actual** (después del desembolso
   de ese mes), no sobre el saldo de cierre del mes anterior.
3. **ISR:** es un cargo **único al final del proyecto** (25% × 80% × flujo acumulado con
   financiamiento), no un cálculo mensual sobre utilidad acumulada.
4. **IVA/timbres sobre ventas:** se reconocen en el momento de la escrituración (junto con el
   80% del pago, repartido en 4 meses), no proporcionalmente a cada cobro de enganche.
5. **Curvas de desembolso de costos/gastos:** son manuales por categoría y por mes (porcentajes e
   hitos arbitrarios), no una función lineal de `mesInicio` + `mesesDuracion`.
6. **Zonificación POT:** G5 sí tiene valores (la spec los marcaba como "—"); G0 solo tiene
   índice/altura base, sin rango "ampliado". Las fórmulas de altura máxima en `Edificabilidad`
   tienen un vacío real (bug) para zonas G1 y G0 que conviene corregir al portar.
7. **Constante de conversión m2↔varas2:** aparece como `1.423` en un lugar y `1/0.8382²≈1.4233`
   en otro — usar una sola constante configurable.

Estas siete diferencias deben reflejarse en el diseño del motor de cálculo (paso 3 de la sección
9 de la especificación) y en las pruebas de paridad (paso 4), usando como fuente de verdad
siempre la hoja `FCF Base 26.01.27 `.

## 10. Addendum — hallazgos al construir el motor de cálculo (paso 3)

Al extraer el fixture de paridad completo (`I84:BO84` + `I15:BO15`) para escribir las pruebas de
`indicadores.ts`, aparecieron dos anomalías adicionales en la hoja `FCF Base 26.01.27 ` que no
eran visibles solo leyendo fórmulas ancla — solo se detectan recorriendo el rango completo:

**8. El rango `I84:BO84` tiene 4 columnas vacías (`P`, `AC`, `AP`, `BC`)** — son columnas de
"etiqueta de año" (`P16='Año 2025'`, `AC16='Año 2026'`, `AP16='Año 2027'`, `BC16='Año 2028'`)
intercaladas entre los meses reales para separar visualmente los bloques anuales; no representan
un mes de proyecto. De los 59 valores del rango, solo **55 son meses reales** con flujo neto. El
motor debe ignorar estas columnas (no generarlas ni tratarlas como mes 0).

**9. `XIRR(I84:BO84,I15:BO15,0)` usa un rango de fechas dañado.** `I15` es una fecha real
(2024-06-01), pero `J15:BO15` son `=TEXT(EOMONTH(...),"mmm-yy")` — es decir, **texto** ("jul-24"),
no números de fecha. Excel no puede evaluar `XIRR` con fechas de texto; el valor cacheado en
`F87` (6.3559%) es casi con certeza un **remanente de una versión anterior** del archivo, de
antes de que la fila 15 se convirtiera a texto para mostrarse como encabezado. Reconstruyendo la
secuencia de fechas real que la fórmula `EOMONTH` pretendía producir (`2024-06-01`, luego fin de
mes sucesivos) y corriendo XIRR sobre el mismo flujo neto, el resultado correcto es
**≈6.2548%**, no 6.3559%. La diferencia (~0.11 puntos porcentuales) es la huella de esta fecha
rota, no un error del motor nuevo. **`NPV(10%/12,I84:BO84)` no depende de fechas** (asume
períodos regulares) y sí reproduce el valor cacheado de `F89` de forma exacta
(-Q2,200,511.26) — por eso el VAN es una prueba de paridad estricta y el TIR es una prueba de
paridad "aproximada, con fechas reconstruidas y la discrepancia documentada", no una igualdad
exacta contra `F87`.

**10. La fórmula del saldo de crédito (fila 73) tiene un bug de signo latente pero inofensivo.**
En las columnas iniciales (antes del mes 22, cuando el desembolso real es 0), la fórmula es
`=I73-J69-I75` (**resta** el desembolso del mes). A partir del mes en que el crédito empieza a
moverse de verdad (`AG73` en adelante) la fórmula cambia a `=AF73+AG69-AF75` (**suma** el
desembolso, que es la fórmula financieramente correcta: saldo```=```saldo anterior + desembolso
del mes − pago de principal del mes anterior). Como todos los desembolsos son 0 en el tramo con
el signo invertido, el bug nunca afectó ningún valor cacheado — pero si se copia la fórmula tal
cual sin notar el cambio de signo, un motor que reciba desembolsos tempranos (>0) calcularía mal
el saldo. El motor de cálculo implementa siempre la versión correcta
(`saldo[t] = saldo[t-1] + desembolso[t] - pagoPrincipal[t-1]`), que es la que efectivamente
gobierna todo el tramo con actividad real del crédito en el Excel.

// Paleta de la gráfica de flujo de caja — un solo hue (serie única = sin caja de leyenda), más
// los tokens de "chrome" (grid/eje/texto) del skill de dataviz, superficie clara.
export const COLOR_SERIE = "#2a78d6"; // slot categórico 1 (azul)
export const COLOR_SERIE_FILL = "#2a78d61a"; // mismo hue, ~10% opacidad para el área
export const COLOR_GRID = "#e1e0d9"; // hairline, recesivo
export const COLOR_EJE = "#c3c2b7"; // baseline/axis
export const COLOR_TEXTO_MUTED = "#898781"; // ticks/labels
export const COLOR_TEXTO_SECUNDARIO = "#52514e";
export const COLOR_NEGATIVO = "#e34948"; // polo rojo del par divergente — solo para texto de delta

// Paleta categórica (orden fijo, nunca ciclado) — para el panel comparativo, donde cada color
// identifica un proyecto. Pasa el gate de pares adyacentes en ambos modos (skill de dataviz,
// palette.md); no usar para scatter/choropleth (esos requieren el gate "all-pairs", solo los
// primeros 3 slots lo pasan).
export const PALETA_CATEGORICA = [
  "#2a78d6", // 1 azul
  "#eb6834", // 2 naranja
  "#1baf7a", // 3 aqua
  "#eda100", // 4 amarillo
  "#e87ba4", // 5 magenta
  "#008300", // 6 verde
  "#4a3aa7", // 7 violeta
  "#e34948", // 8 rojo
];

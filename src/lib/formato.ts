export const formatoQ = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
export const formatoQCompacto = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  notation: "compact",
  maximumFractionDigits: 1,
});
export const formatoPct = new Intl.NumberFormat("es-GT", { style: "percent", minimumFractionDigits: 2 });
export const formatoFecha = new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" });

export function buildMonthGrid(year: number, month: number) {
  // month is 1-indexed (1 = January)
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // getUTCDay(): 0 = Sunday .. 6 = Saturday. Convert to Monday-first offset (0 = Monday).
  const mondayFirstOffset = (firstOfMonth.getUTCDay() + 6) % 7;

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < mondayFirstOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<{ day: number; iso: string } | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

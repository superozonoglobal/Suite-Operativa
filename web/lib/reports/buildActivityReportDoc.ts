import { jsPDF } from "jspdf";
import { ROLES, STATUS_COLUMNS } from "@/lib/constants";
import { filterTasks, type ReportTask } from "@/lib/reports/filterTasks";

const PAGE_MARGIN = 15;
const ROW_H = 6;

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function buildActivityReportDoc(
  allTasks: ReportTask[],
  opts: {
    fromDate?: string;
    toDate?: string;
    roleFilter?: string;
    statusFilter?: string;
    generatedByName?: string;
  } = {}
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = PAGE_MARGIN;

  function checkBreak(needed: number) {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Informe de actividades", PAGE_MARGIN, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Super Ozono — Suite operativa", PAGE_MARGIN, y + 16);
  y += 32;

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(9);
  const now = new Date();
  doc.text(
    "Generado: " + now.toLocaleString("es-MX") + (opts.generatedByName ? " · por " + opts.generatedByName : ""),
    PAGE_MARGIN,
    y
  );
  y += 5;
  let rangeLabel = "Todas las fechas";
  if (opts.fromDate || opts.toDate) {
    rangeLabel = "Del " + (opts.fromDate ? fmtDate(opts.fromDate) : "—") + " al " + (opts.toDate ? fmtDate(opts.toDate) : "—");
  }
  let filterLabel = "Rango: " + rangeLabel;
  if (opts.roleFilter) filterLabel += "  ·  Rol: " + (ROLES.find((r) => r.id === opts.roleFilter)?.name ?? opts.roleFilter);
  if (opts.statusFilter) {
    filterLabel += "  ·  Estado: " + (STATUS_COLUMNS.find((c) => c.id === opts.statusFilter)?.label ?? opts.statusFilter);
  }
  doc.text(filterLabel, PAGE_MARGIN, y);
  y += 10;

  const tasks = filterTasks(allTasks, opts);

  // ---- Resumen por rol / cargo ----------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumen por rol / cargo", PAGE_MARGIN, y);
  y += 8;

  const rolesInPlay = ROLES.filter((r) => tasks.some((t) => t.roleTag === r.id));
  const colX = [PAGE_MARGIN, PAGE_MARGIN + 55, PAGE_MARGIN + 85, PAGE_MARGIN + 115, PAGE_MARGIN + 145, PAGE_MARGIN + 165];
  const headers = ["Rol", "Por Hacer", "En Proceso", "En Revisión", "Aprobado", "Total"];

  function drawRow(cells: (string | number)[], bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    cells.forEach((c, i) => doc.text(String(c), colX[i], y));
    y += ROW_H;
  }

  checkBreak(ROW_H * 2);
  drawRow(headers, true);
  doc.setDrawColor(180, 180, 180);
  doc.line(PAGE_MARGIN, y - 4, pageWidth - PAGE_MARGIN, y - 4);

  if (rolesInPlay.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Sin actividades para este filtro.", PAGE_MARGIN, y);
    y += ROW_H;
  } else {
    rolesInPlay.forEach((r) => {
      const roleTasks = tasks.filter((t) => t.roleTag === r.id);
      const counts = STATUS_COLUMNS.map((c) => roleTasks.filter((t) => t.status === c.id).length);
      checkBreak(ROW_H);
      drawRow([r.name, ...counts, roleTasks.length]);
    });
  }
  y += 6;

  // ---- Listado completo de actividades, agrupado por rol --------------
  checkBreak(14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Listado de actividades", PAGE_MARGIN, y);
  y += 8;

  if (tasks.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No hay actividades que coincidan con el filtro seleccionado.", PAGE_MARGIN, y);
    y += ROW_H;
  } else {
    const detailColX = [PAGE_MARGIN, PAGE_MARGIN + 78, PAGE_MARGIN + 118, PAGE_MARGIN + 150];
    const rolesForDetail = opts.roleFilter
      ? ROLES.filter((r) => r.id === opts.roleFilter)
      : ROLES.filter((r) => tasks.some((t) => t.roleTag === r.id));

    rolesForDetail.forEach((r) => {
      const roleTasks = tasks.filter((t) => t.roleTag === r.id);
      if (roleTasks.length === 0) return;
      checkBreak(ROW_H * 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(60, 100, 20);
      doc.text(r.name + " (" + roleTasks.length + ")", PAGE_MARGIN, y);
      doc.setTextColor(20, 20, 20);
      y += 5.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      ["Tarea", "Responsable", "Estado", "Vence"].forEach((h, i) => doc.text(h, detailColX[i], y));
      y += 4.5;
      doc.setDrawColor(220, 220, 220);
      doc.line(PAGE_MARGIN, y - 3.5, pageWidth - PAGE_MARGIN, y - 3.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      roleTasks.forEach((t) => {
        checkBreak(ROW_H);
        const statusLabel = STATUS_COLUMNS.find((c) => c.id === t.status)?.label ?? t.status;
        const title = t.title.length > 42 ? t.title.slice(0, 40) + "…" : t.title;
        doc.text(title, detailColX[0], y);
        doc.text(t.assignee ? t.assignee.name : "—", detailColX[1], y);
        doc.text(statusLabel, detailColX[2], y);
        doc.text(fmtDate(t.dueDate), detailColX[3], y);
        y += ROW_H;
      });
      y += 3;
    });
  }

  // ---- Pie de página con numeración ------------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Super Ozono · Informe de actividades · página " + i + " de " + pageCount, PAGE_MARGIN, pageHeight - 8);
  }

  return doc;
}

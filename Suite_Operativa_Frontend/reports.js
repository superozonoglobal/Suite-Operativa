/* =========================================================================
   SUPER OZONO — Generador de informes en PDF (100% en el navegador, con jsPDF)
   -------------------------------------------------------------------------
   No hay backend, así que el PDF se arma directamente en el cliente con la
   data ya cargada en memoria y se descarga con doc.save(...) — un archivo
   .pdf real, no una impresión del navegador.
   ========================================================================= */

(function (global) {
  const PAGE_MARGIN = 15;
  const ROW_H = 6;

  function fmtDate(dstr) {
    if (!dstr) return "—";
    const d = new Date(dstr + "T00:00:00");
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Filtra las tareas según rol, estado y rango de fechas (por fecha límite).
  function filterTasks(db, opts) {
    let tasks = db.tasks.slice();
    if (opts.roleFilter) tasks = tasks.filter((t) => t.roleId === opts.roleFilter);
    if (opts.statusFilter) tasks = tasks.filter((t) => t.status === opts.statusFilter);
    if (opts.fromDate) tasks = tasks.filter((t) => t.dueDate && t.dueDate >= opts.fromDate);
    if (opts.toDate) tasks = tasks.filter((t) => t.dueDate && t.dueDate <= opts.toDate);
    return tasks;
  }

  function buildActivityReportDoc(db, opts) {
    opts = opts || {};
    const { jsPDF } = global.jspdf;
    const OZONO = global.OZONO;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = PAGE_MARGIN;

    function checkBreak(needed) {
      if (y + needed > pageHeight - PAGE_MARGIN) {
        doc.addPage();
        y = PAGE_MARGIN;
        return true;
      }
      return false;
    }

    // ---- Encabezado con logo -------------------------------------------
    if (global.OZONO_LOGO_DATA_URI) {
      try {
        doc.addImage(global.OZONO_LOGO_DATA_URI, "PNG", PAGE_MARGIN, y, 22, 22);
      } catch (e) {
        /* si el navegador no puede decodificar la imagen, el informe sigue sin logo */
      }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Informe de actividades", PAGE_MARGIN + 28, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Super Ozono — Suite operativa", PAGE_MARGIN + 28, y + 16);
    y += 32;

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    const now = new Date();
    doc.text("Generado: " + now.toLocaleString("es-MX") + (opts.generatedByName ? " · por " + opts.generatedByName : ""), PAGE_MARGIN, y);
    y += 5;
    let rangeLabel = "Todas las fechas";
    if (opts.fromDate || opts.toDate) rangeLabel = "Del " + (opts.fromDate ? fmtDate(opts.fromDate) : "—") + " al " + (opts.toDate ? fmtDate(opts.toDate) : "—");
    let filterLabel = "Rango: " + rangeLabel;
    if (opts.roleFilter) filterLabel += "  ·  Rol: " + OZONO.getRole(opts.roleFilter).name;
    if (opts.statusFilter) filterLabel += "  ·  Estado: " + OZONO.STATUS_COLUMNS.find((c) => c.id === opts.statusFilter).label;
    doc.text(filterLabel, PAGE_MARGIN, y);
    y += 10;

    const tasks = filterTasks(db, opts);

    // ---- Resumen por rol / cargo ----------------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumen por rol / cargo", PAGE_MARGIN, y);
    y += 8;

    const rolesInPlay = OZONO.ROLES.filter((r) => tasks.some((t) => t.roleId === r.id));
    const colX = [PAGE_MARGIN, PAGE_MARGIN + 55, PAGE_MARGIN + 85, PAGE_MARGIN + 115, PAGE_MARGIN + 145, PAGE_MARGIN + 165];
    const headers = ["Rol", "Por Hacer", "En Proceso", "En Revisión", "Aprobado", "Total"];

    function drawRow(cells, bold) {
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
        const roleTasks = tasks.filter((t) => t.roleId === r.id);
        const counts = OZONO.STATUS_COLUMNS.map((c) => roleTasks.filter((t) => t.status === c.id).length);
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
      const rolesForDetail = opts.roleFilter ? [OZONO.getRole(opts.roleFilter)] : OZONO.ROLES.filter((r) => tasks.some((t) => t.roleId === r.id));

      rolesForDetail.forEach((r) => {
        const roleTasks = tasks.filter((t) => t.roleId === r.id);
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
          const assignee = OZONO.getUser(db, t.assigneeId);
          const statusLabel = OZONO.STATUS_COLUMNS.find((c) => c.id === t.status)?.label || t.status;
          const title = t.title.length > 42 ? t.title.slice(0, 40) + "…" : t.title;
          doc.text(title, detailColX[0], y);
          doc.text(assignee ? assignee.name : "—", detailColX[1], y);
          doc.text(statusLabel, detailColX[2], y);
          doc.text(fmtDate(t.dueDate), detailColX[3], y);
          y += ROW_H;
        });
        y += 3;
      });
    }

    // ---- Pie de página con numeración ------------------------------------
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("Super Ozono · Informe de actividades · página " + i + " de " + pageCount, PAGE_MARGIN, pageHeight - 8);
    }

    return doc;
  }

  function downloadActivityReport(db, opts) {
    const doc = buildActivityReportDoc(db, opts);
    const today = new Date().toISOString().slice(0, 10);
    doc.save("informe-super-ozono-" + today + ".pdf");
  }

  global.OZONO_REPORTS = {
    filterTasks,
    buildActivityReportDoc,
    downloadActivityReport,
  };
})(window);

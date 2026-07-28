import { describe, it, expect } from "vitest";
import { filterTasks, type ReportTask } from "@/lib/reports/filterTasks";

const tasks: ReportTask[] = [
  { title: "A", roleTag: "DISENADOR", status: "DONE", dueDate: "2026-07-10", assignee: { name: "Sofía" } },
  { title: "B", roleTag: "COPYWRITING", status: "TODO", dueDate: "2026-07-20", assignee: { name: "Luis" } },
  { title: "C", roleTag: "DISENADOR", status: "PROGRESS", dueDate: null, assignee: null },
];

describe("filterTasks", () => {
  it("returns all tasks with no filters", () => {
    expect(filterTasks(tasks, {})).toHaveLength(3);
  });

  it("filters by roleTag", () => {
    const result = filterTasks(tasks, { roleFilter: "DISENADOR" });
    expect(result.map((t) => t.title)).toEqual(["A", "C"]);
  });

  it("filters by status", () => {
    const result = filterTasks(tasks, { statusFilter: "DONE" });
    expect(result.map((t) => t.title)).toEqual(["A"]);
  });

  it("filters by date range, excluding tasks with no due date", () => {
    const result = filterTasks(tasks, { fromDate: "2026-07-15", toDate: "2026-07-31" });
    expect(result.map((t) => t.title)).toEqual(["B"]);
  });

  it("combines filters", () => {
    const result = filterTasks(tasks, { roleFilter: "DISENADOR", statusFilter: "PROGRESS" });
    expect(result.map((t) => t.title)).toEqual(["C"]);
  });
});

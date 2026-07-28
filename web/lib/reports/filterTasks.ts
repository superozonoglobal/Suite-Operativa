export type ReportTask = {
  title: string;
  roleTag: string | null;
  status: string;
  dueDate: string | Date | null;
  assignee: { name: string } | null;
};

export function filterTasks(
  tasks: ReportTask[],
  opts: { fromDate?: string; toDate?: string; roleFilter?: string; statusFilter?: string }
) {
  let result = tasks;
  if (opts.roleFilter) result = result.filter((t) => t.roleTag === opts.roleFilter);
  if (opts.statusFilter) result = result.filter((t) => t.status === opts.statusFilter);
  if (opts.fromDate) {
    result = result.filter((t) => t.dueDate && toIsoDate(t.dueDate) >= opts.fromDate!);
  }
  if (opts.toDate) {
    result = result.filter((t) => t.dueDate && toIsoDate(t.dueDate) <= opts.toDate!);
  }
  return result;
}

function toIsoDate(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

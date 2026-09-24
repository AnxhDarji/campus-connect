/**
 * Computes the effective lifecycle status of an approved event.
 * The DB `status` field tracks approval workflow (Pending/Approved/Rejected…).
 * This utility derives the time-based lifecycle on top of that.
 *
 * Returns one of: "UPCOMING" | "ONGOING" | "AWAITING_COMPLETION" | "COMPLETED"
 * Returns null if the event is not in an approved/published state.
 */
export function getLifecycleStatus(event) {
  const approvedStatuses = ["Approved", "Published"];
  if (!approvedStatuses.includes(event.status)) return null;

  // If already marked COMPLETED via completion submission
  if (event.completion_status === "COMPLETED") return "COMPLETED";

  const now = new Date();

  // Combine date + time strings into a Date
  const startDT = combineDateAndTime(event.start_date, event.start_time);
  const endDT = combineDateAndTime(event.end_date, event.end_time);

  if (now < startDT) return "UPCOMING";
  if (now >= startDT && now <= endDT) return "ONGOING";
  return "AWAITING_COMPLETION"; // end time passed, no completion yet
}

function combineDateAndTime(dateVal, timeStr) {
  const d = new Date(dateVal);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const indiaTime = Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      h,
      m,
    );
    return new Date(indiaTime - 5.5 * 60 * 60 * 1000);
  }
  return d;
}

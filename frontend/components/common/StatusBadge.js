// Reusable Status Badge Component
// Shows colored pills for Confirmed, Pending, and Cancelled status

export default function StatusBadge({ status }) {
  let badgeClass = "badge-pending";

  if (status === "Confirmed") {
    badgeClass = "badge-confirmed";
  } else if (status === "Cancelled") {
    badgeClass = "badge-cancelled";
  } else {
    badgeClass = "badge-pending";
  }

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
}

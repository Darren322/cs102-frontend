export function stringFormatter(input?: string | null): string {
  if (!input) return "";
  const s = String(input);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatTime(currentDate: string) {
    const date = new Date(`1970-01-01T${currentDate}`);
    return date.toLocaleTimeString("en-SG", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true, // true = 12-hour format with AM/PM
    });
}

export function formatDate(currentDate: string) {
    return new Date(currentDate).toLocaleDateString("en-GB");
}

export function formatDateTime(dtString: any) {
    const date = new Date(dtString);
    const formatted = date.toLocaleString("en-SG", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
    console.log(formatted)
    return formatted
}
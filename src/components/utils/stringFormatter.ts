export function stringFormatter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
export function formatTime(currentDate: string) {
    const date = new Date(`1970-01-01T${currentDate}`);
    return date.toLocaleTimeString("en-SG", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true, // true = 12-hour format with AM/PM
    });
}

export function formatDate(currentDate:string){
    return new Date(currentDate).toLocaleDateString("en-GB");
}
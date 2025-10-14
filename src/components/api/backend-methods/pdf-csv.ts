import { api } from "../axios";


export async function pdfExport(sessionID: any) {
    const response = await api.get(
        `http://localhost:8081/api/generate/${sessionID}?type=pdf`,
        {
            responseType: "blob",
        }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${sessionID}_Attendance.pdf`); // filename
    document.body.appendChild(link);
    link.click();
    link.remove();
    return response;
}
export async function csvExport(sessionID: any) {
    const response = await api.get(
        `http://localhost:8081/api/generate/${sessionID}?type=csv`,
        {
            responseType: "blob",
        }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${sessionID}_Attendance.csv`); // filename
    document.body.appendChild(link);
    link.click();
    link.remove();
    return response;
}
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { updateSingle } from "../api/backend-methods/AttendanceRecord";

interface AttendanceUpdateRequest {
  studentId: string;
  status: string;
  method: string;
  optionalNotes: string;
  recordedBy: string;
}

interface ImportAttendanceButtonProps {
  sessionId: string;
}

const ImportAttendanceButton: React.FC<ImportAttendanceButtonProps> = ({
  sessionId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  /** Handle CSV File Upload */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const records = await parseAttendanceCSV(file);
      console.log("📦 Parsed records:", records);
      const results = await Promise.allSettled(
        records.map(({ studentId, ...rest }) => {
          updateSingle(sessionId, studentId, {
            status: rest.status,
            method: rest.method,
            optionalNotes: rest.optionalNotes,
            recordedBy: rest.recordedBy
          })
            .then(res => console.log(res))
            .catch(err => console.log(err))
        }
        )
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.filter((r) => r.status === "rejected").length;

      alert(
        `Import complete!\nSuccessful: ${successCount}\nFailed: ${failedCount}`
      );
    } catch (err) {
      console.error("CSV Processing Error:", err);
      alert("Failed to process CSV. Please check the console for details.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button
        onClick={handleButtonClick}
        disabled={loading}
        className="ml-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30
                   font-medium rounded-2xl px-4 py-2 backdrop-blur-sm shadow-sm transition-all flex items-center"
      >
        <Upload size={18} className="mr-2" />
        {loading ? "Importing..." : "Import CSV"}
      </Button>
    </>
  );
};

export default ImportAttendanceButton;

const parseAttendanceCSV = async (file: File): Promise<AttendanceUpdateRequest[]> => {
  const csvText = await file.text();
  const lines = csvText.split('\n');
  const csvWithoutTitle = lines.slice(1).join('\n');

  return new Promise((resolve, reject) => {
    Papa.parse(csvWithoutTitle, {
      header: true,
      skipEmptyLines: true,
      encoding: "utf-8",
      complete: (results) => {
        const rows = results.data as any[];
        const getCellValue = (row: any, headerName: string) => {
          const actualHeader = Object.keys(row).find(key => key.trim().toLowerCase() === headerName.toLowerCase());
          return actualHeader ? row[actualHeader] : undefined;
        };

        const validRows = rows.filter((r) => {
          const sid = getCellValue(r, "SID");
          const status = getCellValue(r, "Status");

          return (
            sid &&
            status &&
            !sid.toString().includes("Mean") &&
            !sid.toString().includes("Report")
          );
        });

        const formatted = validRows.map((r) => ({
          studentId: (getCellValue(r, "SID") || "").trim(),
          status: (getCellValue(r, "Status") || "ABSENT").trim(),
          method: (getCellValue(r, "Marking Type") || "MANUAL").trim(),
          optionalNotes: (getCellValue(r, "Remarks") || "").trim(),
          recordedBy: "system",
        }));

        resolve(formatted);
      },
      error: (err: any) => reject(err),
    });
  });
};
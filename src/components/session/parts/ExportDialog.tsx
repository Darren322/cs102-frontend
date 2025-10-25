import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from
    "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File, FileSpreadsheet } from "lucide-react";
export function ExportDialog({ open, onOpenChange, onCSV, onPDF }: {
    open:
    boolean; onOpenChange: (v: boolean) => void; onCSV: () => Promise<void>; onPDF:
    () => Promise<void>;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white
rounded-2xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-medium text-slate-300">Choose
                        your method of exporting.</DialogTitle>
                </DialogHeader>
                <div className="flex space-x-4">
                    <div className="w-[50%]"><Button className="bg-rose-500/20 hover:bgrose-500/30 text-rose-300 border border-rose-400/40 rounded-2xl px-4 py-5 wfull" onClick={onPDF}><File className="w-4 h-4" /> PDF</Button></div>
                    <div className="w-[50%]"><Button className="bg-emerald-500/20
hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40
rounded-2xl px-4 py-5 w-full" onClick={onCSV}><FileSpreadsheet className="w-4
h-4" /> CSV</Button></div>
                </div>
                <DialogFooter className="flex justify-end gap-2">
                    19
                    <Button variant="outline" className="border border-slate-700 textgray-300 hover:bg-slate-800" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
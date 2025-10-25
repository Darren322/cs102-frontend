import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from
    "@/components/ui/select";
import { Input } from "@/components/ui/input";
import * as React from "react";
export function BatchMarkDialog({ open, onOpenChange, onConfirm }: {
    open:
    boolean; onOpenChange: (v: boolean) => void; onConfirm: (status: string, notes:
        string) => Promise<void>;
}) {
    const [status, setStatus] = React.useState("ABSENT");
    const [notes, setNotes] = React.useState("");
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border border-slate-700 text-white
rounded-xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-amber-300">Batch
                        Mark Pending Students</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="flex flex-col space-y-2">
                        <Label className="text-sm text-gray-300">Status to Mark As</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger
                                className="bg-slate-800 border-slate-700 text-white rounded-2xl"><SelectValue
                                    placeholder="Select status" /></SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="PRESENT">Present</SelectItem>
                                <SelectItem value="LATE">Late</SelectItem>
                                <SelectItem value="ABSENT">Absent</SelectItem>
                                <SelectItem value="MEDICAL">Medical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Label className="text-sm text-gray-300">Remarks (Optional)</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Marked absent after 15 mins..." className="bg-slate-800
border-slate-700 text-white rounded-2xl" />
                        18
                    </div>
                </div>
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" className="border border-slate-700 textgray-300 hover:bg-slate-800" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onConfirm(status, notes)} className="bgamber-500/20 hover:bg-amber-500/30 text-amber-300 border borderamber-400/40">Confirm Batch Mark</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
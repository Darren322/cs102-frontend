## CS102 Team 7

### Setting up of frontend

#### Prerequisites
- Node Package Manager (NPM)

#### Setting up of development server
- Route into the application root.
- Run:
  ```bash
  npm install
  npm run dev

#### How to run locally
- When using live recognition, open the app on `http://localhost:5173` (Vite default) and accept camera permissions.
- If running backend on a different host/port, update `baseURL` in `src/components/api/axios.ts`.

#### Features
- Live camera-based recognition with device selection (`CameraSelector`, `LiveRecognition`, `useLiveRecognition` hook)
- Attendance UI and editing experience (live stats, editable rows, per-row drafts) — `src/components/session/AttendancePanel.tsx` and `AttendanceProvider`
- CSV import UI using PapaParse (`src/components/ui/import-csv-button.tsx`) — client-side CSV parsing and record formatting (parses attendance CSVs and prepares update payloads before sending to the backend)

#### Tech stack
- React + TypeScript (Vite)
- Tailwind CSS + shadcn components
- Axios for API calls
- Innovatrics face/auto-capture SDKs and Mediapipe
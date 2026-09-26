
import TopBar from "./components/layout/TopBar";
import BottomControls from "./components/layout/BottomControls";
import CanvasLayout from "./components/canvas/CanvasLayout";
import { usePlaybackEngine } from "./hooks/usePlaybackEngine";

function PlaybackEngine() {
    usePlaybackEngine();
    return null;
}

function App() {
    return (
        <div className="flex min-h-dvh flex-col bg-slate-950 text-white">
            <PlaybackEngine />
            <TopBar />
            <CanvasLayout className="mx-auto max-w-7xl sm:px-8" />
            <BottomControls />
        </div>
    );
}

export default App;

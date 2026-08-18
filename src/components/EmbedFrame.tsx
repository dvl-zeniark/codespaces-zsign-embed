import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconMonitor, IconSmartphone, IconTablet, IconExpand } from "@/components/icons";

type Props = {
  src: string;
  title?: string;
  placeholder?: string;
};

const PRESETS = [
  { id: "desktop", label: "Desktop", icon: IconMonitor, width: 960, height: 840 },
  { id: "tablet", label: "Tablet", icon: IconTablet, width: 768, height: 640 },
  { id: "mobile", label: "Mobile", icon: IconSmartphone, width: 390, height: 700 },
  { id: "compact", label: "Compact", icon: IconExpand, width: 360, height: 520 },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

export function EmbedFrame({
  src,
  title = "Offer workspace",
  placeholder = "Loading the offer workspace...",
}: Props) {
  const [preset, setPreset] = useState<PresetId | null>("desktop");
  const [width, setWidth] = useState<number>(PRESETS[0].width);
  const [height, setHeight] = useState<number>(PRESETS[0].height);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const resizingByHandle = useRef(false);

  useEffect(() => {
    if (!preset) return;
    const match = PRESETS.find((p) => p.id === preset);
    if (match) {
      setWidth(match.width);
      setHeight(match.height);
    }
  }, [preset]);

  // The browser's native corner drag-handle (Tailwind `resize`) changes the
  // box's layout size directly; sync that back into width/height state and
  // drop the active preset so the buttons no longer show a stale selection.
  useEffect(() => {
    const el = frameBoxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!resizingByHandle.current) return;
      const { width: w, height: h } = entry.contentRect;
      setWidth(Math.round(w));
      setHeight(Math.round(h));
      setPreset(null);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onMouseUp() {
      resizingByHandle.current = false;
    }
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  function applyPreset(id: PresetId) {
    const match = PRESETS.find((p) => p.id === id);
    if (!match) return;
    setPreset(id);
    setWidth(match.width);
    setHeight(match.height);
  }

  if (!src) {
    return <p className="text-sm text-zinc-500">{placeholder}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-600">Frame size</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                preset === p.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              <p.icon size={13} />
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
          <Label htmlFor="frame-w" className="text-xs text-zinc-500">W</Label>
          <Input
            id="frame-w"
            type="number"
            min={280}
            max={1600}
            step={10}
            value={width}
            onChange={(e) => {
              setPreset(null);
              setWidth(Number(e.target.value));
            }}
            className="h-8 w-20 text-xs"
          />
          <Label htmlFor="frame-h" className="text-xs text-zinc-500">H</Label>
          <Input
            id="frame-h"
            type="number"
            min={320}
            max={1200}
            step={10}
            value={height}
            onChange={(e) => {
              setPreset(null);
              setHeight(Number(e.target.value));
            }}
            className="h-8 w-20 text-xs"
          />
          <span className="text-xs text-zinc-500">{width} x {height} px</span>
        </div>
      </div>
      <div className="flex justify-center overflow-x-auto rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3">
        <div
          ref={frameBoxRef}
          onMouseDown={() => {
            resizingByHandle.current = true;
          }}
          className="shrink-0 resize overflow-auto rounded-md border border-zinc-300 bg-white shadow-sm"
          style={{ width, height, maxWidth: "100%", minWidth: 280, minHeight: 320 }}
        >
          <iframe
            title={title}
            src={src}
            className="block h-full w-full border-0"
            allow="clipboard-write"
          />
        </div>
      </div>
      <p className="text-[11px] text-zinc-400">
        Drag the bottom-right corner of the frame to resize it freely.
      </p>
    </div>
  );
}

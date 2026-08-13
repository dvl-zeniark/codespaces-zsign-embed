"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  src: string;
  title?: string;
};

const PRESETS = [
  { id: "desktop", label: "Desktop", width: 960, height: 840 },
  { id: "tablet", label: "Tablet", width: 768, height: 640 },
  { id: "mobile", label: "Mobile", width: 390, height: 700 },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

export function EmbedFrame({ src, title = "Offer workspace" }: Props) {
  const [preset, setPreset] = useState<PresetId>("desktop");
  const [width, setWidth] = useState<number>(PRESETS[0].width);
  const [height, setHeight] = useState<number>(PRESETS[0].height);

  useEffect(() => {
    const match = PRESETS.find((p) => p.id === preset);
    if (match) {
      setWidth(match.width);
      setHeight(match.height);
    }
  }, [preset]);

  function applyPreset(id: PresetId) {
    const match = PRESETS.find((p) => p.id === id);
    if (!match) return;
    setPreset(id);
    setWidth(match.width);
    setHeight(match.height);
  }

  if (!src) {
    return (
      <p className="text-sm text-zinc-500">Loading the offer workspace...</p>
    );
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
              className={`rounded-md px-2 py-1 text-xs ${
                preset === p.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
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
              setPreset("desktop");
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
              setPreset("desktop");
              setHeight(Number(e.target.value));
            }}
            className="h-8 w-20 text-xs"
          />
          <span className="text-xs text-zinc-500">{width} x {height} px</span>
        </div>
      </div>
      <div className="flex justify-center overflow-x-auto rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3">
        <div
          className="shrink-0 overflow-hidden rounded-md border border-zinc-300 bg-white shadow-sm"
          style={{ width, height, maxWidth: "100%" }}
        >
          <iframe
            title={title}
            src={src}
            className="block h-full w-full border-0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  );
}

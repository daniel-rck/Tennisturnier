import { useEffect, useRef, useState } from "react";
import { ringBellOnce, startBellLoop, stopBell, unlockAudio } from "../bell";
import { type TranslationKey, useTranslation } from "../i18n";
import type { BellVariant } from "../types";
import { NumberInput } from "./ui/NumberInput";

interface Props {
  minutes: number;
  onMinutesChange: (n: number) => void;
  bellVariant: BellVariant;
  onBellVariantChange: (v: BellVariant) => void;
}

const BELL_KEYS: Record<BellVariant, TranslationKey> = {
  classic: "bell.classic",
  boxing: "bell.boxing",
  alarm: "bell.alarm",
  temple: "bell.temple",
};

const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export function RoundTimer({ minutes, onMinutesChange, bellVariant, onBellVariantChange }: Props) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [ringing, setRinging] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const rangRef = useRef(false);
  const variantRef = useRef(bellVariant);
  variantRef.current = bellVariant;

  useEffect(() => {
    if (!running) setRemaining(minutes * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes, running]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (endAtRef.current == null) return;
      const rem = (endAtRef.current - Date.now()) / 1000;
      setRemaining(rem);
      if (rem <= 0 && !rangRef.current) {
        rangRef.current = true;
        startBellLoop(variantRef.current);
        setRinging(true);
        setRunning(false);
        endAtRef.current = null;
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => () => stopBell(), []);

  const start = () => {
    unlockAudio();
    rangRef.current = false;
    const base = remaining > 0 ? remaining : minutes * 60;
    endAtRef.current = Date.now() + base * 1000;
    setRemaining(base);
    setRunning(true);
  };
  const pause = () => {
    setRunning(false);
    endAtRef.current = null;
  };
  const silence = () => {
    stopBell();
    setRinging(false);
  };
  const reset = () => {
    silence();
    setRunning(false);
    endAtRef.current = null;
    rangRef.current = false;
    setRemaining(minutes * 60);
  };

  const expired = remaining <= 0 && !running;

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      {ringing && (
        <button
          type="button"
          onClick={silence}
          className="w-full sm:hidden rounded-md bg-danger-fg px-4 py-4 text-base text-white font-semibold hover:opacity-90 animate-pulse min-h-[60px] mb-3"
        >
          {t("timer.silence")}
        </button>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={
            "font-mono text-3xl 2xl:text-5xl tabular-nums " +
            (expired ? "text-danger-fg" : "text-fg")
          }
          aria-live="polite"
        >
          {fmt(remaining)}
        </div>
        <div className="flex flex-wrap gap-2">
          {ringing ? (
            <button
              type="button"
              onClick={silence}
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-danger-fg px-4 py-2 text-sm text-white font-medium hover:opacity-90 animate-pulse min-w-[8rem] min-h-[44px]"
            >
              {t("timer.silence")}
            </button>
          ) : !running ? (
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center justify-center rounded-md bg-brand px-3 py-2 text-sm text-white font-medium hover:bg-brand-hover min-w-[6rem] min-h-[44px]"
            >
              {remaining > 0 && remaining < minutes * 60 ? t("timer.continue") : t("timer.start")}
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="inline-flex items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-sm text-white font-medium hover:bg-amber-600 min-w-[6rem] min-h-[44px]"
            >
              {t("timer.pause")}
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md border border-border-strong px-3 py-2 text-sm hover:border-fg-muted min-w-[5rem] min-h-[44px]"
          >
            {t("timer.reset")}
          </button>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              void ringBellOnce(bellVariant);
            }}
            disabled={ringing}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-border-strong px-3 py-2 text-sm hover:border-fg-muted disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            title={t("timer.testTitle")}
            aria-label={t("timer.testTitle")}
          >
            <span aria-hidden>🔔</span>
            <span className="hidden sm:inline">{t("timer.test")}</span>
          </button>
        </div>
        <div className="flex-1" />
        <label className="text-sm text-fg-muted flex items-center gap-2">
          {t("timer.bell")}
          <select
            value={bellVariant}
            onChange={(e) => onBellVariantChange(e.target.value as BellVariant)}
            className="rounded-md border border-border-strong bg-surface px-2 py-1 text-sm min-h-[40px]"
          >
            {(Object.keys(BELL_KEYS) as BellVariant[]).map((v) => (
              <option key={v} value={v}>
                {t(BELL_KEYS[v])}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="timer-duration" className="text-sm text-fg-muted flex items-center gap-2">
          {t("timer.duration")}
          <NumberInput
            id="timer-duration"
            value={minutes}
            min={1}
            max={120}
            disabled={running}
            onChange={onMinutesChange}
            className="w-16 rounded-md border border-border-strong px-2 py-1 min-h-[40px] disabled:bg-surface-sunken"
          />
          {t("timer.minutes")}
        </label>
      </div>
      {ringing && (
        <p className="mt-2 text-sm text-danger-fg font-medium">{t("timer.expired.ringing")}</p>
      )}
      {expired && !ringing && (
        <p className="mt-2 text-sm text-danger-fg">{t("timer.expired.idle")}</p>
      )}
    </div>
  );
}

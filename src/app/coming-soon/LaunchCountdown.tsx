"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownValue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

const EMPTY_COUNTDOWN: CountdownValue = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  complete: false,
};

function getCountdown(targetTime: number): CountdownValue {
  const difference = Math.max(0, targetTime - Date.now());

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
    complete: difference === 0,
  };
}

export default function LaunchCountdown({ target }: { target: string }) {
  const targetTime = useMemo(() => new Date(target).getTime(), [target]);
  const [countdown, setCountdown] = useState<CountdownValue | null>(null);

  useEffect(() => {
    const updateCountdown = () => setCountdown(getCountdown(targetTime));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1_000);

    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (countdown?.complete) {
    return (
      <div className="launch-final-review" role="status">
        <span className="launch-final-review-label">Target reached</span>
        <strong>Final release review is in progress.</strong>
        <span>Public access opens after the launch checklist passes.</span>
      </div>
    );
  }

  const values = countdown ?? EMPTY_COUNTDOWN;
  const units = [
    ["Days", values.days],
    ["Hours", values.hours],
    ["Minutes", values.minutes],
    ["Seconds", values.seconds],
  ] as const;

  return (
    <div className="launch-countdown" aria-label="Time remaining until the founding free public beta target" role="timer">
      {units.map(([label, value]) => (
        <div className="launch-countdown-unit" key={label}>
          <strong suppressHydrationWarning>{countdown ? String(value).padStart(2, "0") : "--"}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

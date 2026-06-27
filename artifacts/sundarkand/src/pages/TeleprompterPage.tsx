import { useEffect, useRef, useState, useCallback } from "react";
import {
  parts, partOffsets, TOTAL_DURATION_MS, borderDohas,
  Part, PartBody,
} from "@/data/sundarkand";

function formatTime(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Determine which part is active at a given elapsed ms */
function activePart(elapsedMs: number): number {
  for (let i = parts.length - 1; i >= 0; i--) {
    if (elapsedMs >= partOffsets[i]) return i;
  }
  return 0;
}

// ─── Body renderers ───────────────────────────────────────────
function SundarkandBody({ body }: { body: Extract<PartBody, { kind: "sundarkand" }> }) {
  return (
    <>
      <div className="tp-divider">❧ ❧ ❧</div>
      {body.sections.map((section, si) => (
        <div key={si} className="tp-section">
          <div className="tp-chaupais">
            {section.chaupaiPlaceholders.map((text, ci) => (
              <div key={ci} className="tp-chaupai">{text}</div>
            ))}
          </div>
          <div className="tp-doha-block">
            <div className="tp-doha-block__label">॥ दोहा {section.doha.number} ॥</div>
            <div className="tp-doha-block__text">{section.doha.text}</div>
          </div>
        </div>
      ))}
      <div className="tp-samapti">
        <div className="tp-samapti__line">॥ इति श्रीमद्रामचरितमानसे सकलकलिकलुषविध्वंसने</div>
        <div className="tp-samapti__line">पञ्चमः सोपानः समाप्तः ॥</div>
        <div className="tp-samapti__sub">सुन्दरकाण्ड सम्पूर्ण</div>
        <div className="tp-samapti__jay">जय श्री राम ॥ जय हनुमान ॥</div>
      </div>
    </>
  );
}

function ChalisaBody({ body }: { body: Extract<PartBody, { kind: "chalisa" }> }) {
  return (
    <div className="tp-chalisa-verses">
      {body.verses.map((v, i) => {
        const isDoha = v.startsWith("दोहा");
        return (
          <div key={i} className={isDoha ? "tp-doha-block tp-doha-block--chalisa" : "tp-chaupai"}>
            {isDoha
              ? <div className="tp-doha-block__text">{v}</div>
              : v}
          </div>
        );
      })}
      <div className="tp-samapti__jay" style={{ marginTop: "2rem" }}>
        ॥ श्री हनुमान चालीसा समाप्त ॥
      </div>
    </div>
  );
}

function AartiBody({ body, title }: { body: Extract<PartBody, { kind: "aarti" }>; title: string }) {
  return (
    <div className="tp-aarti-verses">
      {body.verses.map((v, i) => (
        <div key={i} className="tp-aarti-verse">{v}</div>
      ))}
      <div className="tp-samapti__jay" style={{ marginTop: "2rem" }}>
        ॥ {title} समाप्त ॥
      </div>
    </div>
  );
}

function BajrangBody({ body }: { body: Extract<PartBody, { kind: "bajrangbaan" }> }) {
  return (
    <div className="tp-bajrang-body">
      {body.sections.map((sec, si) => (
        <div key={si} className="tp-bajrang-section">
          <div className="tp-bajrang-label">॥ {sec.label} ॥</div>
          {sec.verses.map((v, vi) => (
            <div key={vi} className="tp-chaupai">{v}</div>
          ))}
        </div>
      ))}
      <div className="tp-samapti__jay" style={{ marginTop: "2rem", color: "#FF5252" }}>
        ॥ बजरंग बाण समाप्त ॥
      </div>
    </div>
  );
}

function PartContent({ part }: { part: Part }) {
  const body = part.body;
  switch (body.kind) {
    case "sundarkand":   return <SundarkandBody body={body} />;
    case "chalisa":      return <ChalisaBody body={body} />;
    case "aarti":        return <AartiBody body={body} title={part.title} />;
    case "bajrangbaan":  return <BajrangBody body={body} />;
  }
}

// ─── Main component ───────────────────────────────────────────
export default function TeleprompterPage() {
  const scrollRef     = useRef<HTMLDivElement>(null);
  const startTimeRef  = useRef<number | null>(null);
  const posAtPauseRef = useRef<number>(0);   // position (0..TOTAL_DURATION_MS) at last pause/flip
  const rafRef        = useRef<number>(0);
  const speedRef      = useRef(1);
  const positionRef   = useRef(0);           // live position between renders
  const dirRef        = useRef<1 | -1>(1);   // +1 = scrolling DOWN, -1 = scrolling UP

  const [playing,   setPlaying]   = useState(false);
  const [position,  setPosition]  = useState(0);   // 0..TOTAL_DURATION_MS
  const [direction, setDirection] = useState<1 | -1>(1);
  const [speed,     setSpeed]     = useState(1);
  const [borderIdx, setBorderIdx] = useState(0);
  const [passCount, setPassCount] = useState(0);    // how many full passes completed

  speedRef.current   = speed;
  positionRef.current = position;

  const activeIdx = activePart(position);
  const activePt  = parts[activeIdx];
  const partStart = partOffsets[activeIdx];
  const partElap  = Math.min(position - partStart, activePt.durationSec * 1000);

  // Rotate border dohas every 30s during Sundarkand
  useEffect(() => {
    if (!playing || activeIdx !== 0) return;
    const id = setInterval(() => setBorderIdx(i => (i + 1) % borderDohas.length), 30_000);
    return () => clearInterval(id);
  }, [playing, activeIdx]);

  const animate = useCallback(() => {
    if (startTimeRef.current === null) return;

    const delta = (performance.now() - startTimeRef.current) * speedRef.current;
    const raw   = posAtPauseRef.current + delta * dirRef.current;

    let next = raw;
    let flipped = false;

    if (raw >= TOTAL_DURATION_MS) {
      // Hit the bottom — bounce back up
      next    = TOTAL_DURATION_MS;
      flipped = true;
      dirRef.current      = -1;
      posAtPauseRef.current = TOTAL_DURATION_MS;
      startTimeRef.current  = performance.now();
      setDirection(-1);
      setPassCount(c => c + 1);
    } else if (raw <= 0) {
      // Hit the top — start going down again
      next    = 0;
      flipped = true;
      dirRef.current      = 1;
      posAtPauseRef.current = 0;
      startTimeRef.current  = performance.now();
      setDirection(1);
      setPassCount(c => c + 1);
    }

    positionRef.current = next;
    setPosition(next);

    const el = scrollRef.current;
    if (el) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = maxScroll * (next / TOTAL_DURATION_MS);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (playing) {
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(animate);
    } else {
      if (startTimeRef.current !== null) {
        posAtPauseRef.current = positionRef.current;
      }
      cancelAnimationFrame(rafRef.current);
      startTimeRef.current = null;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, animate]);

  const handlePlayPause = () => setPlaying(p => !p);

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPosition(0);
    setDirection(1);
    setPassCount(0);
    posAtPauseRef.current = 0;
    positionRef.current   = 0;
    dirRef.current        = 1;
    startTimeRef.current  = null;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const changeSpeed = (s: number) => {
    if (playing && startTimeRef.current !== null) {
      posAtPauseRef.current = positionRef.current;
      startTimeRef.current  = performance.now();
    }
    setSpeed(s);
    speedRef.current = s;
  };

  const doha      = borderDohas[borderIdx];
  const dohaLines = doha.text.split("—").map(s => s.trim());

  // Border content: show doha during Sundarkand, else part title
  const borderLabel = activeIdx === 0
    ? `॥ दोहा ${doha.number} ॥`
    : `॥ ${activePt.title} ॥`;
  const borderText = activeIdx === 0
    ? doha.text
    : activePt.headerLines[0];

  const dirArrow   = direction === 1 ? "↓" : "↑";
  const dirLabel   = direction === 1 ? "आगे" : "वापस";

  return (
    <div className="tp-root">

      {/* ── TOP BORDER ── */}
      <div className="tp-border tp-border--top" style={{ borderColor: activePt.accentColor }}>
        <span className="tp-border__num" style={{ color: activePt.accentColor }}>{borderLabel}</span>
        <span className="tp-border__text">{borderText}</span>
      </div>

      {/* ── MIDDLE ── */}
      <div className="tp-middle">

        {/* LEFT BORDER */}
        <div className="tp-border tp-border--side tp-border--left" style={{ borderColor: activePt.accentColor }}>
          <div className="tp-border__side-inner">
            <span className="tp-border__num tp-border__num--vert" style={{ color: activePt.accentColor }}>
              {borderLabel}
            </span>
            {activeIdx === 0
              ? dohaLines.map((line, i) => (
                  <span key={i} className="tp-border__text tp-border__text--vert">{line}</span>
                ))
              : activePt.headerLines.map((line, i) => (
                  <span key={i} className="tp-border__text tp-border__text--vert">{line}</span>
                ))
            }
          </div>
        </div>

        {/* MAIN SCROLL */}
        <div className="tp-scroll" ref={scrollRef}>
          <div className="tp-content">

            {/* All parts rendered sequentially in one scroll container */}
            {parts.map((part, pi) => (
              <div key={part.id} className="tp-part">
                {/* Part header */}
                <div
                  className="tp-part__header"
                  style={{ borderColor: part.accentColor }}
                >
                  <div className="tp-part__badge" style={{ background: part.accentColor }}>
                    {pi + 1}
                  </div>
                  <div className="tp-part__info">
                    <div className="tp-part__title" style={{ color: part.accentColor }}>
                      {part.title}
                    </div>
                    <div className="tp-part__meta">
                      {part.subtitle} — मानक समय: {formatSec(part.durationSec)}
                    </div>
                  </div>
                </div>

                {/* Mangalacharan / opening lines */}
                <div className="tp-mangal">
                  {part.headerLines.map((line, li) => (
                    <div
                      key={li}
                      className={
                        pi === 0 && li === 2 ? "tp-mangal__kand" :
                        pi === 0 && li === 0 ? "tp-mangal__ganesh" :
                        "tp-mangal__subtitle"
                      }
                      style={li === 0 && pi > 0 ? { color: part.accentColor, fontSize: "1.3rem", fontWeight: 700 } : {}}
                    >
                      {line}
                    </div>
                  ))}
                </div>

                {/* Part body */}
                <PartContent part={part} />

                {/* Part separator */}
                {pi < parts.length - 1 && (
                  <div className="tp-part-sep">
                    <span style={{ color: parts[pi + 1].accentColor }}>
                      ❧ अगला: {parts[pi + 1].title} ❧
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Final samapti */}
            <div className="tp-samapti tp-samapti--final">
              <div className="tp-samapti__sub">॥ सम्पूर्ण पाठ समाप्त ॥</div>
              <div className="tp-samapti__jay">जय श्री राम ॥ जय हनुमान ॥</div>
            </div>

          </div>
        </div>

        {/* RIGHT BORDER */}
        <div className="tp-border tp-border--side tp-border--right" style={{ borderColor: activePt.accentColor }}>
          <div className="tp-border__side-inner">
            <span className="tp-border__num tp-border__num--vert" style={{ color: activePt.accentColor }}>
              {borderLabel}
            </span>
            {activeIdx === 0
              ? dohaLines.map((line, i) => (
                  <span key={i} className="tp-border__text tp-border__text--vert">{line}</span>
                ))
              : activePt.headerLines.map((line, i) => (
                  <span key={i} className="tp-border__text tp-border__text--vert">{line}</span>
                ))
            }
          </div>
        </div>

      </div>

      {/* ── BOTTOM BORDER ── */}
      <div className="tp-border tp-border--bottom" style={{ borderColor: activePt.accentColor }}>
        <span className="tp-border__num" style={{ color: activePt.accentColor }}>{borderLabel}</span>
        <span className="tp-border__text">{borderText}</span>
      </div>

      {/* ── CONTROLS ── */}
      <div className="tp-controls">

        {/* Part tracker row */}
        <div className="tp-part-tracker">
          {parts.map((p, i) => (
            <div
              key={p.id}
              className={`tp-part-pill ${i === activeIdx ? "tp-part-pill--active" : ""}`}
              style={i === activeIdx ? { borderColor: p.accentColor, color: p.accentColor } : {}}
              title={`${p.subtitle} — ${formatSec(p.durationSec)}`}
            >
              {i === activeIdx && <span className="tp-part-pill__dot" style={{ background: p.accentColor }} />}
              {p.subtitle}
            </div>
          ))}
          {/* Direction + pass indicator */}
          {playing && (
            <div className="tp-dir-badge" style={{ color: activePt.accentColor }}>
              {dirArrow} {dirLabel}
              {passCount > 0 && <span className="tp-dir-badge__pass"> · {passCount}</span>}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="tp-timer">
          <span className="tp-dir-arrow" style={{ color: activePt.accentColor }}>{playing ? dirArrow : "⏸"}</span>
          <span className="tp-timer__part" style={{ color: activePt.accentColor }}>
            {activePt.subtitle}:
          </span>
          <span className="tp-timer__elapsed" style={{ color: activePt.accentColor }}>
            {formatTime(partElap)}
          </span>
          <span className="tp-timer__sep">/</span>
          <span className="tp-timer__total">{formatTime(activePt.durationSec * 1000)}</span>
          <span className="tp-timer__divider">|</span>
          <span className="tp-timer__label">स्थिति:</span>
          <span className="tp-timer__elapsed">{formatTime(position)}</span>
          <span className="tp-timer__sep">/</span>
          <span className="tp-timer__total">{formatTime(TOTAL_DURATION_MS)}</span>
        </div>

        {/* Segmented progress bar — shows position needle, not fill */}
        <div className="tp-progress-seg">
          {parts.map((p, i) => {
            const segStart = partOffsets[i];
            const segFill  = Math.min(Math.max(position - segStart, 0), p.durationSec * 1000);
            const segPct   = p.durationSec > 0 ? (segFill / (p.durationSec * 1000)) * 100 : 0;
            const segWidth = (p.durationSec / (TOTAL_DURATION_MS / 1000)) * 100;
            return (
              <div
                key={p.id}
                className="tp-progress-seg__track"
                style={{ flex: `${segWidth} 0 0` }}
                title={`${p.subtitle} (${formatSec(p.durationSec)})`}
              >
                <div
                  className="tp-progress-seg__fill"
                  style={{ width: `${segPct}%`, background: p.accentColor }}
                />
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="tp-btns">
          <button className="tp-btn tp-btn--reset" onClick={handleReset}>⏮ आरंभ</button>
          <button
            className="tp-btn tp-btn--play"
            onClick={handlePlayPause}
            style={{ background: `linear-gradient(135deg, ${activePt.accentColor}CC, ${activePt.accentColor})` }}
          >
            {playing ? "⏸ विराम" : position > 0 ? "▶ जारी रखें" : "▶ प्रारंभ"}
          </button>
          <div className="tp-speed">
            <span className="tp-speed__label">गति:</span>
            {[0.5, 0.75, 1, 1.25, 1.5].map(s => (
              <button
                key={s}
                className={`tp-speed__btn ${speed === s ? "tp-speed__btn--active" : ""}`}
                onClick={() => changeSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";
import {
  parts, partOffsets, TOTAL_DURATION_MS, borderDohas,
  Part, PartBody, type Section,
} from "@/data/sundarkand";
import SceneBackdrop from "@/components/SceneBackdrop";
import { useReaderPrefs, TOTAL_DOHAS } from "@/hooks/useReaderPrefs";
import { sceneForDoha } from "@/data/scenes";

// User-provided recitation audio, keyed by part id. Parts without a
// recorded track (the two aartis, Bajrang Baan) simply have no audio.
const AUDIO_SOURCES: Record<string, string | null> = {
  sundarkand: `${import.meta.env.BASE_URL}audio/sundarkand-path.mp3`,
  chalisa: `${import.meta.env.BASE_URL}audio/hanuman-chalisa.m4a`,
  "hanuman-aarti": null,
  "ram-aarti": null,
  bajrangbaan: null,
};

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

function activePart(elapsedMs: number): number {
  for (let i = parts.length - 1; i >= 0; i--) {
    if (elapsedMs >= partOffsets[i]) return i;
  }
  return 0;
}

// Simple common word mappings for Roman → Devanagari search
const ROMAN_TO_DEVANAGARI_MAP: Record<string, string> = {
  'ram': 'राम', 'raam': 'राम',
  'hanuman': 'हनुमान', 'hanumaan': 'हनुमान',
  'sitaram': 'सीताराम', 'sita': 'सीता',
  'sundar': 'सुन्दर', 'sundara': 'सुन्दर', 'sundarkand': 'सुन्दरकाण्ड',
  'sunahu': 'सुनहु', 'suno': 'सुनो',
  'pawan': 'पवन', 'pavan': 'पवन',
  'putra': 'पुत्र', 'sut': 'सुत',
  'bhavan': 'भवन',
  'milahi': 'मिलहि', 'milayi': 'मिलहि',
  'manahu': 'मानहु',
  'vitap': 'विटप',
  'nutan': 'नूतन',
  'kislay': 'किसलय'
};

function getSearchTerms(query: string): string[] {
  const terms: string[] = [query.toLowerCase()];
  
  // Add common mappings
  Object.entries(ROMAN_TO_DEVANAGARI_MAP).forEach(([roman, devanagari]) => {
    if (query.toLowerCase().includes(roman)) {
      terms.push(devanagari.toLowerCase());
    }
  });

  return terms;
}

function formatDohaText(section: Section): string {
  const lines = [
    `॥ दोहा ${section.doha.number} ॥`,
    section.doha.text,
    ...section.chaupaiPlaceholders,
  ];
  return lines.join("\n");
}

function SundarkandBody({
  body,
  onCopyDoha,
  onShareDoha,
}: {
  body: Extract<PartBody, { kind: "sundarkand" }>;
  onCopyDoha: (section: Section) => void;
  onShareDoha: (section: Section) => void;
}) {
  return (
    <>
      <div className="tp-divider">❧ ❧ ❧</div>
      {body.sections.map((section, si) => (
        <div key={si} data-section id={`doha-${section.doha.number}`} className="tp-section">
          <div className="tp-chaupais">
            {section.chaupaiPlaceholders.map((text, ci) => (
              <div key={ci} className="tp-chaupai">{text}</div>
            ))}
          </div>
          <div className="tp-doha-block">
            <div className="tp-doha-block__header">
              <div className="tp-doha-block__label">॥ दोहा {section.doha.number} ॥</div>
              <div className="tp-doha-actions">
                <button
                  type="button"
                  className="tp-doha-action"
                  title="Copy this doha"
                  aria-label={`Copy doha ${section.doha.number}`}
                  onClick={() => onCopyDoha(section)}
                >
                  📋
                </button>
                <button
                  type="button"
                  className="tp-doha-action"
                  title="Share this doha"
                  aria-label={`Share doha ${section.doha.number}`}
                  onClick={() => onShareDoha(section)}
                >
                  ↗
                </button>
              </div>
            </div>
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
          <div key={i} data-section className={isDoha ? "tp-doha-block tp-doha-block--chalisa" : "tp-chaupai"}>
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
        <div key={i} data-section className="tp-aarti-verse">{v}</div>
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
        <div key={si} data-section className="tp-bajrang-section">
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

function PartContent({
  part,
  onCopyDoha,
  onShareDoha,
}: {
  part: Part;
  onCopyDoha: (section: Section) => void;
  onShareDoha: (section: Section) => void;
}) {
  const body = part.body;
  switch (body.kind) {
    case "sundarkand":   return <SundarkandBody body={body} onCopyDoha={onCopyDoha} onShareDoha={onShareDoha} />;
    case "chalisa":      return <ChalisaBody body={body} />;
    case "aarti":        return <AartiBody body={body} title={part.title} />;
    case "bajrangbaan":  return <BajrangBody body={body} />;
  }
}

export default function TeleprompterPage() {
  const scrollRef          = useRef<HTMLDivElement>(null);
  const startTimeRef       = useRef<number | null>(null);
  const posAtPauseRef      = useRef<number>(0);
  const rafRef             = useRef<number>(0);
  const speedRef           = useRef(1);
  const positionRef        = useRef(0);
  const dirRef             = useRef<1 | -1>(1);
  const manualScrollRef    = useRef(false);
  const manualTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef           = useRef<HTMLAudioElement>(null);

  const [playing,   setPlaying]   = useState(false);
  const [position,  setPosition]  = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [speed,          setSpeed]         = useState(1);
  const [currentDohaNum, setCurrentDohaNum] = useState(1);
  const [passCount,      setPassCount]      = useState(0);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState<any[]>([]);
  const [showResults,    setShowResults]    = useState(false);
  const [copyFeedback,   setCopyFeedback]   = useState("");
  const [showResume,     setShowResume]     = useState(false);
  const [audioPlaying,   setAudioPlaying]   = useState(false);
  const [volume,         setVolume]         = useState(0.85);

  const {
    prefs,
    hasBookmark,
    stepFontSize,
    toggleFontFamily,
    cycleTheme,
    saveBookmark,
    clearBookmark,
  } = useReaderPrefs();

  speedRef.current    = speed;
  positionRef.current = position;

  const activeIdx = activePart(position);
  const activePt  = parts[activeIdx];
  const partStart = partOffsets[activeIdx];
  const partElap  = Math.min(position - partStart, activePt.durationSec * 1000);
  const audioSrc  = AUDIO_SOURCES[activePt.id] ?? null;

  // Recitation audio: independent play/pause control, but the track is
  // swapped automatically as the reader moves between parts, and playback
  // pauses on parts with no recorded audio.
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioSrc) setAudioPlaying(false);
  }, [audioSrc]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;
    if (audioPlaying) {
      el.play().catch(() => setAudioPlaying(false));
    } else {
      el.pause();
    }
  }, [audioPlaying, audioSrc]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateDoha = () => {
      const secs = Array.from(el.querySelectorAll<HTMLElement>('[id^="doha-"]'));
      if (!secs.length) return;
      const top = el.scrollTop + 80;
      let num = 1;
      for (const s of secs) {
        if (s.offsetTop <= top) { const n = parseInt(s.id.replace("doha-", "")); if (!isNaN(n)) num = n; }
        else break;
      }
      setCurrentDohaNum(num);
      saveBookmark(num, el.scrollTop);
    };
    el.addEventListener("scroll", updateDoha, { passive: true });
    return () => el.removeEventListener("scroll", updateDoha);
  }, [saveBookmark]);

  useEffect(() => {
    if (hasBookmark) setShowResume(true);
  }, [hasBookmark]);

  const animate = useCallback(() => {
    if (startTimeRef.current === null) return;

    const delta = (performance.now() - startTimeRef.current) * speedRef.current;
    const raw   = posAtPauseRef.current + delta * dirRef.current;

    let next = raw;

    if (raw >= TOTAL_DURATION_MS) {
      next = TOTAL_DURATION_MS;
      dirRef.current        = -1;
      posAtPauseRef.current = TOTAL_DURATION_MS;
      startTimeRef.current  = performance.now();
      setDirection(-1);
      setPassCount(c => c + 1);
    } else if (raw <= 0) {
      next = 0;
      dirRef.current        = 1;
      posAtPauseRef.current = 0;
      startTimeRef.current  = performance.now();
      setDirection(1);
      setPassCount(c => c + 1);
    }

    positionRef.current = next;
    setPosition(next);

    const el = scrollRef.current;
    if (el && !manualScrollRef.current) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll > 0) {
        // Map position to scroll using per-part content proportions
        const partEls = Array.from(el.querySelectorAll<HTMLElement>('.tp-part'));
        if (partEls.length === parts.length) {
          const idx = activePart(next);
          const partStart = partOffsets[idx];
          const partDur   = parts[idx].durationSec * 1000;
          const partFrac  = partDur > 0 ? Math.min((next - partStart) / partDur, 1) : 0;
          const partEl    = partEls[idx];
          const partTop   = partEl.offsetTop;
          const partH     = partEl.offsetHeight;
          const targetScroll = partTop + partFrac * partH - el.clientHeight * 0.15;
          el.scrollTop = Math.max(0, Math.min(targetScroll, maxScroll));
        } else {
          el.scrollTop = maxScroll * (next / TOTAL_DURATION_MS);
        }
      }
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const syncFromScroll = () => {
      manualScrollRef.current = true;
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
      manualTimerRef.current = setTimeout(() => {
        manualScrollRef.current = false;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll <= 0) return;

        // Map scroll position back to time using per-part content proportions
        const partEls = Array.from(el.querySelectorAll<HTMLElement>('.tp-part'));
        let newPos = 0;
        if (partEls.length === parts.length) {
          const scrollTop = el.scrollTop;
          let bestIdx = 0;
          for (let i = 0; i < partEls.length; i++) {
            if (partEls[i].offsetTop <= scrollTop + el.clientHeight * 0.15) bestIdx = i;
            else break;
          }
          const partEl   = partEls[bestIdx];
          const partTop  = partEl.offsetTop;
          const partH    = partEl.offsetHeight;
          const withinH  = Math.max(0, scrollTop + el.clientHeight * 0.15 - partTop);
          const partFrac = partH > 0 ? Math.min(withinH / partH, 1) : 0;
          newPos = partOffsets[bestIdx] + partFrac * parts[bestIdx].durationSec * 1000;
        } else {
          newPos = (el.scrollTop / maxScroll) * TOTAL_DURATION_MS;
        }

        posAtPauseRef.current = newPos;
        positionRef.current   = newPos;
        setPosition(newPos);
        if (startTimeRef.current !== null) {
          startTimeRef.current = performance.now();
        }
      }, 800);
    };

    el.addEventListener("wheel",      syncFromScroll, { passive: true });
    el.addEventListener("touchmove",  syncFromScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel",     syncFromScroll);
      el.removeEventListener("touchmove", syncFromScroll);
    };
  }, []);

  const jumpToSection = useCallback((delta: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const sections = Array.from(el.querySelectorAll<HTMLElement>("[data-section]"));
    if (!sections.length) return;

    const scrollTop = el.scrollTop;
    const pad = 60;

    let curIdx = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= scrollTop + pad) curIdx = i;
      else break;
    }

    const targetIdx = Math.max(0, Math.min(sections.length - 1, curIdx + delta));
    const targetEl  = sections[targetIdx];
    const newTop    = Math.max(0, targetEl.offsetTop - 20);

    manualScrollRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);

    el.scrollTo({ top: newTop, behavior: "smooth" });

    manualTimerRef.current = setTimeout(() => {
      manualScrollRef.current = false;
      const partEls = Array.from(el.querySelectorAll<HTMLElement>('.tp-part'));
      let newPos = 0;
      if (partEls.length === parts.length) {
        const scrollTop = el.scrollTop;
        let bestIdx = 0;
        for (let i = 0; i < partEls.length; i++) {
          if (partEls[i].offsetTop <= scrollTop + el.clientHeight * 0.15) bestIdx = i;
          else break;
        }
        const partEl   = partEls[bestIdx];
        const partTop  = partEl.offsetTop;
        const partH    = partEl.offsetHeight;
        const withinH  = Math.max(0, scrollTop + el.clientHeight * 0.15 - partTop);
        const partFrac = partH > 0 ? Math.min(withinH / partH, 1) : 0;
        newPos = partOffsets[bestIdx] + partFrac * parts[bestIdx].durationSec * 1000;
      } else {
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) newPos = (el.scrollTop / maxScroll) * TOTAL_DURATION_MS;
      }
      posAtPauseRef.current = newPos;
      positionRef.current   = newPos;
      setPosition(newPos);
      if (startTimeRef.current !== null) startTimeRef.current = performance.now();
    }, 600);
  }, []);

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
    clearBookmark();
    setShowResume(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const copyDoha = useCallback(async (section: Section) => {
    const text = formatDohaText(section);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`दोहा ${section.doha.number} कॉपी हुआ`);
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("कॉपी विफल");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  }, []);

  const shareDoha = useCallback(async (section: Section) => {
    const text = formatDohaText(section);
    const title = `सुन्दरकाण्ड — दोहा ${section.doha.number}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(`दोहा ${section.doha.number} कॉपी हुआ (साझा के लिए)`);
        setTimeout(() => setCopyFeedback(""), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  }, []);

  const resumeReading = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`#doha-${prefs.lastDoha}`);
    const top = target ? Math.max(0, target.offsetTop - 20) : prefs.lastScrollTop;
    manualScrollRef.current = true;
    el.scrollTo({ top, behavior: "smooth" });
    setCurrentDohaNum(prefs.lastDoha);
    setShowResume(false);
    setTimeout(() => { manualScrollRef.current = false; }, 800);
  }, [prefs.lastDoha, prefs.lastScrollTop]);

  const themeLabel =
    prefs.theme === "night" ? "🌙 रात्रि" :
    prefs.theme === "contrast" ? "◐ उच्च कॉन्ट्रास्ट" :
    "🪔 भक्ति";

  const changeSpeed = (s: number) => {
    if (playing && startTimeRef.current !== null) {
      posAtPauseRef.current = positionRef.current;
      startTimeRef.current  = performance.now();
    }
    setSpeed(s);
    speedRef.current = s;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const el = scrollRef.current;
    if (!el) return;

    // First try searching for a doha number (like "1", "5", "1क")
    let targetEl = el.querySelector<HTMLElement>(`#doha-${query}`);

    // If no doha number match, search all content
    if (!targetEl) {
      const searchTerms = getSearchTerms(query);
      // Search all text in the scroll container - check all elements
      const allElements = el.querySelectorAll<HTMLElement>('*');
      for (const element of allElements) {
        // Check if any text content matches any search term
        const text = element.textContent?.toLowerCase().trim();
        if (text) {
          const matches = searchTerms.some(term => text.includes(term));
          if (matches) {
            // Find a suitable scroll target
            targetEl = element.closest('[data-section]') || 
                       element.closest('.tp-section') || 
                       element.closest('.tp-part') || 
                       element.closest('.tp-chaupai') || 
                       element.closest('.tp-doha-block') || 
                       element;
            break;
          }
        }
      }
    }

    if (targetEl) {
      manualScrollRef.current = true;
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);

      el.scrollTo({ top: targetEl.offsetTop - 20, behavior: "smooth" });

      manualTimerRef.current = setTimeout(() => {
        manualScrollRef.current = false;
        const partEls = Array.from(el.querySelectorAll<HTMLElement>('.tp-part'));
        let newPos = 0;
        if (partEls.length === parts.length) {
          const scrollTop = el.scrollTop;
          let bestIdx = 0;
          for (let i = 0; i < partEls.length; i++) {
            if (partEls[i].offsetTop <= scrollTop + el.clientHeight * 0.15) bestIdx = i;
            else break;
          }
          const partEl   = partEls[bestIdx];
          const partTop  = partEl.offsetTop;
          const partH    = partEl.offsetHeight;
          const withinH  = Math.max(0, scrollTop + el.clientHeight * 0.15 - partTop);
          const partFrac = partH > 0 ? Math.min(withinH / partH, 1) : 0;
          newPos = partOffsets[bestIdx] + partFrac * parts[bestIdx].durationSec * 1000;
        } else {
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll > 0) newPos = (el.scrollTop / maxScroll) * TOTAL_DURATION_MS;
        }
        posAtPauseRef.current = newPos;
        positionRef.current   = newPos;
        setPosition(newPos);
        if (startTimeRef.current !== null) startTimeRef.current = performance.now();
      }, 600);
    }
  };

  // Real-time search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    const query = searchQuery.trim().toLowerCase();
    const searchTerms = getSearchTerms(query);
    const results: any[] = [];

    // Check for doha number match first
    const dohaMatch = el.querySelector(`#doha-${query}`);
    if (dohaMatch) {
      results.push({
        type: 'doha',
        number: query,
        element: dohaMatch,
        text: `Doha ${query}`
      });
    }

    // Check all content
    const allContentElements = el.querySelectorAll('.tp-chaupai, .tp-doha-block__text, .tp-aarti-verse');
    allContentElements.forEach((element, idx) => {
      const text = element.textContent?.toLowerCase();
      if (text) {
        const matches = searchTerms.some(term => text.includes(term));
        if (matches) {
          const parent = element.closest('[data-section]') || element.closest('.tp-section') || element.closest('.tp-part');
          results.push({
            type: 'verse',
            index: idx,
            element: parent || element,
            text: element.textContent?.substring(0, 80) + '...' || ''
          });
        }
      }
    });

    setSearchResults(results.slice(0, 20)); // Limit to 20 results
    setShowResults(true);
  }, [searchQuery]);

  // Jump to a search result
  const jumpToResult = (result: any) => {
    const el = scrollRef.current;
    if (!el || !result.element) return;

    manualScrollRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);

    el.scrollTo({ top: result.element.offsetTop - 20, behavior: "smooth" });
    setShowResults(false);

    manualTimerRef.current = setTimeout(() => {
      manualScrollRef.current = false;
      const partEls = Array.from(el.querySelectorAll<HTMLElement>('.tp-part'));
      let newPos = 0;
      if (partEls.length === parts.length) {
        const scrollTop = el.scrollTop;
        let bestIdx = 0;
        for (let i = 0; i < partEls.length; i++) {
          if (partEls[i].offsetTop <= scrollTop + el.clientHeight * 0.15) bestIdx = i;
          else break;
        }
        const partEl   = partEls[bestIdx];
        const partTop  = partEl.offsetTop;
        const partH    = partEl.offsetHeight;
        const withinH  = Math.max(0, scrollTop + el.clientHeight * 0.15 - partTop);
        const partFrac = partH > 0 ? Math.min(withinH / partH, 1) : 0;
        newPos = partOffsets[bestIdx] + partFrac * parts[bestIdx].durationSec * 1000;
      } else {
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) newPos = (el.scrollTop / maxScroll) * TOTAL_DURATION_MS;
      }
      posAtPauseRef.current = newPos;
      positionRef.current   = newPos;
      setPosition(newPos);
      if (startTimeRef.current !== null) startTimeRef.current = performance.now();
    }, 600);
  };

  const sundarkandSections = parts[0].body.kind === "sundarkand" ? parts[0].body.sections : [];
  const currentSection     = sundarkandSections.find(s => Number(s.doha.number) === currentDohaNum);
  const currentDohaText    = currentSection?.doha.text ?? "";
  const dohaLines          = currentDohaText.split(",").map(s => s.trim());

  const borderLabel = activeIdx === 0
    ? `॥ दोहा ${currentDohaNum} ॥`
    : `॥ ${activePt.title} ॥`;
  const borderText = activeIdx === 0
    ? currentDohaText
    : activePt.headerLines[0];

  const dirArrow = direction === 1 ? "↓" : "↑";
  const dirLabel = direction === 1 ? "आगे" : "वापस";

  return (
    <div
      className={`tp-root tp-theme--${prefs.theme} tp-font--${prefs.fontFamily}`}
      style={{ "--tp-text-scale": prefs.fontSize } as CSSProperties}
    >
      {audioSrc && <audio ref={audioRef} src={audioSrc} onEnded={() => setAudioPlaying(false)} />}

      {activeIdx === 0 && <SceneBackdrop dohaNum={currentDohaNum} />}

      {activeIdx === 0 && (
        <div className="tp-doha-pill" aria-live="polite" aria-atomic="true">
          <span className="tp-doha-pill__num">दोहा {currentDohaNum} / {TOTAL_DOHAS}</span>
          <span className="tp-doha-pill__scene">{sceneForDoha(currentDohaNum).captionHi}</span>
          <div className="tp-doha-pill__bar">
            <div
              className="tp-doha-pill__fill"
              style={{ width: `${Math.round((currentDohaNum / TOTAL_DOHAS) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="tp-border tp-border--top" style={{ borderColor: activePt.accentColor }}>
        <span className="tp-border__num" style={{ color: activePt.accentColor }}>{borderLabel}</span>
        <span className="tp-border__text">{borderText}</span>
      </div>

      <div className="tp-middle">

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

        {/* Credits rendered by App.tsx */}

        <div className="tp-scroll" ref={scrollRef}>
          <div className="tp-content">
          {parts.map((part, pi) => (
            <div key={part.id} className="tp-part">
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

                <PartContent part={part} onCopyDoha={copyDoha} onShareDoha={shareDoha} />

                {pi < parts.length - 1 && (
                  <div className="tp-part-sep">
                    <span style={{ color: parts[pi + 1].accentColor }}>
                      ❧ अगला: {parts[pi + 1].title} ❧
                    </span>
                  </div>
                )}
              </div>
            ))}

            <div className="tp-samapti tp-samapti--final">
              <div className="tp-samapti__sub">॥ सम्पूर्ण पाठ समाप्त ॥</div>
              <div className="tp-samapti__jay">जय श्री राम ॥ जय हनुमान ॥</div>
            </div>
          </div>
        </div>

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

      <div className="tp-border tp-border--bottom" style={{ borderColor: activePt.accentColor }}>
        <span className="tp-border__num" style={{ color: activePt.accentColor }}>{borderLabel}</span>
        <span className="tp-border__text">{borderText}</span>
      </div>

      <div className="tp-controls">

        <div className="tp-audio-bar">
          {audioSrc ? (
            <>
              <button
                type="button"
                className={`tp-audio-btn ${audioPlaying ? "" : "tp-audio-btn--muted"}`}
                onClick={() => setAudioPlaying(p => !p)}
                aria-label={audioPlaying ? "Pause recitation audio" : "Play recitation audio"}
              >
                {audioPlaying ? "⏸ पाठ रोकें" : "🔊 पाठ सुनें"}
              </button>
              <span className="tp-audio-label">{activePt.subtitle} पाठ</span>
              <input
                type="range"
                className="tp-audio-volume"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Recitation volume"
              />
            </>
          ) : (
            <span className="tp-audio-unavailable">इस भाग के लिए ऑडियो उपलब्ध नहीं है</span>
          )}
        </div>

        <div className="tp-reader-toolbar">
          <button type="button" className="tp-reader-btn" onClick={() => stepFontSize(-1)} title="छोटा अक्षर" aria-label="Decrease font size">A−</button>
          <button type="button" className="tp-reader-btn" onClick={() => stepFontSize(1)} title="बड़ा अक्षर" aria-label="Increase font size">A+</button>
          <button type="button" className="tp-reader-btn" onClick={toggleFontFamily} title="फ़ॉन्ट बदलें">
            {prefs.fontFamily === "standard" ? "कलात्मक" : "सामान्य"}
          </button>
          <button type="button" className="tp-reader-btn" onClick={cycleTheme} title="पठन थीम">
            {themeLabel}
          </button>
          {showResume && hasBookmark && (
            <button type="button" className="tp-reader-btn tp-reader-btn--resume" onClick={resumeReading}>
              ↩ दोहा {prefs.lastDoha} से जारी
            </button>
          )}
          {copyFeedback && <span className="tp-copy-feedback">{copyFeedback}</span>}
        </div>

        {activeIdx === 0 && (
          <div className="tp-doha-progress" aria-label={`Reading progress: doha ${currentDohaNum} of ${TOTAL_DOHAS}`}>
            <span className="tp-doha-progress__label">दोहा {currentDohaNum} / {TOTAL_DOHAS}</span>
            <div className="tp-doha-progress__track">
              <div
                className="tp-doha-progress__fill"
                style={{ width: `${(currentDohaNum / TOTAL_DOHAS) * 100}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="tp-search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search: Doha number, word, or phrase (e.g., 1, 5, SUNAHU RAM, सुनहु राम)"
            className="tp-search-input"
            onFocus={() => searchQuery.trim() && setShowResults(true)}
          />
          <button type="submit" className="tp-search-btn">Jump</button>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="tp-search-results">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="tp-search-result-item"
                  onClick={() => jumpToResult(result)}
                >
                  <span className="tp-search-result-icon">
                    {result.type === 'doha' ? '📜' : '📝'}
                  </span>
                  <span className="tp-search-result-text">
                    {result.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {showResults && searchResults.length === 0 && searchQuery.trim() && (
            <div className="tp-search-no-results">
              No matches found for "{searchQuery}"
            </div>
          )}
        </form>

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
          {playing && (
            <div className="tp-dir-badge" style={{ color: activePt.accentColor }}>
              {dirArrow} {dirLabel}
              {passCount > 0 && <span className="tp-dir-badge__pass"> · {passCount}</span>}
            </div>
          )}
        </div>

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

        <div className="tp-btns">
          <button className="tp-btn tp-btn--reset" onClick={handleReset}>⏮ आरंभ</button>
          <button className="tp-btn tp-btn--nav" onClick={() => jumpToSection(-1)} title="पिछला दोहा">◀ पिछला</button>
          <button
            className="tp-btn tp-btn--play"
            onClick={handlePlayPause}
            style={{ background: `linear-gradient(135deg, ${activePt.accentColor}CC, ${activePt.accentColor})` }}
          >
            {playing ? "⏸ विराम" : position > 0 ? "▶ जारी रखें" : "▶ प्रारंभ"}
          </button>
          <button className="tp-btn tp-btn--nav" onClick={() => jumpToSection(1)} title="अगला दोहा">अगला ▶</button>
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

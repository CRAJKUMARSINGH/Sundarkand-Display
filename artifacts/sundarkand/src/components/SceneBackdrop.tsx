import { useEffect, useState } from "react";
import { sceneForDoha, type Scene } from "@/data/scenes";

/**
 * Optional "narrative art" enrichment: cross-fades a contextual illustration
 * for the current doha's place in the Sundarkand story. Purely additive —
 * takes the doha number the page is already tracking and renders a panel;
 * remove <SceneBackdrop /> from TeleprompterPage.tsx to disable it entirely.
 */
export default function SceneBackdrop({ dohaNum }: { dohaNum: number }) {
  const [current, setCurrent]   = useState<Scene>(() => sceneForDoha(dohaNum));
  const [incoming, setIncoming] = useState<Scene | null>(null);

  useEffect(() => {
    const next = sceneForDoha(dohaNum);
    if (next.id !== current.id) {
      setIncoming(next);
      const t = setTimeout(() => {
        setCurrent(next);
        setIncoming(null);
      }, 600); // matches --scene-fade-ms below
      return () => clearTimeout(t);
    }
    return undefined;
  }, [dohaNum, current.id]);

  return (
    <div className="tp-scene-backdrop" aria-hidden="true">
      <img key={current.id} src={current.image} alt="" className="tp-scene-backdrop__img tp-scene-backdrop__img--current" />
      {incoming && (
        <img key={incoming.id} src={incoming.image} alt="" className="tp-scene-backdrop__img tp-scene-backdrop__img--incoming" />
      )}
      <div className="tp-scene-backdrop__caption">
        <span className="tp-scene-backdrop__caption-hi">{(incoming ?? current).captionHi}</span>
        <span className="tp-scene-backdrop__caption-en">{(incoming ?? current).captionEn}</span>
      </div>
    </div>
  );
}

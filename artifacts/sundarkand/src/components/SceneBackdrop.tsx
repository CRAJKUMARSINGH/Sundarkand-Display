import { useEffect, useState } from "react";
import { sceneForDoha, type Scene } from "@/data/scenes";

const BASE = import.meta.env.BASE_URL;

export default function SceneBackdrop({ dohaNum }: { dohaNum: number }) {
  const [current, setCurrent] = useState<Scene>(() => sceneForDoha(dohaNum));
  const [incoming, setIncoming] = useState<Scene | null>(null);

  useEffect(() => {
    const next = sceneForDoha(dohaNum);
    if (next.id !== current.id) {
      setIncoming(next);
      const t = setTimeout(() => { setCurrent(next); setIncoming(null); }, 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [dohaNum, current.id]);

  return (
    <div className="tp-scene-backdrop" aria-hidden="true">
      <img key={current.id} src={`${BASE}${current.image}`} alt="" className="tp-scene-backdrop__img tp-scene-backdrop__img--current" />
      {incoming && <img key={incoming.id} src={`${BASE}${incoming.image}`} alt="" className="tp-scene-backdrop__img tp-scene-backdrop__img--incoming" />}
      <div className="tp-scene-backdrop__caption">
        <span className="tp-scene-backdrop__caption-hi">{(incoming ?? current).captionHi}</span>
        <span className="tp-scene-backdrop__caption-en">{(incoming ?? current).captionEn}</span>
      </div>
    </div>
  );
}
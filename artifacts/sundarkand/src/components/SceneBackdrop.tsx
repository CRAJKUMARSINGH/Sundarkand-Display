import { useEffect, useState } from "react";
import { sceneForDoha, scenes, type Scene } from "@/data/scenes";

const BASE = import.meta.env.BASE_URL;

export default function SceneBackdrop({ dohaNum }: { dohaNum: number }) {
  const [current, setCurrent] = useState<Scene>(() => sceneForDoha(dohaNum));
  const [nextScene, setNextScene] = useState<Scene | null>(null);

  useEffect(() => {
    const currentScene = sceneForDoha(dohaNum);
    setCurrent(currentScene);
    
    // Find the next scene in the sequence
    const currentIndex = scenes.findIndex(s => s.id === currentScene.id);
    if (currentIndex !== -1 && currentIndex < scenes.length - 1) {
      setNextScene(scenes[currentIndex + 1]);
    } else {
      setNextScene(null);
    }
  }, [dohaNum]);

  return (
    <div className="tp-scene-backdrop" aria-hidden="true">
      <div className="tp-scene-backdrop__images">
        <div className="tp-scene-backdrop__image-container tp-scene-backdrop__image-container--left">
          <img key={current.id} src={`${BASE}${current.image}`} alt="" className="tp-scene-backdrop__img" />
          <div className="tp-scene-backdrop__caption tp-scene-backdrop__caption--left">
            <span className="tp-scene-backdrop__caption-hi">{current.captionHi}</span>
            <span className="tp-scene-backdrop__caption-en">{current.captionEn}</span>
          </div>
        </div>
        {nextScene && (
          <div className="tp-scene-backdrop__image-container tp-scene-backdrop__image-container--right">
            <img key={nextScene.id} src={`${BASE}${nextScene.image}`} alt="" className="tp-scene-backdrop__img" />
            <div className="tp-scene-backdrop__caption tp-scene-backdrop__caption--right">
              <span className="tp-scene-backdrop__caption-hi">{nextScene.captionHi}</span>
              <span className="tp-scene-backdrop__caption-en">{nextScene.captionEn}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
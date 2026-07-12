import TeleprompterPage from "@/pages/TeleprompterPage";

const authorImageSrc = `${import.meta.env.BASE_URL}author.jpg`;

function AppCredit() {
  return (
    <aside className="tp-credits" aria-label="Application credit">
      <img
        src={authorImageSrc}
        alt="Rajkumar Arthuna"
        className="tp-credits-photo"
      />
      <div className="tp-credits-title">An effort by humble Rambhakt-</div>
      <div className="tp-credits-name">राजकुमार अरथुना</div>
      <div className="tp-credits-message">🌺 🙏 सीताराम 🙏 🌺</div>
    </aside>
  );
}

export default function App() {
  return (
    <>
      <TeleprompterPage />
      <AppCredit />
    </>
  );
}

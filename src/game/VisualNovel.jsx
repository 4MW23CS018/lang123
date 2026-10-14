import React, { useState } from "react";
import { BookOpen, MapPin, Volume2, Languages, Sparkles, Gem, RotateCcw } from "lucide-react";
import { chapter01 } from "./data/chapter01";
import { SceneEngine, validateChapter } from "./SceneEngine";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";
import { useLanguage } from "../components/hooks/useLanguage";
import "./visual-novel.css";

const SAVE_KEY = "langbridge.vn.chapter01.v1";
function readSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"); }
  catch { return {}; }
}

function Character({ character, active }) {
  const expression = character.expression || "neutral";
  return <div className={`vn-char vn-char-${character.position} ${active ? "vn-active" : ""}`}>
    <div className="vn-hair" /><div className="vn-face">
      <span className={`vn-eyes vn-eyes-${expression}`} /><span className={`vn-brows vn-brows-${expression}`} /><span className={`vn-mouth vn-mouth-${expression}`} />
      <i className="vn-blush vn-blush-left" /><i className="vn-blush vn-blush-right" />
    </div><div className="vn-neck" /><div className={`vn-body vn-body-${character.position}`}><i className="vn-collar" /></div>
    <span className="vn-name">{character.name}</span>
  </div>;
}

function KannadaChapterNotice() {
  return <div className="vn-main vn-language-notice">
    <div className="vn-title-row"><div><small>LANGBRIDGE STORIES</small><h1>ಕನ್ನಡದ ಕಥೆಗಳಿಗೆ ಸ್ವಾಗತ!</h1>
      <p>The first playable story chapter is currently available in Kannada.</p></div></div>
    <section className="vn-dialogue">
      <div className="vn-dialogue-head"><b>Kannada chapter</b></div>
      <p className="vn-native" lang="kn">ಮೊದಲ ಅಧ್ಯಾಯವನ್ನು ಆಡಲು ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ.</p>
      <p className="vn-translation">Switch the language selector to Kannada to play Chapter 1. Other language stories will be added using this same game engine.</p>
    </section>
  </div>;
}

export default function VisualNovel() {
  const { language } = useLanguage();
  const [engine, setEngine] = useState(() => new SceneEngine(chapter01, readSave()));
  const [translation, setTranslation] = useState(true);
  const [journal, setJournal] = useState(false);
  const issues = validateChapter(chapter01);
  const scene = engine.scene, node = engine.node;

  const update = transition => {
    const state = transition();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    setEngine(new SceneEngine(chapter01, state));
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      window.alert("Speech playback is not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(node.text);
    utterance.lang = "kn-IN";
    window.speechSynthesis.speak(utterance);
  };
  const restart = () => {
    const fresh = new SceneEngine(chapter01);
    localStorage.setItem(SAVE_KEY, JSON.stringify(fresh.snapshot()));
    setEngine(fresh);
    setJournal(false);
  };

  return <main className="vn-shell">
    <header className="vn-header">
      <a href="/roleplay">← Voice practice</a>
      <b><Sparkles size={17} /> LANGBRIDGE <em>STORIES</em></b>
      <div className="vn-header-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LanguageSwitcher />
        <button onClick={() => setJournal(v => !v)}><BookOpen size={16} /> Journal</button>
      </div>
    </header>

    {language !== "Kannada" ? <KannadaChapterNotice /> : <div className="vn-main">
      <div className="vn-title-row"><div><small>CHAPTER 01 · ಕನ್ನಡ</small><h1>{chapter01.title}</h1>
        <p>Small conversations. Real-world confidence.</p></div>
        <div className="vn-reward"><Sparkles size={15} />{engine.state.xp} XP <span>·</span><Gem size={15} />{engine.state.gems}</div>
      </div>

      <section className="vn-scene" aria-label={scene.locationName}>
        <div className="vn-window"><i /><i /><i /><i /></div><div className="vn-shelf"><i /><i /><i /><i /></div><div className="vn-counter" />
        <div className="vn-location"><MapPin size={14} />{scene.locationName}</div>
        <div className="vn-characters">{scene.characters.map(c =>
          <Character key={c.id} character={{...c, expression: node.speaker === c.name ? (node.expression || c.expression) : c.expression}} active={node.speaker === c.name} />
        )}</div>
      </section>

      <div className="vn-objective"><span>OBJECTIVE</span>{scene.objective}<button onClick={() => setJournal(v => !v)}>Journal ↗</button></div>
      <section className="vn-interaction">
        <div className="vn-dialogue">
          <div className="vn-dialogue-head"><b>{node.speaker}</b><div>
            <button aria-label="Play Kannada dialogue" onClick={speak}><Volume2 size={17} /></button>
            {node.translation && <button aria-label="Toggle English translation" aria-pressed={translation} onClick={() => setTranslation(v => !v)}><Languages size={17} /></button>}
          </div></div>
          <p className="vn-native" lang="kn">{node.text}</p>
          {translation && node.translation && <p className="vn-translation">{node.translation}</p>}
          {node.next && !node.choices && !node.end && <button className="vn-primary vn-continue" onClick={() => update(() => engine.continue())}>Continue →</button>}
        </div>
        <div className="vn-choices">{(node.choices || []).map((c, i) =>
          <button key={c.id} onClick={() => update(() => engine.choose(c.id))}><span>{c.kind === "hint" ? "✦" : `0${i+1}`}</span>{c.label}<b>↗</b></button>
        )}</div>
        {node.end && <div className="vn-complete"><div>
          <strong>{node.completeQuest ? "Quest complete!" : "Scene paused"}</strong>
          <p>{node.completeQuest ? "You completed your first Kannada conversation." : "You can return to the conversation whenever you're ready."}</p>
        </div><button className="vn-primary" onClick={restart}><RotateCcw size={15} /> Play again</button></div>}
      </section>

      {journal && <aside className="vn-journal"><div><BookOpen size={18} /><b>Quest journal</b><button aria-label="Close journal" onClick={() => setJournal(false)}>×</button></div>
        <p><strong>{scene.objective}</strong></p><p>Meet the café owner, greet them politely, and practise asking for coffee.</p>
        <small>{engine.state.completedQuests.length ? "✓ First conversation complete" : "● In progress"}</small>
        <p className="vn-tip">Tip: replay dialogue, show the translation, or choose the hint whenever you need help.</p>
      </aside>}
      {import.meta.env.DEV && issues.length > 0 && <pre className="vn-validation">{issues.join("\n")}</pre>}
    </div>}
  </main>;
}

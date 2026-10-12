import React, { useState } from "react";
import { BookOpen, MapPin, Volume2, Languages, Sparkles, Gem, RotateCcw } from "lucide-react";
import { chapter01 } from "./data/chapter01";
import { SceneEngine, validateChapter } from "./SceneEngine";
import "./visual-novel.css";

const SAVE_KEY = "langbridge.vn.chapter01.v1";
function readSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"); }
  catch { return {}; }
}

function Character({ character, active }) {
  const expression = character.expression || "neutral";
  return <div className={`vn-char vn-char-${character.position} ${active ? "vn-active" : ""}`}>
    <div className="vn-hair"/><div className="vn-face">
      <span className={`vn-eyes vn-eyes-${expression}`}/><span className={`vn-brows vn-brows-${expression}`}/><span className={`vn-mouth vn-mouth-${expression}`}/>
      <i className="vn-blush vn-blush-left"/><i className="vn-blush vn-blush-right"/>
    </div><div className="vn-neck"/><div className={`vn-body vn-body-${character.position}`}><i className="vn-collar"/></div>
    <span className="vn-name">{character.name}</span>
  </div>;
}

export default function VisualNovel() {
  const [engine, setEngine] = useState(() => new SceneEngine(chapter01, readSave()));
  const [translation, setTranslation] = useState(true);
  const [journal, setJournal] = useState(false);
  const scene = engine.scene, node = engine.node;
  const issues = validateChapter(chapter01);
  const update = fn => {
    const state = fn();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    setEngine(new SceneEngine(chapter01, state));
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(node.text);
    u.lang = "kn-IN";
    window.speechSynthesis.speak(u);
  };
  const restart = () => {
    const fresh = new SceneEngine(chapter01);
    localStorage.setItem(SAVE_KEY, JSON.stringify(fresh.snapshot()));
    setEngine(fresh);
  };
  return <main className="vn-shell">
    <header className="vn-header">
      <a href="/roleplay">← Voice practice</a>
      <b><Sparkles size={17}/> LANGBRIDGE <em>STORIES</em></b>
      <button onClick={() => setJournal(v => !v)}><BookOpen size={16}/> Journal</button>
    </header>
    <div className="vn-main">
      <div className="vn-title-row"><div><small>CHAPTER 01</small><h1>{chapter01.title}</h1><p>Small conversations. Real-world confidence.</p></div>
        <div className="vn-reward"><Sparkles size={15}/>{engine.state.xp} XP <span>·</span><Gem size={15}/>{engine.state.gems}</div></div>
      <section className="vn-scene">
        <div className="vn-window"><i/><i/><i/><i/></div><div className="vn-shelf"><i/><i/><i/><i/></div><div className="vn-counter"/>
        <div className="vn-location"><MapPin size={14}/>{scene.locationName}</div>
        <div className="vn-characters">{scene.characters.map(c => <Character key={c.id} character={{...c, expression: node.speaker === c.name ? (node.expression || c.expression) : c.expression}} active={node.speaker === c.name}/>)}</div>
      </section>
      <div className="vn-objective"><span>OBJECTIVE</span>{scene.objective}<button onClick={() => setJournal(v => !v)}>Journal ↗</button></div>
      <section className="vn-interaction">
        <div className="vn-dialogue"><div className="vn-dialogue-head"><b>{node.speaker}</b><div><button aria-label="Play dialogue" onClick={speak}><Volume2 size={17}/></button>{node.translation && <button aria-label="Toggle translation" onClick={() => setTranslation(v => !v)}><Languages size={17}/></button>}</div></div>
          <p className="vn-native" lang="kn">{node.text}</p>{translation && node.translation && <p className="vn-translation">{node.translation}</p>}
          {node.next && !node.choices && <button className="vn-primary vn-continue" onClick={() => update(() => engine.continue())}>Continue →</button>}
        </div>
        <div className="vn-choices">{(node.choices || []).map((c, i) => <button key={c.id} onClick={() => update(() => engine.choose(c.id))}><span>{c.kind === "hint" ? "✦" : `0${i+1}`}</span>{c.label}<b>↗</b></button>)}</div>
        {node.end && <div className="vn-complete"><div><strong>Conversation complete!</strong><p>You can replay this scene to practise again.</p></div><button className="vn-primary" onClick={restart}><RotateCcw size={15}/> Play again</button></div>}
      </section>
      {journal && <aside className="vn-journal"><div><BookOpen size={18}/><b>Quest journal</b><button onClick={() => setJournal(false)}>×</button></div><p><strong>{scene.objective}</strong></p><p>Speak with the café owner and practise a polite request.</p><small>{engine.state.completedQuests.length ? "✓ First conversation complete" : "● In progress"}</small><p className="vn-tip">Tip: use the translation toggle or choose the hint whenever you need help.</p></aside>}
      {import.meta.env.DEV && issues.length > 0 && <pre>{issues.join("\\n")}</pre>}
    </div>
  </main>;
}

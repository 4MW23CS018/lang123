// Basics.jsx — Foundations page: browse vowels/consonants/numbers and
// practise writing each character with the guided handwriting tracer.
import { useEffect, useMemo, useState } from "react";
import { BookOpen, PenLine, ArrowRight, Type } from "lucide-react";
import { useLanguage } from "../components/hooks/useLanguage";
import { BASICS_DATA } from "../data/basics";
import ListenButton from "../components/speech/ListenButton";
import HandwritingTracer from "../components/HandwritingTracer";
import {
  getBasicsGlyphFont,
  getBasicsGlyphText,
} from "../utils/basicsGlyphFonts";

const TABS = [
  {
    key: "vowels",
    label: "Vowels",
    hint: "Start with the sounds of the script",
  },
  {
    key: "consonants",
    label: "Consonants",
    hint: "Build the core letter shapes",
  },
  {
    key: "specialCharacters",
    label: "Special Characters",
    hint: "Learn signs and script limitations separately from letters",
  },
  {
    key: "numbers",
    label: "Numbers",
    hint: "Learn number names and the script forms available in this dataset",
  },
];
const glyphFor = getBasicsGlyphText;
const itemKey = (item) => item.id ?? item.char ?? `number-${item.val}`;
const canTraceItem = (_language, item) =>
  !item.nativeGlyphUnavailable && Boolean(item.displayChar || item.char);

function CharacterGlyph({ item, language, style }) {
  const glyph = glyphFor(item);
  const glyphFont = getBasicsGlyphFont(language, item);
  const { fontFamily, fontWeight, requiresFontFaceLoad = false } = glyphFont;
  const fontKey = `${fontFamily}:${fontWeight}:${glyph}`;
  const hasFontLoadingApi =
    typeof document !== "undefined" && Boolean(document.fonts?.load);
  const [fontStatus, setFontStatus] = useState({ key: "", loaded: false });

  useEffect(() => {
    if (!requiresFontFaceLoad || !fontFamily || !fontKey) return undefined;
    let active = true;
    if (!document.fonts?.load) return undefined;
    document.fonts
      .load(`${fontWeight} 48px ${fontFamily}`, glyph)
      .then((faces) => {
        if (active) {
          setFontStatus({
            key: fontKey,
            loaded: faces.some((face) => face.status === "loaded"),
          });
        }
      })
      .catch(() => {
        if (active) setFontStatus({ key: fontKey, loaded: false });
      });
    return () => {
      active = false;
    };
  }, [fontFamily, fontKey, fontWeight, glyph, requiresFontFaceLoad]);
  const glyphFontReady =
    !requiresFontFaceLoad ||
    !hasFontLoadingApi ||
    (fontStatus.key === fontKey && fontStatus.loaded);

  if (item.displayChar) {
    if (!glyphFontReady) {
      return (
        <span className="basics-glyph-fallback" style={style}>
          <span>{item.ph}</span>
          <small>
            {fontStatus.key === fontKey
              ? "Script font unavailable"
              : "Loading script glyph…"}
          </small>
        </span>
      );
    }
    const fontClass = language === "Tulu"
      ? "basics-custom-script-glyph basics-custom-script-glyph--tulu"
      : "basics-custom-script-glyph basics-custom-script-glyph--kodava";
    return (
      <span
        className={fontClass}
        aria-label={`${language} glyph for ${item.ph}`}
        style={{ ...style, fontFamily, fontWeight }}
      >
        {item.displayChar}
      </span>
    );
  }

  if (item.nativeGlyphUnavailable) {
    return (
      <span className="basics-glyph-fallback" style={style}>
        <span>{item.ph}</span>
          <small>No script glyph in this inventory</small>
      </span>
    );
  }
  if (!glyphFontReady) {
    return (
      <span className="basics-glyph-fallback" style={style}>
        <span>{item.ph}</span>
        <small>
          {fontStatus.key === fontKey
            ? "Script font unavailable"
            : "Loading script glyph…"}
        </small>
      </span>
    );
  }
  return (
    <span
      className={language === "Tulu" ? "tulu-tigalari" : undefined}
      style={{ ...style, fontFamily, fontWeight }}
    >
      {glyph}
    </span>
  );
}

/** Shared style for all pill-shaped buttons on this page. */
const buttonStyle = {
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid var(--border-default)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontWeight: 700,
  cursor: "pointer",
};

// BasicCard — one tile in the grid 

function BasicCard({ item, language, onTrace }) {
  const glyph = glyphFor(item);
  const canTrace = canTraceItem(language, item);
  return (
    <article
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        gap: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: item.val !== undefined ? 36 : 48,
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        <CharacterGlyph
          item={item}
          language={language}
          style={item.val !== undefined ? { width: 92, height: 72 } : undefined}
        />
      </div>
      {item.val !== undefined && (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Number {item.val}
        </span>
      )}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-secondary)",
        }}
      >
        {item.ph}
      </div>
      {item.note && ((language === "Tulu" || language === "Kodava") ? (
        <details className="basics-card-note">
          <summary>About this form</summary>
          <p>{item.note}</p>
        </details>
      ) : (
        <p className="basics-card-note-text">{item.note}</p>
      ))}
      {item.ex && (
        <div
          style={{
            textAlign: "center",
            background: "var(--bg-elevated)",
            padding: "8px 10px",
            borderRadius: 12,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}
          >
            {item.ex}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              marginTop: 2,
            }}
          >
            {item.exPh} · {item.exEn}
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 8,
          width: "100%",
          marginTop: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <ListenButton
          phrase={item.tts || glyph}
          displayPhrase={item.displayChar || item.nativeGlyphUnavailable ? item.ph : glyph}
          language={language}
          ariaLabel={`${item.ph} pronunciation`}
          size={44}
        />
        <button
          type="button"
          onClick={() => onTrace(item)}
          aria-label={`Trace ${item.ph}`}
          disabled={!canTrace}
          title={canTrace ? undefined : `No script glyph is available in this inventory to trace for ${item.ph}.`}
          style={{
            ...buttonStyle,
            opacity: canTrace ? 1 : 0.5,
            cursor: canTrace ? "pointer" : "not-allowed",
          }}
        >
          <PenLine size={16} aria-hidden="true" /> Trace
        </button>
      </div>
    </article>
  );
}

// Basics — the page 

export default function Basics() {
  const { language } = useLanguage();
  return <BasicsContent key={language} language={language} />;
}

function BasicsContent({ language }) {
  const data = BASICS_DATA[language];
  const [activeTab, setActiveTab] = useState("vowels");
  const [practice, setPractice] = useState(null);
  const [recall, setRecall] = useState("");
  const items = data?.[activeTab] || [];
  const total = useMemo(
    () =>
      data
        ? TABS.reduce((sum, tab) => sum + (data[tab.key]?.length || 0), 0)
        : 0,
    [data],
  );

  // ── Actions 

  const startLearning = () => {
    setActiveTab("vowels");
    if (data?.vowels?.length)
      setPractice({
        item: data.vowels[0],
        sequence: "vowels",
        guided: true,
        stage: "learn",
      });
    setRecall("");
  };
  const openPractice = (item) =>
    setPractice({ item, sequence: activeTab, guided: false });
  const navigateCharacter = (direction) => {
    if (!practice) return;
    const sequence = data?.[practice.sequence] || [];
    const index = sequence.findIndex((item) => itemKey(item) === itemKey(practice.item));
    let nextIndex = index + direction;
    while (
      nextIndex >= 0 &&
      nextIndex < sequence.length &&
      !canTraceItem(language, sequence[nextIndex])
    ) {
      nextIndex += direction;
    }
    const nextItem = sequence[nextIndex];
    if (!nextItem) return;
    setPractice({
      ...practice,
      item: nextItem,
      stage: practice.guided ? "learn" : "trace",
    });
    setRecall("");
  };
  const traceNeighborGlyph = (direction) => {
    if (!practice) return undefined;
    const sequence = data?.[practice.sequence] || [];
    const index = sequence.findIndex((item) => itemKey(item) === itemKey(practice.item));
    let nextIndex = index + direction;
    while (
      nextIndex >= 0 &&
      nextIndex < sequence.length &&
      !canTraceItem(language, sequence[nextIndex])
    ) {
      nextIndex += direction;
    }
    return sequence[nextIndex] ? glyphFor(sequence[nextIndex]) : undefined;
  };
  const moveNext = () => {
    if (!practice) return;
    if (practice.guided && practice.stage === "trace") {
      setPractice({ ...practice, stage: "recall" });
      setRecall("");
      return;
    }
    const sequence = data?.[practice.sequence] || [];
    const index = sequence.findIndex((item) => itemKey(item) === itemKey(practice.item));
    let nextIndex = index + 1;
    if (!practice.guided) {
      while (
        nextIndex < sequence.length &&
        !canTraceItem(language, sequence[nextIndex])
      ) {
        nextIndex += 1;
      }
    }
    if (index >= 0 && nextIndex < sequence.length)
      setPractice({
        ...practice,
        item: sequence[nextIndex],
        stage: practice.guided ? "learn" : "trace",
      });
    else setPractice(null);
  };

  // ── Render 
  
  return (
    <main
      className="basics-page"
      style={{
        padding: "clamp(20px, 4vw, 36px) clamp(14px, 3vw, 24px)",
        maxWidth: 1040,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
          }}
        >
          Foundations
        </span>
        <h1
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(26px, 4vw, 34px)",
            fontWeight: 800,
            margin: "5px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Type size={28} color="var(--accent)" aria-hidden="true" /> {language}{" "}
          Basics
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 15,
            margin: "6px 0 18px",
            lineHeight: 1.6,
          }}
        >
          {language === "Tulu" || language === "Kodava"
            ? language === "Tulu"
              ? "Letter and sign forms use Tulu-Tigalari where supported; available numerals use a project-specific font. Pronunciation aids use Kannada orthography, and some sounds have no glyph here."
              : "Letter and sign forms use chart-derived Kodava Lipi glyphs through a project-specific private-use mapping; those code points are not standardized Kodava Unicode characters. Numerals have no glyph in this inventory."
            : "Learn each sound, see it in a word, then practise writing it."}
        </p>
        {data && (
          <button
            type="button"
            onClick={startLearning}
            style={{
              ...buttonStyle,
              minHeight: 50,
              padding: "12px 18px",
              background: "var(--accent)",
              color: "#052e16",
              border: 0,
            }}
          >
            <BookOpen size={18} aria-hidden="true" /> Start learning{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
        {data && (
          <p
            style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 10 }}
          >
            {total} learning items · Progress tracking is not available yet.
          </p>
        )}
      </header>
      {!data ? (
        <section className="glass-panel" style={{ padding: 28 }}>
          <p style={{ color: "var(--text-primary)" }}>
            Basics are not currently available for {language}. This section is
            available for Kannada, Tamil, Telugu, Malayalam, Tulu, and Kodava.
          </p>
        </section>
      ) : (
        <section
          className="glass-panel"
          style={{ padding: "clamp(14px, 3vw, 24px)" }}
        >
          <nav
            aria-label="Character categories"
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: 14,
              overflowX: "auto",
            }}
          >
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                style={{
                  ...buttonStyle,
                  whiteSpace: "nowrap",
                  background:
                    activeTab === tab.key ? "var(--accent)" : "transparent",
                  color:
                    activeTab === tab.key ? "#052e16" : "var(--text-secondary)",
                  borderColor:
                    activeTab === tab.key ? "var(--accent)" : "transparent",
                }}
              >
                {tab.label} ({data[tab.key]?.length || 0})
              </button>
            ))}
          </nav>
          <p
            style={{
              color: "var(--text-muted)",
              margin: "0 0 16px",
              fontSize: 14,
            }}
          >
            {TABS.find((tab) => tab.key === activeTab)?.hint}. Choose Listen to
            hear a pronunciation. Trace uses a stored path when one exists, with
            its verification status shown in the tracer; other supported glyphs
            open freehand practice.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
              gap: 14,
            }}
          >
            {items.map((item) => (
              <BasicCard
              key={itemKey(item)}
                item={item}
                language={language}
                onTrace={openPractice}
              />
            ))}
          </div>
          {!items.length && (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                padding: "30px 0",
              }}
            >
              No items in this category yet.
            </p>
          )}
        </section>
      )}
      {practice?.guided && practice.stage !== "trace" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "rgba(0,0,0,.75)",
          }}
        >
          <section
            className="glass-panel"
            style={{
              width: "min(100%, 440px)",
              maxHeight: "90dvh",
              overflowY: "auto",
              padding: 24,
              color: "var(--text-primary)",
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setPractice(null);
            }}
          >
            <button
              type="button"
              onClick={() => setPractice(null)}
              style={{ ...buttonStyle, float: "right" }}
            >
              Close
            </button>
            <p style={{ color: "var(--text-muted)", margin: "0 0 8px" }}>
              {practice.stage === "learn"
                ? "Step 1 · Listen and learn"
                : "Step 3 · Recall"}
            </p>
            <h2 id="guided-title" style={{ fontSize: 22, margin: "0 0 14px" }}>
              {practice.stage === "learn"
                ? "Meet this character"
                : "Can you recall it?"}
            </h2>
            {practice.stage === "learn" ? (
              <>
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    textAlign: "center",
                    margin: "16px 0",
                  }}
                >
                  <CharacterGlyph
                    item={practice.item}
                    language={language}
                    style={{ width: 120, height: 96, margin: "0 auto" }}
                  />
                </div>
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  Pronunciation: <strong>{practice.item.ph}</strong>
                </p>
                {practice.item.note && (
                  <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
                    {practice.item.note}
                  </p>
                )}
                {practice.item.ex && (
                  <p style={{ textAlign: "center" }}>
                    Example: {practice.item.ex} · {practice.item.exEn}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ListenButton
                    phrase={practice.item.tts || glyphFor(practice.item)}
                    displayPhrase={practice.item.displayChar || practice.item.nativeGlyphUnavailable ? practice.item.ph : glyphFor(practice.item)}
                    language={language}
                    ariaLabel={`${practice.item.ph} pronunciation`}
                    size={44}
                  />
                  <button
                    type="button"
                    autoFocus
                    style={buttonStyle}
                    onClick={() =>
                      setPractice({
                        ...practice,
                        stage: canTraceItem(language, practice.item) ? "trace" : "recall",
                      })
                    }
                  >
                    {canTraceItem(language, practice.item) ? <><PenLine size={16} /> Trace this character</> : "Continue to recall"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  Type the {practice.item.displayChar || practice.item.nativeGlyphUnavailable ? "transliteration" : "character"} for <strong>{practice.item.ph}</strong>.
                </p>
                <label>
                  Your answer
                  <input
                    autoFocus
                    value={recall}
                    onChange={(event) => setRecall(event.target.value)}
                    style={{
                      display: "block",
                      width: "100%",
                      minHeight: 48,
                      marginTop: 6,
                      boxSizing: "border-box",
                      fontSize: 24,
                    }}
                  />
                </label>
                {recall.trim() === (practice.item.displayChar || practice.item.nativeGlyphUnavailable ? practice.item.ph : glyphFor(practice.item)) && (
                  <p role="status">Correct. You recalled {practice.item.ph}.</p>
                )}
                <button
                  type="button"
                  disabled={recall.trim() !== (practice.item.displayChar || practice.item.nativeGlyphUnavailable ? practice.item.ph : glyphFor(practice.item))}
                  style={{
                    ...buttonStyle,
                    marginTop: 14,
                    opacity:
                      recall.trim() === (practice.item.displayChar || practice.item.nativeGlyphUnavailable ? practice.item.ph : glyphFor(practice.item)) ? 1 : 0.5,
                  }}
                  onClick={moveNext}
                >
                  Continue
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {practice && canTraceItem(language, practice.item) && (!practice.guided || practice.stage === "trace") && (
        <HandwritingTracer
          key={`${language}-${practice.sequence}-${itemKey(practice.item)}-${glyphFor(practice.item)}`}
          char={glyphFor(practice.item)}
          label={practice.item.ph}
          example={practice.item.ex}
          script={language}
          fontFamily={getBasicsGlyphFont(language, practice.item).fontFamily}
          fontWeight={getBasicsGlyphFont(language, practice.item).fontWeight}
          previousChar={
            traceNeighborGlyph(-1)
          }
          nextChar={
            traceNeighborGlyph(1)
          }
          onClose={() => setPractice(null)}
          onNext={moveNext}
          onPreviousCharacter={() => navigateCharacter(-1)}
          onNextCharacter={() => navigateCharacter(1)}
        />
      )}
    </main>
  );
}

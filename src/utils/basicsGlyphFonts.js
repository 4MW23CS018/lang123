const SCRIPT_FONT_FAMILIES = Object.freeze({
  Kannada: {
    fontFamily: "'Nirmala UI', 'LangBridge Noto Kannada UI', 'LangBridge Noto Kannada', sans-serif",
    fallbackFontFamily: "'LangBridge Noto Kannada UI', 'LangBridge Noto Kannada', sans-serif",
    platformFontFamilies: ["Nirmala UI", "Noto Sans Kannada UI", "Noto Sans Kannada"],
    fallbackPlatformFontFamilies: ["Noto Sans Kannada UI", "Noto Sans Kannada"],
    fontWeight: 800,
  },
  Tamil: {
    fontFamily: "'Nirmala UI', 'LangBridge Noto Tamil', sans-serif",
    fallbackFontFamily: "'LangBridge Noto Tamil', sans-serif",
    platformFontFamilies: ["Nirmala UI", "Noto Sans Tamil"],
    fallbackPlatformFontFamilies: ["Noto Sans Tamil"],
    fontWeight: 800,
  },
  Telugu: {
    fontFamily: "'Nirmala UI', 'LangBridge Noto Telugu', sans-serif",
    fallbackFontFamily: "'LangBridge Noto Telugu', sans-serif",
    platformFontFamilies: ["Nirmala UI", "Noto Sans Telugu"],
    fallbackPlatformFontFamilies: ["Noto Sans Telugu"],
    fontWeight: 800,
  },
  Malayalam: {
    fontFamily: "'Nirmala UI', 'LangBridge Noto Malayalam', sans-serif",
    fallbackFontFamily: "'LangBridge Noto Malayalam', sans-serif",
    platformFontFamilies: ["Nirmala UI", "Noto Sans Malayalam"],
    fallbackPlatformFontFamilies: ["Noto Sans Malayalam"],
    fontWeight: 800,
  },
});

const CUSTOM_GLYPH_FONTS = Object.freeze({
  Kodava: {
    fontFamily: "'LangBridge Kodava', sans-serif",
    fallbackFontFamily: "'LangBridge Kodava', sans-serif",
    platformFontFamilies: ["LangBridgeKodava"],
    fallbackPlatformFontFamilies: ["LangBridgeKodava"],
    fontWeight: 400,
    requiresFontFaceLoad: true,
  },
  TuluNumeral: {
    fontFamily: "'LangBridge Tulu Numerals', serif",
    fallbackFontFamily: "'LangBridge Tulu Numerals', serif",
    platformFontFamilies: ["LangBridgeTulu"],
    fallbackPlatformFontFamilies: ["LangBridgeTulu"],
    fontWeight: 400,
    requiresFontFaceLoad: true,
  },
  Tulu: {
    fontFamily: "'Mallige Tulu Tigalari', serif",
    fallbackFontFamily: "'Mallige Tulu Tigalari', serif",
    platformFontFamilies: ["XmlAlieg(mallige)v1"],
    fallbackPlatformFontFamilies: ["XmlAlieg(mallige)v1"],
    fontWeight: 400,
    requiresFontFaceLoad: true,
  },
});

export function getBasicsGlyphText(item) {
  if (item?.displayChar) return item.displayChar;
  if (item?.char == null || item.nativeGlyphUnavailable) return item?.ph ?? "";
  return item.val !== undefined ? item.char.split(" ")[0] : item.char;
}

export function getBasicsGlyphFont(language, item) {
  if (item?.displayChar) {
    return language === "Tulu"
      ? CUSTOM_GLYPH_FONTS.TuluNumeral
      : CUSTOM_GLYPH_FONTS.Kodava;
  }
  if (language === "Tulu" && item?.char) return CUSTOM_GLYPH_FONTS.Tulu;

  return (
    SCRIPT_FONT_FAMILIES[language] ?? {
      fontFamily: "system-ui, sans-serif",
      fallbackFontFamily: "system-ui, sans-serif",
      platformFontFamilies: [],
      fallbackPlatformFontFamilies: [],
      fontWeight: 800,
      requiresFontFaceLoad: false,
    }
  );
}

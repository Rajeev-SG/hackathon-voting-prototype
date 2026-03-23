// src/app.js
import {
  assertHex,
  generateAllFiles,
  generateShadcnThemeCss,
  generateRadixScalesCss,
  generateTailwindV3ConfigSnippet,
  generateTailwindV4ThemeMappingCss,
} from "./theme.js";

const DEFAULTS = {
  palette: {
    white: "#FFFFFF",
    black: "#222222",
    gray100: "#CCCCCC",
    gray500: "#888888",
    gray600: "#999999",
    teal: "#2FC3C7",
    purple: "#6F5798",
    graySeed: "#888888", // used to generate the 12-step gray scale
  },
  radius: "0.75rem",
  preset: "teal",
  dark: false,
};

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getCheckedTheme() {
  const r = document.querySelector('input[name="theme"]:checked');
  return r ? r.value : "teal";
}

function setRadioTheme(value) {
  const r = document.querySelector(`input[name="theme"][value="${value}"]`);
  if (r) r.checked = true;
}

function setTab(active) {
  for (const btn of document.querySelectorAll(".tab")) {
    btn.classList.toggle("is-active", btn.dataset.tab === active);
  }
}

function currentConfigFromUI() {
  const palette = {
    white: assertHex($("t_white").value),
    black: assertHex($("t_black").value),
    gray100: assertHex($("t_gray100").value),
    gray500: assertHex($("t_gray500").value),
    gray600: assertHex($("t_gray600").value),
    teal: assertHex($("t_teal").value),
    purple: assertHex($("t_purple").value),
    graySeed: assertHex($("t_gray500").value), // treat gray500 as the seed for the gray scale
  };

  const radius = $("radius").value.trim() || DEFAULTS.radius;

  return {
    palette,
    radius,
    preset: getCheckedTheme(),
    dark: document.documentElement.classList.contains("dark"),
  };
}

function updateThemeStyle({ preset, palette, radius }) {
  const css = generateShadcnThemeCss({ themeName: preset, palette, radius });
  $("generatedTheme").textContent = css;
}

function syncColorField(colorId, textId, valueHex) {
  $(colorId).value = valueHex;
  $(textId).value = valueHex;
}

function bindColorPair(colorId, textId, onChange) {
  const c = $(colorId);
  const t = $(textId);

  function applyHex(hex) {
    try {
      const v = assertHex(hex);
      c.value = v;
      t.value = v;
      onChange(v);
    } catch {
      // ignore invalid while typing
    }
  }

  c.addEventListener("input", () => applyHex(c.value));
  t.addEventListener("input", () => applyHex(t.value));
}

function renderOutput(tab) {
  const cfg = currentConfigFromUI();

  if (tab === "shadcn") {
    $("output").value = generateShadcnThemeCss({ themeName: cfg.preset, palette: cfg.palette, radius: cfg.radius });
    return;
  }
  if (tab === "radix") {
    $("output").value = generateRadixScalesCss(cfg.palette);
    return;
  }
  if (tab === "tw3") {
    $("output").value = generateTailwindV3ConfigSnippet();
    return;
  }
  if (tab === "tw4") {
    $("output").value = generateTailwindV4ThemeMappingCss();
    return;
  }
}

function init() {
  // Seed UI with defaults.
  syncColorField("c_white", "t_white", DEFAULTS.palette.white);
  syncColorField("c_black", "t_black", DEFAULTS.palette.black);
  syncColorField("c_gray100", "t_gray100", DEFAULTS.palette.gray100);
  syncColorField("c_gray500", "t_gray500", DEFAULTS.palette.gray500);
  syncColorField("c_gray600", "t_gray600", DEFAULTS.palette.gray600);
  syncColorField("c_teal", "t_teal", DEFAULTS.palette.teal);
  syncColorField("c_purple", "t_purple", DEFAULTS.palette.purple);
  $("radius").value = DEFAULTS.radius;

  setRadioTheme(DEFAULTS.preset);

  const outputTab = { value: "shadcn" };
  setTab(outputTab.value);

  const applyAll = () => {
    const cfg = currentConfigFromUI();
    updateThemeStyle(cfg);
    renderOutput(outputTab.value);
  };

  // Bind palette controls.
  bindColorPair("c_white", "t_white", applyAll);
  bindColorPair("c_black", "t_black", applyAll);
  bindColorPair("c_gray100", "t_gray100", applyAll);
  bindColorPair("c_gray500", "t_gray500", applyAll);
  bindColorPair("c_gray600", "t_gray600", applyAll);
  bindColorPair("c_teal", "t_teal", applyAll);
  bindColorPair("c_purple", "t_purple", applyAll);

  $("radius").addEventListener("input", applyAll);

  for (const r of document.querySelectorAll('input[name="theme"]')) {
    r.addEventListener("change", applyAll);
  }

  // Tabs.
  for (const btn of document.querySelectorAll(".tab")) {
    btn.addEventListener("click", () => {
      outputTab.value = btn.dataset.tab || "shadcn";
      setTab(outputTab.value);
      renderOutput(outputTab.value);
    });
  }

  // Dark mode toggle.
  $("toggleDark").addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const pressed = document.documentElement.classList.contains("dark");
    $("toggleDark").setAttribute("aria-pressed", pressed ? "true" : "false");
    applyAll();
  });

  // Reset.
  $("reset").addEventListener("click", () => {
    document.documentElement.classList.remove("dark");
    $("toggleDark").setAttribute("aria-pressed", "false");
    syncColorField("c_white", "t_white", DEFAULTS.palette.white);
    syncColorField("c_black", "t_black", DEFAULTS.palette.black);
    syncColorField("c_gray100", "t_gray100", DEFAULTS.palette.gray100);
    syncColorField("c_gray500", "t_gray500", DEFAULTS.palette.gray500);
    syncColorField("c_gray600", "t_gray600", DEFAULTS.palette.gray600);
    syncColorField("c_teal", "t_teal", DEFAULTS.palette.teal);
    syncColorField("c_purple", "t_purple", DEFAULTS.palette.purple);
    $("radius").value = DEFAULTS.radius;
    setRadioTheme(DEFAULTS.preset);
    applyAll();
  });

  // Downloads.
  $("dl_shadcn").addEventListener("click", () => {
    const cfg = currentConfigFromUI();
    const css = generateShadcnThemeCss({ themeName: cfg.preset, palette: cfg.palette, radius: cfg.radius });
    download(`shadcn.${cfg.preset}.css`, css);
  });

  $("dl_shadcn_all").addEventListener("click", () => {
    const cfg = currentConfigFromUI();
    const all = generateAllFiles({ palette: cfg.palette, radius: cfg.radius });
    download("shadcn.teal.css", all["tokens/shadcn.teal.css"]);
    download("shadcn.purple.css", all["tokens/shadcn.purple.css"]);
    download("shadcn.duo.css", all["tokens/shadcn.duo.css"]);
  });

  $("dl_radix").addEventListener("click", () => {
    const cfg = currentConfigFromUI();
    download("radix-scales.css", generateRadixScalesCss(cfg.palette));
  });

  $("dl_tw3").addEventListener("click", () => download("tailwind-v3.config.cjs", generateTailwindV3ConfigSnippet()));
  $("dl_tw4").addEventListener("click", () => download("tailwind-v4.theme.css", generateTailwindV4ThemeMappingCss()));

  $("dl_palette").addEventListener("click", () => {
    const cfg = currentConfigFromUI();
    const out = {
      radius: cfg.radius,
      palette: cfg.palette,
      presets: {
        teal: { primary: "teal", secondary: "purple" },
        purple: { primary: "purple", secondary: "teal" },
        duo: { primary: "teal", secondary: "purple" },
      },
    };
    download("palette.json", JSON.stringify(out, null, 2));
  });

  // Initial render.
  applyAll();
}

init();

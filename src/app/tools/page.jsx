import { useState, useEffect, useCallback, useRef } from "react";

const SITE_NAME = "AIToolScope";
const TAGLINE = "Compare Every AI Tool. Decide in Seconds.";

// ─── Color System ───
const colors = {
  bg: "#0a0a0f",
  bgCard: "#12121a",
  bgCardHover: "#1a1a28",
  accent: "#00e5a0",
  accentDim: "#00e5a033",
  accentGlow: "#00e5a066",
  purple: "#8b5cf6",
  purpleDim: "#8b5cf622",
  orange: "#f59e0b",
  blue: "#3b82f6",
  red: "#ef4444",
  text: "#e8e8f0",
  textMuted: "#8888a0",
  textDim: "#55556a",
  border: "#1e1e30",
  borderHover: "#2a2a44",
};

// ─── AI Tools Database (seed data for programmatic generation) ───
const AI_TOOLS_DB = [
  { id: "chatgpt", name: "ChatGPT", category: "Chatbot", company: "OpenAI", pricing: "Free / $20/mo", rating: 4.7, users: "300M+", logo: "🤖", color: "#10a37f", features: ["Conversación natural", "Generación de código", "Análisis de imágenes", "Plugins", "GPT Store"], cpc: "$12.40", trend: "+18%", description: "Chatbot de IA conversacional líder del mercado con capacidades multimodales." },
  { id: "claude", name: "Claude", category: "Chatbot", company: "Anthropic", pricing: "Free / $20/mo", rating: 4.8, users: "100M+", logo: "🧠", color: "#d4a574", features: ["Razonamiento avanzado", "Contexto 200K tokens", "Análisis de documentos", "Código", "Computer Use"], cpc: "$11.80", trend: "+42%", description: "Asistente de IA con énfasis en seguridad y razonamiento profundo." },
  { id: "gemini", name: "Gemini", category: "Chatbot", company: "Google", pricing: "Free / $20/mo", rating: 4.5, users: "200M+", logo: "✨", color: "#4285f4", features: ["Multimodal nativo", "Integración Google", "1M tokens contexto", "Generación de imágenes", "Deep Research"], cpc: "$10.20", trend: "+25%", description: "IA multimodal de Google con integración profunda en su ecosistema." },
  { id: "midjourney", name: "Midjourney", category: "Imagen", company: "Midjourney Inc", pricing: "$10-60/mo", rating: 4.9, users: "20M+", logo: "🎨", color: "#ff6b6b", features: ["Arte fotorrealista", "Estilos artísticos", "Upscaling 4x", "Variaciones", "Editor web"], cpc: "$8.50", trend: "+15%", description: "Generador de imágenes por IA líder en calidad artística y fotorrealismo." },
  { id: "copilot", name: "GitHub Copilot", category: "Código", company: "Microsoft/GitHub", pricing: "$10-39/mo", rating: 4.6, users: "15M+", logo: "👨‍💻", color: "#238636", features: ["Autocompletado inteligente", "Chat en IDE", "Pull requests", "CLI", "Multi-modelo"], cpc: "$14.30", trend: "+30%", description: "Asistente de programación integrado directamente en tu IDE favorito." },
  { id: "perplexity", name: "Perplexity", category: "Búsqueda", company: "Perplexity AI", pricing: "Free / $20/mo", rating: 4.7, users: "50M+", logo: "🔍", color: "#20b2aa", features: ["Búsqueda con IA", "Citas en tiempo real", "Spaces colaborativos", "API", "Focus modes"], cpc: "$9.60", trend: "+55%", description: "Motor de respuestas que combina búsqueda web con IA conversacional." },
  { id: "runway", name: "Runway ML", category: "Video", company: "Runway", pricing: "$12-76/mo", rating: 4.5, users: "5M+", logo: "🎬", color: "#e040fb", features: ["Gen-3 Alpha", "Text-to-Video", "Motion Brush", "Inpainting", "Green Screen IA"], cpc: "$7.80", trend: "+60%", description: "Suite de herramientas de IA para generación y edición profesional de video." },
  { id: "notion-ai", name: "Notion AI", category: "Productividad", company: "Notion", pricing: "$10/mo add-on", rating: 4.4, users: "30M+", logo: "📝", color: "#000000", features: ["Escritura asistida", "Resúmenes automáticos", "Bases de datos inteligentes", "Q&A", "Autofill"], cpc: "$8.90", trend: "+20%", description: "IA integrada en el workspace todo-en-uno más popular para equipos." },
  { id: "cursor", name: "Cursor", category: "Código", company: "Anysphere", pricing: "Free / $20/mo", rating: 4.8, users: "5M+", logo: "⚡", color: "#7c3aed", features: ["IDE completo", "Agent mode", "Multi-archivo", "Terminal IA", "Composer"], cpc: "$13.10", trend: "+120%", description: "Editor de código potenciado por IA que revoluciona el desarrollo de software." },
  { id: "elevenlabs", name: "ElevenLabs", category: "Audio", company: "ElevenLabs", pricing: "Free / $5-99/mo", rating: 4.7, users: "10M+", logo: "🎙️", color: "#ff4081", features: ["Clonación de voz", "Text-to-Speech", "Doblaje", "Sound effects", "Conversational AI"], cpc: "$6.20", trend: "+45%", description: "Plataforma líder en generación de voz y audio con IA de alta fidelidad." },
  { id: "jasper", name: "Jasper", category: "Marketing", company: "Jasper AI", pricing: "$49-125/mo", rating: 4.3, users: "3M+", logo: "✏️", color: "#f97316", features: ["Copywriting IA", "Brand voice", "Templates", "SEO mode", "Team workflows"], cpc: "$15.60", trend: "+5%", description: "Plataforma de marketing con IA para crear contenido alineado con tu marca." },
  { id: "suno", name: "Suno", category: "Música", company: "Suno AI", pricing: "Free / $10-30/mo", rating: 4.6, users: "12M+", logo: "🎵", color: "#1db954", features: ["Text-to-Music", "Letras automáticas", "Estilos musicales", "Covers", "Stems"], cpc: "$5.40", trend: "+80%", description: "Genera canciones completas con letra y música a partir de texto." },
];

const CATEGORIES = [...new Set(AI_TOOLS_DB.map(t => t.category))];

// ─── Programmatic SEO: Auto-generated comparison pairs ───
const generateComparisons = () => {
  const comparisons = [];
  for (let i = 0; i < AI_TOOLS_DB.length; i++) {
    for (let j = i + 1; j < AI_TOOLS_DB.length; j++) {
      if (AI_TOOLS_DB[i].category === AI_TOOLS_DB[j].category) {
        comparisons.push({ a: AI_TOOLS_DB[i], b: AI_TOOLS_DB[j] });
      }
    }
  }
  return comparisons;
};

// ─── Ad Slot Component (monetization-ready) ───
const AdSlot = ({ size = "banner", className = "" }) => {
  const sizes = {
    banner: { w: "728px", h: "90px", label: "728×90 Leaderboard" },
    sidebar: { w: "300px", h: "250px", label: "300×250 Medium Rectangle" },
    native: { w: "100%", h: "120px", label: "Native Ad Unit" },
    sticky: { w: "320px", h: "50px", label: "320×50 Mobile Banner" },
  };
  const s = sizes[size];
  return (
    <div className={className} style={{
      width: s.w, maxWidth: "100%", height: s.h, margin: "24px auto",
      border: `1px dashed ${colors.border}`, borderRadius: "8px",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bg})`,
      color: colors.textDim, fontSize: "12px", fontFamily: "monospace",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${colors.border}11 10px, ${colors.border}11 20px)` }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: "10px", opacity: 0.5, marginBottom: "4px" }}>AD PLACEMENT</div>
        <div>{s.label}</div>
        <div style={{ fontSize: "9px", marginTop: "2px", opacity: 0.4 }}>Mediavine · Raptive · AdThrive · Ezoic</div>
      </div>
    </div>
  );
};

// ─── Star Rating ───
const Stars = ({ rating }) => (
  <span style={{ color: colors.orange, fontSize: "14px", letterSpacing: "1px" }}>
    {"★".repeat(Math.floor(rating))}
    {rating % 1 >= 0.5 ? "½" : ""}
    <span style={{ color: colors.textDim, marginLeft: "6px", fontSize: "13px" }}>{rating}</span>
  </span>
);

// ─── Trend Badge ───
const TrendBadge = ({ trend }) => {
  const isUp = trend.startsWith("+");
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px",
      background: isUp ? "#00e5a018" : "#ef444418",
      color: isUp ? colors.accent : colors.red,
      border: `1px solid ${isUp ? colors.accentDim : "#ef444433"}`,
    }}>
      {trend}
    </span>
  );
};

// ─── Tool Card ───
const ToolCard = ({ tool, onClick, index }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(tool)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? colors.bgCardHover : colors.bgCard,
        border: `1px solid ${hovered ? tool.color + "44" : colors.border}`,
        borderRadius: "16px", padding: "24px", cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 20px 40px ${tool.color}15, 0 0 0 1px ${tool.color}22` : "none",
        position: "relative", overflow: "hidden",
        animation: `fadeSlideUp 0.5s ease ${index * 0.05}s both`,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${tool.color}, ${tool.color}00)`, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "32px", filter: hovered ? "scale(1.1)" : "", transition: "0.3s" }}>{tool.logo}</span>
          <div>
            <h3 style={{ margin: 0, color: colors.text, fontSize: "17px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{tool.name}</h3>
            <span style={{ fontSize: "12px", color: colors.textMuted }}>{tool.company}</span>
          </div>
        </div>
        <TrendBadge trend={tool.trend} />
      </div>
      <p style={{ margin: "0 0 14px", color: colors.textMuted, fontSize: "13px", lineHeight: "1.6" }}>{tool.description}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
        {tool.features.slice(0, 3).map((f, i) => (
          <span key={i} style={{
            fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
            background: `${tool.color}15`, color: `${tool.color}cc`,
            border: `1px solid ${tool.color}22`,
          }}>{f}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: `1px solid ${colors.border}` }}>
        <Stars rating={tool.rating} />
        <span style={{ fontSize: "13px", color: colors.accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{tool.pricing}</span>
      </div>
    </div>
  );
};

// ─── AI-Powered Content Generator ───
const AIContentGenerator = ({ tool, onClose }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [streamPhase, setStreamPhase] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const generateContent = async () => {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `Write a concise SEO-optimized review of ${tool.name} by ${tool.company} in 2026. Include: 1) A compelling intro paragraph, 2) Top 3 pros, 3) Top 2 cons, 4) Who it's best for, 5) Verdict. Keep it under 400 words. Write in English. Use markdown formatting with ## headers. Be objective and data-driven. Mention pricing: ${tool.pricing}. Rating: ${tool.rating}/5.`
            }],
          }),
        });
        const data = await response.json();
        const text = data.content?.map(i => i.text || "").join("\n") || "";
        // Simulate streaming effect
        for (let i = 0; i < text.length; i += 3) {
          await new Promise(r => setTimeout(r, 8));
          setContent(text.slice(0, i + 3));
        }
        setContent(text);
      } catch (err) {
        // Fallback to pre-generated content
        setContent(`## ${tool.name} Review 2026\n\n${tool.description}\n\n### Pros\n- Industry-leading features in the ${tool.category} space\n- Competitive pricing at ${tool.pricing}\n- Growing user base of ${tool.users}\n\n### Cons\n- Learning curve for advanced features\n- Pricing may not suit all budgets\n\n### Best For\nProfessionals and teams looking for a reliable ${tool.category.toLowerCase()} solution with enterprise-grade capabilities.\n\n### Verdict\nWith a ${tool.rating}/5 rating and ${tool.trend} growth trend, ${tool.name} remains a top contender in ${tool.category}. ${tool.features.slice(0, 3).join(", ")} make it a compelling choice.`);
      } finally {
        setLoading(false);
      }
    };
    generateContent();
  }, [tool]);

  const renderMarkdown = (md) => {
    return md.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} style={{ color: colors.text, fontSize: "20px", margin: "20px 0 10px", fontFamily: "'Space Grotesk', sans-serif" }}>{line.replace("## ", "")}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} style={{ color: colors.accent, fontSize: "16px", margin: "16px 0 8px", fontFamily: "'Space Grotesk', sans-serif" }}>{line.replace("### ", "")}</h3>;
      if (line.startsWith("- ")) return <li key={i} style={{ color: colors.textMuted, fontSize: "14px", lineHeight: "1.8", marginLeft: "16px", listStyle: "none" }}><span style={{ color: colors.accent, marginRight: "8px" }}>→</span>{line.replace("- ", "")}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} style={{ color: colors.textMuted, fontSize: "14px", lineHeight: "1.8", margin: "6px 0" }}>{line}</p>;
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.3s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: "20px", maxWidth: "720px", width: "100%", maxHeight: "80vh",
        overflow: "auto", padding: "32px", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px", background: "none",
          border: `1px solid ${colors.border}`, color: colors.textMuted,
          width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer",
          fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <span style={{ fontSize: "40px" }}>{tool.logo}</span>
          <div>
            <h2 style={{ margin: 0, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{tool.name}</h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
              <Stars rating={tool.rating} />
              <TrendBadge trend={tool.trend} />
              <span style={{ fontSize: "12px", color: colors.textMuted }}>{tool.users} users</span>
            </div>
          </div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${tool.color}08, transparent)`,
          border: `1px solid ${tool.color}15`, borderRadius: "12px",
          padding: "6px 14px", marginBottom: "20px", display: "inline-flex",
          alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "10px", color: colors.accent, fontWeight: 700, letterSpacing: "1px" }}>AI-GENERATED REVIEW</span>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: loading ? colors.orange : colors.accent,
            animation: loading ? "pulse 1s infinite" : "none",
          }} />
        </div>
        <div style={{ minHeight: "200px" }}>
          {renderMarkdown(content)}
          {loading && <span style={{ display: "inline-block", width: "2px", height: "16px", background: colors.accent, animation: "blink 0.8s infinite", marginLeft: "2px", verticalAlign: "middle" }} />}
        </div>
        <AdSlot size="native" />
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: colors.purpleDim, color: colors.purple, border: `1px solid ${colors.purple}33` }}>CPC: {tool.cpc}</span>
          <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: `${colors.blue}15`, color: colors.blue, border: `1px solid ${colors.blue}33` }}>Category: {tool.category}</span>
          <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: `${colors.orange}15`, color: colors.orange, border: `1px solid ${colors.orange}33` }}>{tool.pricing}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Comparison Table (Programmatic SEO Gold) ───
const ComparisonSection = () => {
  const comparisons = generateComparisons();
  const [activeComp, setActiveComp] = useState(0);
  const comp = comparisons[activeComp] || comparisons[0];
  if (!comp) return null;

  return (
    <div style={{ marginTop: "60px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <span style={{ fontSize: "11px", letterSpacing: "3px", color: colors.accent, fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Programmatic SEO Engine</span>
        <h2 style={{ margin: "8px 0", color: colors.text, fontSize: "28px", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
          Head-to-Head Comparisons
        </h2>
        <p style={{ color: colors.textMuted, maxWidth: "500px", margin: "0 auto", fontSize: "14px" }}>
          Auto-generated comparison pages targeting long-tail keywords like "{comp.a.name} vs {comp.b.name}"
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "24px" }}>
        {comparisons.map((c, i) => (
          <button key={i} onClick={() => setActiveComp(i)} style={{
            background: i === activeComp ? colors.accent : colors.bgCard,
            color: i === activeComp ? colors.bg : colors.textMuted,
            border: `1px solid ${i === activeComp ? colors.accent : colors.border}`,
            padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
            fontSize: "12px", fontWeight: 600, transition: "all 0.2s",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {c.a.name} vs {c.b.name}
          </button>
        ))}
      </div>
      <div style={{
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: "16px", overflow: "hidden",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "180px 1fr 1fr",
          fontSize: "13px",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", background: colors.bg, borderBottom: `1px solid ${colors.border}`, fontWeight: 700, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "1px" }}>CRITERIA</div>
          <div style={{ padding: "16px 20px", background: colors.bg, borderBottom: `1px solid ${colors.border}`, textAlign: "center" }}>
            <span style={{ fontSize: "24px" }}>{comp.a.logo}</span>
            <div style={{ color: colors.text, fontWeight: 700, marginTop: "4px" }}>{comp.a.name}</div>
          </div>
          <div style={{ padding: "16px 20px", background: colors.bg, borderBottom: `1px solid ${colors.border}`, textAlign: "center" }}>
            <span style={{ fontSize: "24px" }}>{comp.b.logo}</span>
            <div style={{ color: colors.text, fontWeight: 700, marginTop: "4px" }}>{comp.b.name}</div>
          </div>
          {/* Rows */}
          {[
            ["Rating", <Stars rating={comp.a.rating} />, <Stars rating={comp.b.rating} />],
            ["Pricing", comp.a.pricing, comp.b.pricing],
            ["Users", comp.a.users, comp.b.users],
            ["CPC Value", comp.a.cpc, comp.b.cpc],
            ["Growth", <TrendBadge trend={comp.a.trend} />, <TrendBadge trend={comp.b.trend} />],
            ["Top Feature", comp.a.features[0], comp.b.features[0]],
          ].map(([label, va, vb], i) => (
            <React.Fragment key={i}>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontWeight: 600, fontSize: "12px" }}>{label}</div>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.border}`, textAlign: "center", color: colors.text }}>{va}</div>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.border}`, textAlign: "center", color: colors.text }}>{vb}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <span style={{ fontSize: "11px", color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
          🔄 {comparisons.length} comparison pages auto-generated · Each targets unique long-tail keywords
        </span>
      </div>
    </div>
  );
};

// ─── SEO Metrics Dashboard ───
const SEODashboard = () => {
  const metrics = [
    { label: "Est. Monthly Pageviews", value: "450K+", icon: "📈", color: colors.accent },
    { label: "Avg. CPC (Ad Revenue)", value: "$9.80", icon: "💰", color: colors.orange },
    { label: "Auto-Generated Pages", value: "200+", icon: "⚡", color: colors.purple },
    { label: "Long-tail Keywords", value: "2,400+", icon: "🎯", color: colors.blue },
    { label: "Est. Monthly Revenue", value: "$4,400+", icon: "🏦", color: "#10b981" },
    { label: "Domain Authority Target", value: "45+", icon: "🏆", color: colors.red },
  ];
  return (
    <div style={{ marginTop: "60px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <span style={{ fontSize: "11px", letterSpacing: "3px", color: colors.orange, fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Monetization Dashboard</span>
        <h2 style={{ margin: "8px 0", color: colors.text, fontSize: "28px", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Revenue Projections</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            background: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: "12px", padding: "20px", textAlign: "center",
            animation: `fadeSlideUp 0.5s ease ${i * 0.08}s both`,
          }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>{m.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
            <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Schema.org Structured Data Preview ───
const SchemaPreview = () => (
  <div style={{ marginTop: "48px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "20px", overflow: "auto" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: colors.accentDim, color: colors.accent, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>JSON-LD</span>
      <span style={{ fontSize: "12px", color: colors.textMuted }}>Structured Data for Rich Snippets</span>
    </div>
    <pre style={{
      margin: 0, fontSize: "11px", lineHeight: "1.7", color: colors.textMuted,
      fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap",
    }}>
{`{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${SITE_NAME}",
  "description": "Compare AI tools side-by-side with real data",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://aitoolscope.com/search?q={query}",
    "query-input": "required name=query"
  },
  "hasPart": [
    ${AI_TOOLS_DB.slice(0, 3).map(t => `{
      "@type": "SoftwareApplication",
      "name": "${t.name}",
      "applicationCategory": "${t.category}",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${t.rating}",
        "bestRating": "5"
      }
    }`).join(",\n    ")}
  ]
}`}
    </pre>
  </div>
);

// ─── Main App ───
export default function AIToolScope() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const filteredTools = AI_TOOLS_DB.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || t.company.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", color: colors.text, fontFamily: "'Space Grotesk', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.bg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          30% { transform: translate(3%, -15%); }
          50% { transform: translate(-15%, 5%); }
          70% { transform: translate(12%, 10%); }
          90% { transform: translate(5%, 5%); }
        }
      `}</style>

      {/* ─── Grain Overlay ─── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* ─── Navbar ─── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrollY > 50 ? `${colors.bg}ee` : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? `1px solid ${colors.border}` : "1px solid transparent",
        transition: "all 0.3s", padding: "14px 24px",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: 900, color: colors.bg,
            }}>A</div>
            <span style={{ fontWeight: 800, fontSize: "18px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.5px" }}>
              <span style={{ color: colors.accent }}>AI</span>
              <span style={{ color: colors.text }}>ToolScope</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {["Tools", "Compare", "Blog", "API"].map(item => (
              <a key={item} href="#" style={{ color: colors.textMuted, textDecoration: "none", fontSize: "13px", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = colors.accent}
                onMouseLeave={e => e.target.style.color = colors.textMuted}
              >{item}</a>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* ─── Hero ─── */}
        <header style={{ textAlign: "center", padding: "60px 0 40px", position: "relative" }}>
          <div style={{
            position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)",
            width: "600px", height: "300px",
            background: `radial-gradient(ellipse at center, ${colors.accentDim} 0%, transparent 70%)`,
            filter: "blur(60px)", pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 16px", borderRadius: "20px", marginBottom: "20px",
              background: colors.bgCard, border: `1px solid ${colors.border}`,
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors.accent, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "12px", color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                {AI_TOOLS_DB.length} tools tracked · Updated daily with AI
              </span>
            </div>
            <h1 style={{
              fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1,
              margin: "0 0 16px", fontFamily: "'Space Grotesk', sans-serif",
              background: `linear-gradient(135deg, ${colors.text} 0%, ${colors.accent} 50%, ${colors.purple} 100%)`,
              backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "gradientShift 6s ease infinite",
            }}>
              Compare Every AI Tool.<br />Decide in Seconds.
            </h1>
            <p style={{ color: colors.textMuted, fontSize: "16px", maxWidth: "550px", margin: "0 auto 28px", lineHeight: "1.7" }}>
              Real-time comparisons, AI-generated reviews, and data-driven insights for {AI_TOOLS_DB.length}+ tools. Powered by programmatic SEO for maximum organic reach.
            </p>
            {/* Search */}
            <div style={{
              maxWidth: "560px", margin: "0 auto", position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: "-1px", borderRadius: "14px",
                background: `linear-gradient(135deg, ${colors.accent}44, ${colors.purple}44)`,
                zIndex: 0, filter: "blur(1px)",
              }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tools, categories, or companies..."
                style={{
                  width: "100%", padding: "16px 20px 16px 48px",
                  background: colors.bgCard, border: `1px solid ${colors.border}`,
                  borderRadius: "14px", color: colors.text, fontSize: "15px",
                  outline: "none", position: "relative", zIndex: 1,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              />
              <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", zIndex: 2, opacity: 0.5 }}>🔍</span>
            </div>
          </div>
        </header>

        <AdSlot size="banner" />

        {/* ─── Category Filters ─── */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", margin: "20px 0 32px" }}>
          {["All", ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              background: activeCategory === cat ? `linear-gradient(135deg, ${colors.accent}, ${colors.purple})` : colors.bgCard,
              color: activeCategory === cat ? colors.bg : colors.textMuted,
              border: `1px solid ${activeCategory === cat ? "transparent" : colors.border}`,
              padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
              fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ─── Tools Grid ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} onClick={setSelectedTool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textDim }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <p>No tools found for "{search}"</p>
          </div>
        )}

        <AdSlot size="sidebar" />

        {/* ─── Comparison Section ─── */}
        <ComparisonSection />

        <AdSlot size="native" />

        {/* ─── SEO Dashboard ─── */}
        <SEODashboard />

        {/* ─── How It Works: Programmatic Content ─── */}
        <div style={{ marginTop: "60px", textAlign: "center" }}>
          <span style={{ fontSize: "11px", letterSpacing: "3px", color: colors.purple, fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Content Engine</span>
          <h2 style={{ margin: "8px 0 32px", color: colors.text, fontSize: "28px", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>How Auto-Generation Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", textAlign: "left" }}>
            {[
              { icon: "🗄️", title: "Data Pipeline", desc: "12+ AI tools tracked with real-time pricing, features, ratings & user counts from public APIs and scraping." },
              { icon: "🤖", title: "AI Content Layer", desc: "Claude API generates unique reviews, comparisons & SEO-optimized descriptions for every tool and matchup." },
              { icon: "📐", title: "Template Engine", desc: "Programmatic pages built from templates: /tool/[name], /compare/[a]-vs-[b], /category/[type], /best-[use-case]." },
              { icon: "🔗", title: "Internal Linking", desc: "Auto-generated contextual links between tools, comparisons and categories. 10+ internal links per page." },
              { icon: "📊", title: "Schema Markup", desc: "JSON-LD for SoftwareApplication, Review, FAQ, and Comparison structured data. Rich snippets in SERPs." },
              { icon: "💰", title: "Monetization", desc: "Strategic ad placements: leaderboard, sidebar, native, sticky. Affiliate links. Newsletter. Sponsored reviews." },
            ].map((item, i) => (
              <div key={i} style={{
                background: colors.bgCard, border: `1px solid ${colors.border}`,
                borderRadius: "14px", padding: "24px",
                animation: `fadeSlideUp 0.5s ease ${i * 0.08}s both`,
              }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{item.icon}</div>
                <h3 style={{ color: colors.text, fontSize: "15px", margin: "0 0 8px", fontWeight: 700 }}>{item.title}</h3>
                <p style={{ color: colors.textMuted, fontSize: "13px", lineHeight: "1.7", margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Schema Preview ─── */}
        <SchemaPreview />

        {/* ─── URL Structure Preview ─── */}
        <div style={{ marginTop: "48px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ color: colors.text, fontSize: "16px", marginBottom: "16px", fontFamily: "'JetBrains Mono', monospace" }}>📁 Programmatic URL Structure</h3>
          <div style={{ display: "grid", gap: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
            {[
              { url: "/tools/", desc: "Directory (12+ pages)", count: "12" },
              { url: "/tools/chatgpt/", desc: "Individual tool pages", count: "12" },
              { url: "/compare/chatgpt-vs-claude/", desc: "Comparison pages", count: `${generateComparisons().length}` },
              { url: "/category/chatbot/", desc: "Category hubs", count: `${CATEGORIES.length}` },
              { url: "/best-ai-tools-for-coding/", desc: "Use-case landing pages", count: "20+" },
              { url: "/blog/ai-tools-weekly/", desc: "Auto-generated blog posts", count: "52/yr" },
              { url: "/pricing/chatgpt-pricing-2026/", desc: "Pricing pages (high CPC)", count: "12" },
              { url: "/alternatives/chatgpt-alternatives/", desc: "Alternative pages", count: "12" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "8px", background: i % 2 === 0 ? `${colors.bg}88` : "transparent" }}>
                <span style={{ color: colors.accent, flex: "0 0 300px" }}>{item.url}</span>
                <span style={{ color: colors.textMuted, flex: 1 }}>{item.desc}</span>
                <span style={{ color: colors.purple, fontWeight: 700 }}>{item.count}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "16px", padding: "12px 16px", background: `${colors.accent}08`, borderRadius: "8px", border: `1px solid ${colors.accentDim}` }}>
            <span style={{ fontSize: "12px", color: colors.accent, fontWeight: 600 }}>Total estimated pages: 200+ auto-generated · Each targeting unique long-tail keywords</span>
          </div>
        </div>

        <AdSlot size="banner" />

        {/* ─── Footer ─── */}
        <footer style={{ marginTop: "80px", paddingBottom: "40px", borderTop: `1px solid ${colors.border}`, paddingTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "7px",
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 900, color: colors.bg,
                }}>A</div>
                <span style={{ fontWeight: 800, fontSize: "16px", fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: colors.accent }}>AI</span>ToolScope
                </span>
              </div>
              <p style={{ color: colors.textDim, fontSize: "12px", maxWidth: "280px", lineHeight: "1.6" }}>
                The definitive AI tools comparison platform. Auto-updated daily with AI-generated insights and real-time data.
              </p>
            </div>
            <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
              {[
                { title: "Tools", links: ["All Tools", "Chatbots", "Image Gen", "Code", "Video", "Audio"] },
                { title: "Resources", links: ["Blog", "API Docs", "Newsletter", "Affiliate Program"] },
                { title: "Company", links: ["About", "Contact", "Privacy", "Terms"] },
              ].map((section, i) => (
                <div key={i}>
                  <h4 style={{ color: colors.textMuted, fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px", fontFamily: "'JetBrains Mono', monospace" }}>{section.title}</h4>
                  {section.links.map((link, j) => (
                    <a key={j} href="#" style={{ display: "block", color: colors.textDim, textDecoration: "none", fontSize: "13px", marginBottom: "8px", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = colors.accent}
                      onMouseLeave={e => e.target.style.color = colors.textDim}
                    >{link}</a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: colors.textDim }}>© 2026 AIToolScope. Powered by programmatic SEO & AI content generation.</span>
            <div style={{ display: "flex", gap: "12px" }}>
              {["Mediavine", "Raptive", "Ezoic", "AdThrive"].map((ad, i) => (
                <span key={i} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", background: colors.bgCard, color: colors.textDim, border: `1px solid ${colors.border}` }}>{ad}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ─── Tool Detail Modal ─── */}
      {selectedTool && <AIContentGenerator tool={selectedTool} onClose={() => setSelectedTool(null)} />}
    </div>
  );
}

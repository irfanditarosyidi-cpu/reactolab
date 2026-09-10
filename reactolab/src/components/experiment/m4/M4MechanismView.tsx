"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = 0 | 1 | 2 | 3;

const STEPS = [
  {
    title: "Adsorpsi H₂O₂",
    caption: "H₂O₂ menempel pada dua situs aktif Mn(IV).",
  },
  {
    title: "Aktivasi ikatan",
    caption: "Ikatan O–O dan O–H meregang sehingga lebih mudah putus.",
  },
  {
    title: "Reaksi & reduksi",
    caption: "H₂O dan O₂ terbentuk; satu Mn(IV) sementara menjadi Mn(III).",
  },
  {
    title: "Regenerasi katalis",
    caption: "Mn teroksidasi kembali dan permukaan siap digunakan lagi.",
  },
] as const;

const ALT_STEPS = {
  tanpa: ["2 H₂O₂ saling mendekat", "Tumbukan berenergi tinggi", "Ikatan putus & tersusun ulang", "2 H₂O + O₂ terbentuk"],
  fecl3: ["2 H₂O₂ bertemu ion Fe", "Fe³⁺/Fe²⁺ membantu transfer", "Ikatan putus & tersusun ulang", "2 H₂O + O₂; Fe pulih"],
  katalase: ["2 H₂O₂ masuk sisi aktif", "Katalase mengikat substrat", "Ikatan putus & tersusun ulang", "2 H₂O + O₂; enzim pulih"],
} as const;

function H2O2Mini({ x, y, opacity = 1, weak = false, scale = 1 }: { x: number; y: number; opacity?: number; weak?: boolean; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <line x1="-48" y1="-15" x2="-21" y2="0" stroke="#e2e8f0" strokeWidth="6"/><line x1="-21" y1="0" x2="21" y2="0" stroke={weak?"#fbbf24":"#fecaca"} strokeWidth={weak?2:6} strokeDasharray={weak?"6 5":undefined}/><line x1="21" y1="0" x2="48" y2="-15" stroke="#e2e8f0" strokeWidth="6"/>
    <circle cx="-52" cy="-18" r="11" fill="#cbd5e1"/><circle cx="-22" r="20" fill="#dc2626"/><circle cx="22" r="20" fill="#dc2626"/><circle cx="52" cy="-18" r="11" fill="#cbd5e1"/>
    <text x="-22" y="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">O</text><text x="22" y="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">O</text><text x="-52" y="-14" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="900">H</text><text x="52" y="-14" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="900">H</text>
  </g>;
}

function BalancedProducts({ opacity, rise = 0 }: { opacity: number; rise?: number }) {
  return <g opacity={opacity} transform={`translate(0 ${-rise})`}>
    {[205,325].map(x=><g key={x} transform={`translate(${x} 205)`}><line x1="-27" y1="-13" x2="0" y2="4" stroke="#e2e8f0" strokeWidth="6"/><line x1="0" y1="4" x2="27" y2="-13" stroke="#e2e8f0" strokeWidth="6"/><circle r="20" cy="4" fill="#dc2626"/><circle cx="-31" cy="-16" r="11" fill="#cbd5e1"/><circle cx="31" cy="-16" r="11" fill="#cbd5e1"/><text y="9" textAnchor="middle" fill="white" fontWeight="900">O</text><text y="-40" textAnchor="middle" fill="white" fontSize="11" fontWeight="900">H₂O</text></g>)}
    <g transform="translate(485 205)"><line x1="-23" x2="23" stroke="#fecaca" strokeWidth="5"/><line x1="-23" y1="7" x2="23" y2="7" stroke="#fecaca" strokeWidth="4"/><circle cx="-25" cy="3" r="20" fill="#dc2626"/><circle cx="25" cy="3" r="20" fill="#dc2626"/><text x="-25" y="8" textAnchor="middle" fill="white" fontWeight="900">O</text><text x="25" y="8" textAnchor="middle" fill="white" fontWeight="900">O</text><text y="-38" textAnchor="middle" fill="white" fontSize="11" fontWeight="900">O₂ ↑</text></g>
    <text x="340" y="274" textAnchor="middle" fill="#a7f3d0" fontSize="15" fontWeight="900">2 H₂O₂ → 2 H₂O + O₂</text>
  </g>;
}

function AltMechanismView({ mode, progress, catalystLabel }: { mode: keyof typeof ALT_STEPS; progress: number; catalystLabel: string }) {
  const active = Math.min(3, Math.floor(Math.max(0, progress) * 4));
  const within = Math.min(1, Math.max(0, progress * 4 - active));
  const steps = ALT_STEPS[mode];
  const isNone = mode === "tanpa";
  const isIron = mode === "fecl3";
  const accent = isNone ? "#38bdf8" : isIron ? "#fb923c" : "#34d399";
  const title = isNone ? "Penguraian H₂O₂ tanpa katalis" : isIron ? "Katalisis homogen oleh FeCl₃" : "Penguraian H₂O₂ oleh enzim katalase";
  const subtitle = isNone ? "Hanya sebagian kecil tumbukan memiliki energi yang cukup untuk memutus ikatan." : isIron ? "Ion Fe³⁺/Fe²⁺ berpindah elektron di dalam larutan dan membentuk siklus katalitik." : "Sisi aktif katalase mengikat H₂O₂ secara selektif, kemudian melepas H₂O dan O₂.";
  const approach = active === 0 ? within * 105 : 105;
  const products = active >= 2 ? Math.min(1, active === 2 ? within * 2.5 : 1) : 0;
  const reactantFade = active < 2 ? 1 : Math.max(0, 1 - within * 3);
  return <div className="bg-white">
    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 py-3 pl-4 pr-16 text-white"><p className="text-[10px] font-black uppercase tracking-[.2em]" style={{color:accent}}>Tampilan submikroskopik · {catalystLabel}</p><h4 className="mt-0.5 text-sm font-black sm:text-base">{title}</h4><p className="mt-1 text-[11px] text-slate-300">{subtitle}</p></div>
    <div className="relative overflow-hidden bg-[#071a38]">
      <svg viewBox="0 0 680 430" className="block aspect-[4/3] w-full sm:aspect-[680/430]" role="img" aria-label={`${title}, ${steps[active]}`}>
        <defs><radialGradient id={`ao-${mode}`}><stop stopColor="#fb7185"/><stop offset="1" stopColor="#991b1b"/></radialGradient><radialGradient id={`ah-${mode}`}><stop stopColor="#fff"/><stop offset="1" stopColor="#94a3b8"/></radialGradient><radialGradient id="enzyme"><stop stopColor="#6ee7b7"/><stop offset=".65" stopColor="#059669"/><stop offset="1" stopColor="#064e3b"/></radialGradient></defs>
        <rect width="680" height="430" fill="#071a38"/>{Array.from({length:25},(_,i)=><circle key={i} cx={20+(i*89)%660} cy={25+(i*61)%390} r={2+i%3} fill="#7dd3fc" opacity=".14"/>)}
        {isNone && <>
          {Array.from({length:7},(_,i)=><g key={i} transform={`translate(${75+(i%4)*165} ${90+Math.floor(i/4)*205}) rotate(${i*31})`} opacity={i===2?.35:.75}><line x1="-22" y1="0" x2="22" y2="0" stroke="#fecaca" strokeWidth="5"/><circle cx="-24" r="15" fill={`url(#ao-${mode})`}/><circle cx="24" r="15" fill={`url(#ao-${mode})`}/><circle cx="-47" cy="-15" r="9" fill={`url(#ah-${mode})`}/><circle cx="47" cy="15" r="9" fill={`url(#ah-${mode})`}/></g>)}
          <H2O2Mini x={190+approach} y={185} opacity={reactantFade} weak={active===1}/><H2O2Mini x={490-approach} y={255} opacity={reactantFade} weak={active===1} scale={.9}/>
          {products>0&&<BalancedProducts opacity={products} rise={products*72}/>} 
          <text x="340" y="385" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="800">Reaksi lambat · energi aktivasi tinggi · tumbukan efektif jarang</text>
        </>}
        {isIron && <>
          <g transform={`translate(${115+approach} 210)`}><circle r="38" fill={active===1?"#60a5fa":"#f97316"} stroke="#fed7aa" strokeWidth="3"/><text y="5" textAnchor="middle" fill="white" fontSize="16" fontWeight="900">{active===1||active===2?"Fe²⁺":"Fe³⁺"}</text></g>
          <H2O2Mini x={490-approach} y={185} opacity={reactantFade} weak={active===1}/><H2O2Mini x={500-approach} y={265} opacity={reactantFade} weak={active===1} scale={.85}/>
          {(active===1||active===2)&&<><path d="M285 160h105" stroke="#fbbf24" strokeWidth="3" strokeDasharray="7 6"/><path d="m390 160-14-8v16Z" fill="#fbbf24"/><text x="337" y="145" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="900">TRANSFER e⁻</text></>}
          {products>0&&<BalancedProducts opacity={products} rise={products*75}/>} 
          <path d="M185 315 Q340 365 495 315" fill="none" stroke="#fb923c" strokeWidth="3" strokeDasharray="8 7"/><text x="340" y="354" textAnchor="middle" fill="#fdba74" fontSize="12" fontWeight="900">Fe³⁺ ⇄ Fe²⁺ · katalis homogen diregenerasi</text>
        </>}
        {mode==="katalase"&&<>
          <path d="M170 95 C105 145 112 292 208 339 C288 379 371 321 386 264 C407 186 348 100 270 82 C234 73 197 78 170 95Z" fill="url(#enzyme)" stroke="#6ee7b7" strokeWidth="4"/><path d="M260 137 C309 127 342 161 331 201 C320 238 282 242 251 217 C225 195 228 150 260 137Z" fill="#052e2b" stroke="#a7f3d0" strokeWidth="3"/><text x="240" y="307" textAnchor="middle" fill="#d1fae5" fontSize="15" fontWeight="900">ENZIM KATALASE</text>
          <H2O2Mini x={545-approach*2.25} y={165} opacity={reactantFade} weak={active===1}/><H2O2Mini x={575-approach*2.3} y={245} opacity={reactantFade} weak={active===1} scale={.82}/>
          {active===1&&<text x="284" y="122" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="900">KOMPLEKS ENZIM–SUBSTRAT</text>}
          {products>0&&<BalancedProducts opacity={products} rise={products*75}/>} 
          <text x="500" y="365" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="900">Bentuk enzim tetap · dapat digunakan kembali</text>
        </>}
        <g><rect x="18" y="18" width="250" height="48" rx="13" fill="#020617" fillOpacity=".78" stroke={accent}/><text x="34" y="38" fill={accent} fontSize="9" fontWeight="900" letterSpacing="1">TAHAP {active+1} DARI 4</text><text x="34" y="56" fill="white" fontSize="13" fontWeight="900">{steps[active]}</text></g>
      </svg>
    </div>
    <div className="grid grid-cols-4 border-t border-slate-200 bg-slate-50">{steps.map((step,index)=><div key={step} className={cn("relative border-r border-slate-200 px-1 py-2 text-center last:border-0",index===active&&"bg-blue-50")}><span className={cn("mx-auto grid h-6 w-6 place-items-center rounded-full text-[10px] font-black",index<active||progress>=1?"bg-emerald-500 text-white":index===active?"bg-blue-600 text-white":"bg-slate-200 text-slate-400")}>{index<active||progress>=1?<CheckCircle2 className="h-3.5 w-3.5"/>:index+1}</span><p className="mt-1 hidden text-[9px] font-black text-slate-600 sm:block">{step}</p>{index===active&&<i className="absolute inset-x-0 bottom-0 h-1" style={{backgroundColor:accent,transform:`scaleX(${within})`,transformOrigin:"left"}}/>}</div>)}</div>
    <div className="border-t border-slate-200 bg-white px-3 py-2 text-[10px] leading-relaxed text-slate-500"><b className="text-slate-700">Model konseptual:</b> animasi menyederhanakan rangkaian reaksi untuk memperlihatkan perbedaan jalur dan regenerasi katalis.</div>
  </div>;
}

function Atom({
  x,
  y,
  kind,
  label,
  muted = false,
}: {
  x: number;
  y: number;
  kind: "h" | "o" | "mn" | "mn3";
  label: string;
  muted?: boolean;
}) {
  const radius = kind === "h" ? 13 : kind.startsWith("mn") ? 19 : 18;
  const fill = kind === "h" ? "url(#m4-h)" : kind === "o" ? "url(#m4-o)" : kind === "mn3" ? "url(#m4-mn3)" : "url(#m4-mn)";
  return (
    <g opacity={muted ? 0.38 : 1}>
      <circle cx={x} cy={y} r={radius + 3} fill="#fff" opacity=".75" />
      <circle cx={x} cy={y} r={radius} fill={fill} stroke="#fff" strokeWidth="1.5" />
      <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={kind === "h" ? 12 : kind.startsWith("mn") ? 11 : 14} fontWeight="800">{label}</text>
    </g>
  );
}

function Bond({ x1, y1, x2, y2, weak = false, double = false }: { x1: number; y1: number; x2: number; y2: number; weak?: boolean; double?: boolean }) {
  const props = { stroke: weak ? "#f59e0b" : "#64748b", strokeWidth: weak ? 2 : 4, strokeLinecap: "round" as const, strokeDasharray: weak ? "5 5" : undefined };
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} {...props} />{double && <line x1={x1} y1={y1 + 7} x2={x2} y2={y2 + 7} {...props} />}</g>;
}

function Surface({ reduced = false }: { reduced?: boolean }) {
  return (
    <g>
      <path d="M15 144 Q45 125 76 143 T138 141 T201 143 T265 139 T325 145 V190 H15Z" fill="url(#m4-surface)" stroke="#64748b" strokeWidth="1.5" />
      {[35, 66, 96, 127, 158, 190, 220, 250, 283, 310].map((x, i) => <circle key={x} cx={x} cy={153 + (i % 3) * 12} r="8" fill={i % 2 ? "#ef4444" : "#94a3b8"} opacity=".8" />)}
      <Bond x1={118} y1={140} x2={118} y2={121} weak />
      <Bond x1={222} y1={140} x2={222} y2={121} weak />
      <Atom x={118} y={119} kind={reduced ? "mn3" : "mn"} label="Mn" />
      <Atom x={222} y={119} kind="mn" label="Mn" />
      <text x="118" y="103" textAnchor="middle" fill={reduced ? "#166534" : "#5b21b6"} fontSize="10" fontWeight="800">{reduced ? "Mn(III)" : "Mn(IV)"}</text>
      <text x="222" y="103" textAnchor="middle" fill="#5b21b6" fontSize="10" fontWeight="800">Mn(IV)</text>
    </g>
  );
}

function Molecule({ weak = false }: { weak?: boolean }) {
  return (
    <g>
      <Bond x1={110} y1={54} x2={148} y2={74} weak={weak} />
      <Bond x1={148} y1={74} x2={194} y2={74} weak={weak} />
      <Bond x1={194} y1={74} x2={232} y2={54} weak={weak} />
      <Atom x={105} y={50} kind="h" label="H" />
      <Atom x={151} y={75} kind="o" label="O" />
      <Atom x={191} y={75} kind="o" label="O" />
      <Atom x={237} y={50} kind="h" label="H" />
      <Bond x1={151} y1={94} x2={120} y2={113} weak />
      <Bond x1={191} y1={94} x2={220} y2={113} weak />
      {weak && <text x="171" y="28" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="800">O–O meregang</text>}
    </g>
  );
}

function Diagram({ stage }: { stage: Stage }) {
  return (
    <svg viewBox="0 0 340 190" className="h-auto w-full" role="img" aria-label={STEPS[stage].title}>
      <defs>
        <radialGradient id="m4-h" cx="35%" cy="28%"><stop stopColor="#fff"/><stop offset="1" stopColor="#94a3b8"/></radialGradient>
        <radialGradient id="m4-o" cx="35%" cy="28%"><stop stopColor="#fb7185"/><stop offset="1" stopColor="#b91c1c"/></radialGradient>
        <radialGradient id="m4-mn" cx="35%" cy="28%"><stop stopColor="#c4b5fd"/><stop offset="1" stopColor="#6d28d9"/></radialGradient>
        <radialGradient id="m4-mn3" cx="35%" cy="28%"><stop stopColor="#86efac"/><stop offset="1" stopColor="#15803d"/></radialGradient>
        <linearGradient id="m4-surface" x1="0" x2="1"><stop stopColor="#cbd5e1"/><stop offset=".5" stopColor="#64748b"/><stop offset="1" stopColor="#cbd5e1"/></linearGradient>
        <marker id="m4-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#2563eb"/></marker>
      </defs>
      <rect width="340" height="190" rx="16" fill="#f8fafc" />
      {stage === 0 && <><Molecule /><Surface /></>}
      {stage === 1 && <><Molecule weak /><Surface /><text x="171" y="105" textAnchor="middle" fill="#b45309" fontSize="10" fontWeight="700">ikatan O–H melemah</text></>}
      {stage === 2 && <>
        <Surface reduced />
        <g><Bond x1={62} y1={55} x2={90} y2={72}/><Bond x1={90} y1={72} x2={118} y2={55}/><Atom x={57} y={51} kind="h" label="H"/><Atom x={90} y={72} kind="o" label="O"/><Atom x={123} y={51} kind="h" label="H"/><text x="90" y="28" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">H₂O</text></g>
        <g><Bond x1={226} y1={63} x2={270} y2={63} double/><Atom x={226} y={63} kind="o" label="O"/><Atom x={270} y={63} kind="o" label="O"/><text x="248" y="28" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">O₂</text></g>
        <path d="M91 105 91 86M248 105 248 86" stroke="#2563eb" strokeWidth="3" markerEnd="url(#m4-arrow)" />
      </>}
      {stage === 3 && <><Molecule /><Surface /><path d="M42 33 C12 72 16 122 45 143" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="6 5" markerEnd="url(#m4-arrow)"/><text x="48" y="91" fill="#047857" fontSize="10" fontWeight="800" transform="rotate(-90 48 91)">SIKLUS BERULANG</text></>}
    </svg>
  );
}

export default function M4MechanismView({ progress, catalystLabel }: { progress: number; catalystLabel: string }) {
  const active = Math.min(3, Math.floor(Math.max(0, progress) * 4)) as Stage;
  const within = Math.min(1, Math.max(0, progress * 4 - active));
  const isMnO2 = catalystLabel.toLowerCase().includes("mno");
  const lowerLabel = catalystLabel.toLowerCase();

  if (!isMnO2) {
    const mode: keyof typeof ALT_STEPS = lowerLabel.includes("fecl")
      ? "fecl3"
      : lowerLabel.includes("hati") || lowerLabel.includes("katalase")
        ? "katalase"
        : "tanpa";
    return <AltMechanismView mode={mode} progress={progress} catalystLabel={catalystLabel} />;
  }

  const approachY = active === 0 ? -86 + within * 58 : -28;
  const oxygenGap = active === 1 ? 42 + within * 34 : 42;
  const reactantOpacity = active < 2 ? 1 : Math.max(0, 1 - within * 3);
  const productOpacity = active === 2 ? Math.min(1, within * 3) : active > 2 ? Math.max(0, 1 - within * 1.6) : 0;
  const productRise = active === 2 ? within * 82 : active > 2 ? 100 + within * 45 : 0;
  const regenerated = active === 3 && within > .58;

  const surfaceAtoms = Array.from({ length: 46 }, (_, i) => ({
    x: 18 + (i % 12) * 52 + (Math.floor(i / 12) % 2) * 19,
    y: 290 + Math.floor(i / 12) * 34 + Math.sin(i * 2.7) * 8,
    kind: i % 4 === 0 ? "mn" : "o",
    r: i % 4 === 0 ? 17 : 13,
  }));

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 py-3 pl-4 pr-16 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Tampilan submikroskopik</p>
        <h4 className="mt-0.5 text-sm font-black sm:text-base">Mekanisme dekomposisi H₂O₂ pada permukaan MnO₂</h4>
        <p className="mt-1 text-[11px] text-slate-300">Permukaan berpori menyediakan situs aktif Mn dan O untuk jalur reaksi berenergi aktivasi lebih rendah.</p>
      </div>

      <div className="relative overflow-hidden bg-[#071a38]">
        <svg viewBox="0 0 680 430" className="block aspect-[4/3] w-full sm:aspect-[680/430]" role="img" aria-label={`Animasi ${STEPS[active].title}`}>
          <defs>
            <radialGradient id="live-o"><stop stopColor="#fb7185"/><stop offset=".65" stopColor="#dc2626"/><stop offset="1" stopColor="#7f1d1d"/></radialGradient>
            <radialGradient id="live-h"><stop stopColor="#fff"/><stop offset=".72" stopColor="#cbd5e1"/><stop offset="1" stopColor="#64748b"/></radialGradient>
            <radialGradient id="live-mn"><stop stopColor="#ddd6fe"/><stop offset=".65" stopColor="#7c3aed"/><stop offset="1" stopColor="#3b0764"/></radialGradient>
            <radialGradient id="live-mn3"><stop stopColor="#bbf7d0"/><stop offset=".65" stopColor="#16a34a"/><stop offset="1" stopColor="#14532d"/></radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="water-bg" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0c4a6e" stopOpacity=".15"/><stop offset="1" stopColor="#38bdf8" stopOpacity=".22"/></linearGradient>
          </defs>
          <rect width="680" height="430" fill="url(#water-bg)"/>
          {Array.from({length:18},(_,i)=><circle key={`sol${i}`} cx={25+(i*83)%650} cy={38+(i*47)%230} r={2+(i%3)} fill="#7dd3fc" opacity={.12+(i%4)*.05}/>) }
          <text x="24" y="32" fill="#7dd3fc" fontSize="10" fontWeight="800" letterSpacing="2">LARUTAN H₂O₂</text>

          <g opacity={reactantOpacity} style={{ transform: `translateY(${approachY}px)`, transformOrigin: "340px 190px", transition: "transform 120ms linear" }}>
            <line x1="265" y1="180" x2={340-oxygenGap/2} y2="205" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round"/>
            <line x1={340-oxygenGap/2} y1="205" x2={340+oxygenGap/2} y2="205" stroke={active===1?"#fbbf24":"#fecaca"} strokeWidth={active===1?3:7} strokeDasharray={active===1?"8 7":undefined}/>
            <line x1={340+oxygenGap/2} y1="205" x2="415" y2="180" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round"/>
            <circle cx="258" cy="176" r="15" fill="url(#live-h)"/><circle cx={340-oxygenGap/2} cy="205" r="24" fill="url(#live-o)" stroke="#fecaca" strokeWidth="2"/><circle cx={340+oxygenGap/2} cy="205" r="24" fill="url(#live-o)" stroke="#fecaca" strokeWidth="2"/><circle cx="422" cy="176" r="15" fill="url(#live-h)"/>
            <text x={340-oxygenGap/2} y="211" textAnchor="middle" fill="white" fontWeight="900">O</text><text x={340+oxygenGap/2} y="211" textAnchor="middle" fill="white" fontWeight="900">O</text><text x="258" y="181" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="900">H</text><text x="422" y="181" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="900">H</text>
            {active===1&&<><path d="M325 170l15-20 15 20" fill="none" stroke="#fbbf24" strokeWidth="3"/><text x="340" y="139" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="900">IKATAN MEREGANG</text></>}
          </g>
          <H2O2Mini x={520} y={260+approachY} opacity={reactantOpacity} weak={active===1} scale={.72}/>

          <g opacity={productOpacity} style={{ transform:`translateY(${-productRise}px)`, transition:"transform 120ms linear" }}>
            <g transform="translate(125 215)"><line x1="-29" y1="-14" x2="0" y2="5" stroke="#e2e8f0" strokeWidth="6"/><line x1="0" y1="5" x2="29" y2="-14" stroke="#e2e8f0" strokeWidth="6"/><circle cx="0" cy="5" r="22" fill="url(#live-o)"/><circle cx="-34" cy="-17" r="13" fill="url(#live-h)"/><circle cx="34" cy="-17" r="13" fill="url(#live-h)"/><text y="11" textAnchor="middle" fill="white" fontWeight="900">O</text><text x="0" y="-42" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">H₂O</text></g>
            <g transform="translate(230 215)"><line x1="-29" y1="-14" x2="0" y2="5" stroke="#e2e8f0" strokeWidth="6"/><line x1="0" y1="5" x2="29" y2="-14" stroke="#e2e8f0" strokeWidth="6"/><circle cx="0" cy="5" r="22" fill="url(#live-o)"/><circle cx="-34" cy="-17" r="13" fill="url(#live-h)"/><circle cx="34" cy="-17" r="13" fill="url(#live-h)"/><text y="11" textAnchor="middle" fill="white" fontWeight="900">O</text><text x="0" y="-42" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">H₂O</text></g>
            <g transform="translate(450 215)"><line x1="-21" y1="0" x2="21" y2="0" stroke="#fecaca" strokeWidth="5"/><line x1="-21" y1="7" x2="21" y2="7" stroke="#fecaca" strokeWidth="4"/><circle cx="-24" cy="3" r="22" fill="url(#live-o)"/><circle cx="24" cy="3" r="22" fill="url(#live-o)"/><text x="-24" y="9" textAnchor="middle" fill="white" fontWeight="900">O</text><text x="24" y="9" textAnchor="middle" fill="white" fontWeight="900">O</text><text y="-35" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">O₂ ↑</text></g>
            <text x="340" y="275" textAnchor="middle" fill="#a7f3d0" fontSize="14" fontWeight="900">2 H₂O₂ → 2 H₂O + O₂</text>
          </g>

          <path d="M0 312 Q85 268 160 309 T324 302 T484 310 T680 292V430H0Z" fill="#172033" stroke="#64748b" strokeWidth="3"/>
          {surfaceAtoms.map((a,i)=>{const activeMn=a.kind==="mn"&&(i===16||i===20);const reduced=active===2&&activeMn;return <g key={i}><circle cx={a.x} cy={a.y} r={a.r+3} fill="#020617" opacity=".5"/><circle cx={a.x} cy={a.y} r={a.r} fill={a.kind==="mn"?(reduced?"url(#live-mn3)":"url(#live-mn)"):"url(#live-o)"} opacity={a.y>390?.45:.9} stroke={activeMn?"#fff":"none"} strokeWidth="2"/>{activeMn&&<text x={a.x} y={a.y+4} textAnchor="middle" fill="white" fontSize="9" fontWeight="900">Mn</text>}</g>})}
          <g filter={active===1||active===2?"url(#glow)":undefined}><circle cx="304" cy="316" r="5" fill="#fbbf24" opacity={active===1||active===2?.9:.1}/><circle cx="408" cy="316" r="5" fill="#fbbf24" opacity={active===1||active===2?.9:.1}/></g>
          <rect x="18" y="365" width="206" height="47" rx="12" fill="#020617" fillOpacity=".78" stroke="#334155"/><text x="31" y="384" fill="#94a3b8" fontSize="9" fontWeight="800">SITUS AKTIF SAAT INI</text><text x="31" y="402" fill={active===2&&!regenerated?"#86efac":"#c4b5fd"} fontSize="13" fontWeight="900">{active===2&&!regenerated?"Mn(III) · tereduksi sementara":"Mn(IV) · siap bereaksi"}</text>
          {active===3&&<g opacity={within}><path d="M475 382h115" stroke="#34d399" strokeWidth="3" strokeDasharray="7 6"/><text x="532" y="370" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="900">PERMUKAAN PULIH</text></g>}
        </svg>
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/75 px-4 py-2 text-center text-white shadow-xl backdrop-blur">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-blue-300">Tahap {active+1} dari 4</p><p className="text-xs font-black sm:text-sm">{STEPS[active].title}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 border-t border-slate-200 bg-slate-50">
        {STEPS.map((step,index)=><div key={step.title} className={cn("relative border-r border-slate-200 px-1 py-2 text-center last:border-0 sm:px-3",index===active?"bg-blue-50":"")}><span className={cn("mx-auto grid h-6 w-6 place-items-center rounded-full text-[10px] font-black",index<active||progress>=1?"bg-emerald-500 text-white":index===active?"bg-blue-600 text-white":"bg-slate-200 text-slate-400")}>{index<active||progress>=1?<CheckCircle2 className="h-3.5 w-3.5"/>:index+1}</span><p className="mt-1 hidden text-[9px] font-black uppercase text-slate-600 sm:block">{step.title}</p>{index===active&&<i className="absolute inset-x-0 bottom-0 h-1 bg-blue-500" style={{transform:`scaleX(${within})`,transformOrigin:"left"}}/>}</div>)}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-500">
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />Mn(IV)</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-green-600" />Mn(III)</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-600" />O</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />H</span>
        <span className="ml-auto font-bold text-blue-700">Tahap aktif: {active + 1}/4</span>
      </div>
    </div>
  );
}

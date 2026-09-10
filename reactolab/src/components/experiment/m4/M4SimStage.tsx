"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye, Gauge, Microscope, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { buildSeries, computeRate, runDuration, volumeAt } from "../sim-models";
import M4MechanismView from "./M4MechanismView";

const keyOf = (v: string) => v.replace(/[.#$/[\]]/g, "_");

function Apparatus({ label, progress, volume, running, onZoom }: { label: string; progress: number; volume: number; running: boolean; onZoom: () => void }) {
  const catalyst = label.includes("MnO") ? "#1f2937" : label.includes("FeCl") ? "#f97316" : label.includes("Hati") ? "#78350f" : "#bfdbfe";
  return <div className="relative aspect-[4/3] min-h-[260px] overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-slate-100 sm:aspect-[16/7] sm:min-h-[270px]">
    <svg viewBox="0 0 800 350" className="h-full w-full" aria-label={`Alat penguraian hidrogen peroksida kondisi ${label}`}>
      <defs><linearGradient id="m4-liquid" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dbeafe" stopOpacity=".7"/><stop offset="1" stopColor="#60a5fa" stopOpacity=".45"/></linearGradient></defs>
      <path d="M0 302H800V350H0Z" fill="#cbd5e1"/><path d="M0 302H800" stroke="#94a3b8" strokeWidth="3"/>
      <text x="400" y="30" textAnchor="middle" fill="#475569" fontSize="13" fontWeight="800">PENGUKURAN VOLUME GAS O₂</text>
      <path d="M265 75v52l-70 126q-12 28 21 34h145q33-6 21-34l-70-126V75Z" fill="white" fillOpacity=".72" stroke="#475569" strokeWidth="5"/>
      <path d="M216 243q72-22 145 0l20 34q-5 10-22 11H218q-18-2-22-12Z" fill="url(#m4-liquid)"/>
      <ellipse cx="288" cy={266-progress*42} rx="69" ry="14" fill="white" opacity={.85}/>
      {Array.from({length: 14}).map((_,i)=><circle key={i} cx={232+(i*31)%112} cy={257-((i*23+progress*190)%90)} r={3+(i%3)} fill="white" stroke="#93c5fd" opacity={running ? .9 : .35}/>) }
      {label !== "Tanpa Katalis" && Array.from({length: 12}).map((_,i)=><circle key={`c${i}`} cx={226+(i*29)%125} cy={274-(i%3)*5} r="3" fill={catalyst}/>) }
      <rect x="260" y="67" width="56" height="19" rx="5" fill="#334155"/><path d="M316 76 C430 60 440 105 506 113" fill="none" stroke="#64748b" strokeWidth="7"/><path d="M316 76 C430 60 440 105 506 113" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
      <rect x="500" y="87" width="126" height="197" rx="10" fill="white" fillOpacity=".72" stroke="#475569" strokeWidth="4"/><path d={`M504 ${280-progress*174}h118v${progress*174}H504Z`} fill="#bae6fd" opacity=".75"/>
      {[0,1,2,3,4,5].map(i=><g key={i}><path d={`M610 ${270-i*32}h16`} stroke="#64748b" strokeWidth="2"/><text x="601" y={274-i*32} textAnchor="end" fill="#64748b" fontSize="10">{i*10}</text></g>)}
      <text x="563" y="310" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="800">Tabung ukur gas</text><text x="288" y="319" textAnchor="middle" fill="#334155" fontSize="13" fontWeight="900">H₂O₂ + {label}</text>
      <rect x="650" y="96" width="112" height="55" rx="12" fill="#0f172a"/><text x="706" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800">VOLUME O₂</text><text x="706" y="141" textAnchor="middle" fill="white" fontSize="21" fontWeight="900">{volume.toFixed(1)} mL</text>
    </svg>
    <button type="button" onClick={onZoom} className="absolute inset-x-3 bottom-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-lg transition hover:bg-blue-700 sm:inset-x-auto sm:bottom-4 sm:right-4"><Microscope className="h-4 w-4"/>Lihat mekanisme partikel</button>
  </div>;
}

export default function M4SimStage({ cfg, selected, runs, readOnly=false, onRunDone }: { cfg: ExperimentConfig; selected: string[]; runs: Record<string, ExperimentRun>; readOnly?: boolean; onRunDone: (run: ExperimentRun) => void }) {
  const options=cfg.options.filter(o=>selected.includes(o.value)); const [param,setParam]=useState(options[0]?.value??""); const [running,setRunning]=useState(false); const [speed,setSpeed]=useState(3); const [simT,setSimT]=useState(0); const [done,setDone]=useState(false); const [zoom,setZoom]=useState(false);
  const t=useRef(0), runningRef=useRef(false), speedRef=useRef(3), paramRef=useRef(param), doneRef=useRef(false); runningRef.current=running; speedRef.current=speed; paramRef.current=param;
  const opt=options.find(o=>o.value===param)??options[0]; const duration=opt?runDuration(cfg,opt.factor):40; const progress=Math.min(1,simT/duration); const volume=opt?volumeAt(cfg,opt.factor,simT):0;
  const finish=useCallback(()=>{if(readOnly)return; const o=cfg.options.find(x=>x.value===paramRef.current); if(!o)return; const dur=runDuration(cfg,o.factor); const rate=computeRate(cfg,o.factor,dur); onRunDone({id:`${o.value}-${Date.now()}`,paramValue:o.value,label:o.label,timeSec:dur,rate:rate.rate,rateLabel:rate.rateLabel,at:Date.now(),series:buildSeries(cfg,o.factor)});},[cfg,onRunDone,readOnly]);
  useEffect(()=>{let frame=0,last=performance.now(); const tick=(now:number)=>{const dt=Math.min(.06,(now-last)/1000);last=now;if(runningRef.current&&!doneRef.current){t.current+=dt*speedRef.current;const o=cfg.options.find(x=>x.value===paramRef.current);if(o){const dur=runDuration(cfg,o.factor);if(t.current>=dur){t.current=dur;doneRef.current=true;runningRef.current=false;setRunning(false);setDone(true);finish();}}setSimT(t.current);}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[cfg,finish]);
  const reset=(next?:string)=>{t.current=0;doneRef.current=false;runningRef.current=false;setSimT(0);setDone(false);setRunning(false);setZoom(false);if(next){paramRef.current=next;setParam(next)}};
  const completed=options.filter(o=>runs[keyOf(o.value)]).length;
  return <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Rak kondisi eksperimen</p><p className="text-xs font-semibold text-slate-600">Pilih satu kondisi, lalu jalankan reaksi</p></div><span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">{completed}/{options.length} selesai</span></div><div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{options.map(o=>{const active=o.value===param, saved=Boolean(runs[keyOf(o.value)]);return <button key={o.value} disabled={running} onClick={()=>reset(o.value)} className={cn("relative min-h-14 rounded-xl border px-3 py-2 text-left transition",active?"border-blue-500 bg-blue-600 text-white shadow-md":saved?"border-emerald-200 bg-emerald-50 text-emerald-800":"border-slate-200 bg-white text-slate-700 hover:border-blue-300")}><span className={cn("block text-[9px] font-black uppercase",active?"text-blue-100":"text-slate-400")}>{saved?"Data tersimpan":active?"Kondisi aktif":"Belum diuji"}</span><b className="text-sm">{o.label}</b>{saved&&<CheckCircle2 className="absolute right-2 top-2 h-4 w-4"/>}</button>})}</div></div>
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"><Apparatus label={opt?.label??""} progress={progress} volume={volume} running={running} onZoom={()=>setZoom(true)}/>{zoom&&<div className="fixed inset-0 z-50 overflow-y-auto bg-white overscroll-contain sm:absolute sm:z-20"><M4MechanismView progress={progress} catalystLabel={opt?.label??""}/><button onClick={()=>setZoom(false)} aria-label="Tutup tampilan submikroskopik" className="fixed right-3 top-3 z-[60] grid h-11 w-11 place-items-center rounded-full bg-white text-slate-800 shadow-lg ring-1 ring-slate-200 sm:absolute"><X className="h-5 w-5"/></button><div className="h-[max(12px,env(safe-area-inset-bottom))] sm:hidden" /></div>}</div>
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="grid grid-cols-2 gap-2">{running?<Button size="sm" variant="secondary" onClick={()=>setRunning(false)}><Pause className="h-4 w-4"/>Jeda</Button>:<Button size="sm" onClick={()=>setRunning(true)} disabled={done||!opt}><Play className="h-4 w-4"/>{simT?"Lanjutkan":"Mulai"}</Button>}<Button size="sm" variant="secondary" onClick={()=>reset()}><RotateCcw className="h-4 w-4"/>Ulangi</Button></div><div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-slate-400"/>{[1,3,6].map(s=><button key={s} onClick={()=>setSpeed(s)} className={cn("grid min-h-11 min-w-11 place-items-center rounded-lg text-xs font-black",speed===s?"bg-blue-600 text-white":"bg-slate-100 text-slate-500")}>{s}×</button>)}</div><div className="flex-1"><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500"><span>{done?"Reaksi selesai":running?"O₂ sedang terbentuk":"Siap memulai"}</span><span>{Math.round(progress*100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width:`${progress*100}%`}}/></div></div><span className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 font-mono font-black text-white"><Timer className="h-4 w-4 text-cyan-300"/>{simT.toFixed(1)} s</span></div></div>
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900"><b>Prosedur terkendali:</b> {cfg.stageNote}</div>{done&&<div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><Eye className="h-4 w-4 shrink-0"/><p><b>Percobaan {opt?.label} selesai.</b> Volume O₂ dan laju reaksi otomatis tersimpan. Pilih kondisi berikutnya.</p></div>}
  </div>;
}

"use client";

// One module = one route = ONE page (INV-02). No internal step routes.

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import { FullPageSpinner } from "@/components/ui/misc";
import { ModuleEngineProvider } from "@/components/module/engine";
import ModulePageView from "@/components/module/ModulePageView";
import { getModuleDef, type ModuleDef } from "@/lib/module-defs";

function LockedView(def: ModuleDef) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto mt-10">
      <span className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-xl font-black text-slate-900">
        Modul {def.id} — {def.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Modul ini masih terkunci. Selesaikan modul sebelumnya terlebih dahulu untuk
        membukanya.
      </p>
      <Link href="/student/dashboard" className="inline-block mt-5">
        <Button variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}

function NoClassView() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto mt-10">
      <p className="text-3xl">🔑</p>
      <h1 className="mt-3 text-xl font-black text-slate-900">Belum Tergabung Kelas</h1>
      <p className="mt-2 text-sm text-slate-500">
        Gabung kelas terlebih dahulu menggunakan kode dari gurumu, lalu mulai modul
        pembelajaran dari Dashboard.
      </p>
      <Link href="/student/dashboard" className="inline-block mt-5">
        <Button>
          <ArrowLeft className="h-4 w-4" /> Ke Dashboard
        </Button>
      </Link>
    </div>
  );
}

export default function ModulePage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = Number(params.moduleId);
  const def = Number.isInteger(moduleId) ? getModuleDef(moduleId) : undefined;

  if (!def) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto mt-10">
        <p className="text-3xl">🤔</p>
        <h1 className="mt-3 text-xl font-black text-slate-900">
          Modul tidak ditemukan
        </h1>
        <Link href="/student/modules" className="inline-block mt-5">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Daftar Modul
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ModuleEngineProvider
      moduleId={moduleId}
      renderLoading={<FullPageSpinner label={`Memuat Modul ${moduleId}…`} />}
      renderLocked={LockedView}
      renderNoClass={<NoClassView />}
    >
      <ModulePageView />
    </ModuleEngineProvider>
  );
}

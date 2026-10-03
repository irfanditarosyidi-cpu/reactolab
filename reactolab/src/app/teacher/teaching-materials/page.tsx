"use client";

import { BookOpen, Info } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import {
  M5Collision,
  M5Concept,
  M5Equation,
} from "@/components/module/sections/Module5Sections";

const MATERIAL_SECTIONS = [
  {
    id: "concept",
    title: "Konsep Dasar Laju Reaksi",
    description: "Definisi laju reaksi dan hubungan konsentrasi terhadap waktu.",
    content: M5Concept,
  },
  {
    id: "equation",
    title: "Persamaan Laju Reaksi",
    description: "Tetapan laju, orde reaksi, grafik, dan contoh data eksperimen.",
    content: M5Equation,
  },
  {
    id: "collision",
    title: "Teori Tumbukan",
    description: "Energi aktivasi, orientasi partikel, dan tumbukan efektif.",
    content: M5Collision,
  },
] as const;

export default function TeacherTeachingMaterialsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bahan Ajar Guru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Konfirmasi materi laju reaksi untuk membantu guru menjelaskan dan
            menguatkan konsep setelah empat kegiatan penyelidikan siswa.
          </p>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Grafik, simulasi tumbukan, dan kuis di halaman ini dapat digunakan saat
          mengajar. Interaksi guru hanya untuk pratinjau dan tidak memengaruhi progres
          siswa.
        </p>
      </div>

      {MATERIAL_SECTIONS.map((section, index) => {
        const Content = section.content;
        return (
          <Card key={section.id}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  {section.title}
                </span>
              }
              subtitle={section.description}
            />
            <CardBody className="border-t border-slate-100">
              <Content sec={{ id: section.id }} readOnly={false} />
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

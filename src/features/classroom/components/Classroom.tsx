import React from "react";
import { PlayCircle, ArrowRight } from "lucide-react";
import { useCourses } from "../hooks/useCourses";
import CourseCard from "./CourseCard";
import Spinner from "../../../shared/ui/Spinner";

export default function Classroom() {
  const { courses, isLoading } = useCourses();

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      {/* Featured Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative rounded-[2rem] overflow-hidden min-h-[320px] bg-[#131b2e] flex items-center shadow-sm">
          <iframe
            src="https://www.youtube.com/embed/kW91PzomLWw?start=10"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          ></iframe>
        </div>

        <div className="bg-indigo-50 rounded-[2rem] p-8 border-2 border-indigo-100 border-dashed flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-indigo-100/50 transition-colors">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
            <PlayCircle size={40} />
          </div>
          <h4 className="font-bold text-indigo-900 text-lg mb-2">Continuar donde lo dejaste</h4>
          <p className="text-indigo-700/60 text-sm font-medium leading-relaxed">
            Módulo 4: React Context & State Patterns
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, idx) => (
          <CourseCard key={course.id} course={course} index={idx} />
        ))}

        <div className="bg-slate-50 rounded-[2rem] border-2 border-slate-200 border-dashed flex flex-col items-center justify-center p-8 group cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
            <ArrowRight size={32} />
          </div>
          <h4 className="font-bold text-slate-900 text-lg mt-6">Explorar catálogo</h4>
          <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">+12 nuevos cursos añadidos este mes</p>
        </div>
      </div>
    </div>
  );
}

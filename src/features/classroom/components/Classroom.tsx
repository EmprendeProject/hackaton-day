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
        <div className="md:col-span-2 relative rounded-[2rem] overflow-hidden min-h-[320px] bg-[#131b2e] flex items-center p-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10 transition-opacity group-hover:opacity-60"></div>
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&h=800&fit=crop"
            alt="Classroom"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="relative z-20 max-w-sm">
            <span className="inline-block px-3 py-1 bg-white text-indigo-600 text-[10px] font-black rounded-full mb-6 uppercase tracking-[0.2em] shadow-sm shadow-indigo-200">
              Featured Workshop
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              Mastering UI Architecture
            </h2>
            <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:scale-105 transition-all flex items-center gap-3 group shadow-xl shadow-indigo-900/40">
              Empieza ahora <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
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

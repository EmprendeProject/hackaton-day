import React from "react";
import { Clock } from "lucide-react";
import { motion } from "motion/react";
import { Course } from "../../../types";

interface CourseCardProps {
  course: Course;
  index: number;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-6 left-6">
          <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl text-xs font-black text-slate-900 shadow-lg uppercase tracking-wider">
            {course.category}
          </span>
        </div>
      </div>
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
            <Clock size={14} className="text-indigo-600" /> {course.module}
          </span>
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h4>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2">{course.description}</p>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-indigo-600 uppercase tracking-widest">{course.progress}%</span>
            <span className="text-slate-300 uppercase tracking-widest">Complete</span>
          </div>
          <div className="w-full bg-slate-50 h-2.5 rounded-full shadow-inner">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

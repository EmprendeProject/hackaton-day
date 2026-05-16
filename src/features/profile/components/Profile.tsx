import React from "react";
import { Award, BookOpen, Flame, Settings, Edit3, Zap, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  const stats = [
    { label: "Puntos", value: "2.4k", icon: <Zap size={20} />, color: "bg-indigo-600 shadow-indigo-200" },
    { label: "Módulos", value: "12", icon: <BookOpen size={20} />, color: "bg-slate-900 shadow-slate-200" },
    { label: "Días", value: "12", icon: <Flame size={20} />, color: "bg-orange-500 shadow-orange-200" },
    { label: "Rango", value: "Oro", icon: <Award size={20} />, color: "bg-amber-500 shadow-amber-200" },
  ];

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Profile Header */}
      <div className="md:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>

        <div className="relative z-10">
          <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500 ring-1 ring-slate-200">
            <img
              src={user?.avatar ?? "https://i.pravatar.cc/400?u=default"}
              alt={user?.name ?? "Perfil"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
            <Award size={24} />
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 justify-center md:justify-start">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{user?.name ?? "Usuario"}</h2>
            <span className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
              {user?.role ?? "member"}
            </span>
          </div>
          <p className="text-slate-500 font-medium leading-relaxed max-w-md mb-8">{user?.email}</p>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <button className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200">
              <Edit3 size={18} /> Editar Perfil
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="md:col-span-4 bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2 leading-tight">Configuración de Comunidad</h3>
          <p className="text-indigo-100/60 font-medium">Personaliza tu experiencia y notificaciones.</p>
        </div>
        <button className="relative z-10 w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-8">
          Gestionar Cuenta
        </button>
      </div>

      {/* Stats */}
      {stats.map((stat, idx) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
          key={stat.label}
          className="md:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-indigo-600 transition-all hover:-translate-y-1"
        >
          <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg ${stat.color} group-hover:scale-110 transition-transform`}>
            {stat.icon}
          </div>
          <h4 className="text-3xl font-black text-slate-900">{stat.value}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
        </motion.div>
      ))}

      {/* Activity Log */}
      <div className="md:col-span-12 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Calendar className="text-indigo-600" /> Registro de Actividad
          </h3>
          <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Historial</button>
        </div>

        <div className="space-y-6">
          {[
            { text: "Completaste el módulo de 'Componentes Atómicos'", tag: "Classroom", time: "Hace 2 horas" },
            { text: "Tu publicación 'Guía de Motion' llegó a 50 likes", tag: "Comunidad", time: "Hace 5 horas" },
            { text: "Iniciaste sesión desde un nuevo dispositivo", tag: "Seguridad", time: "Ayer" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group cursor-pointer hover:bg-white hover:ring-2 hover:ring-indigo-100 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                <div>
                  <p className="text-slate-900 font-bold">{activity.text}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{activity.time}</p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black text-slate-400 border border-slate-100 uppercase tracking-widest group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                {activity.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Award, BookOpen, Flame, Settings, Edit3, Zap, Calendar, Save, X, Camera } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../../context/AuthContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
    bio: user?.bio || ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxWidth = 300;
        const scaleSize = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setEditForm({ ...editForm, avatar: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const stats = [
    { label: "Puntos", value: "2.4k", icon: <Zap size={20} />, color: "bg-indigo-600 shadow-indigo-200" },
    { label: "Módulos", value: "12", icon: <BookOpen size={20} />, color: "bg-slate-900 shadow-slate-200" },
    { label: "Días", value: "12", icon: <Flame size={20} />, color: "bg-orange-500 shadow-orange-200" },
    { label: "Rango", value: "Oro", icon: <Award size={20} />, color: "bg-amber-500 shadow-amber-200" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          name: editForm.name,
          avatar: editForm.avatar,
          bio: editForm.bio
        })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setIsEditing(false);
      } else {
        console.error("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Profile Header */}
      <div className="md:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>

        <div className="relative z-10">
          <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500 ring-1 ring-slate-200">
            <img
              src={isEditing ? editForm.avatar || "https://i.pravatar.cc/400?u=default" : user?.avatar ?? "https://i.pravatar.cc/400?u=default"}
              alt={user?.name ?? "Perfil"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
            <Award size={24} />
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left w-full">
          {isEditing ? (
            <div className="space-y-4 text-left w-full max-w-sm mx-auto md:mx-0">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre Público</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-4 text-sm font-bold transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Imagen de Perfil</label>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="text" 
                    value={editForm.avatar} 
                    onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                    className="flex-1 w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-4 text-sm font-medium transition-all outline-none"
                    placeholder="URL o sube una imagen..."
                  />
                  <label className="flex items-center justify-center bg-indigo-100 text-indigo-600 px-4 rounded-xl cursor-pointer hover:bg-indigo-200 transition-colors shadow-sm">
                    <Camera size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Descripción / Bio</label>
                <textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-4 text-sm font-medium transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : <><Save size={16} /> Guardar</>}
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({ name: user?.name || "", avatar: user?.avatar || "", bio: user?.bio || "" });
                  }}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{user?.name ?? "Usuario"}</h2>
                <span className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                  {user?.role ?? "member"}
                </span>
              </div>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-md mb-2">{user?.email}</p>
              
              {user?.bio && (
                <p className="text-slate-700 font-medium leading-relaxed max-w-md mb-6 italic border-l-4 border-indigo-200 pl-4 py-1">
                  "{user.bio}"
                </p>
              )}
              {!user?.bio && <div className="mb-6"></div>}

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200"
                >
                  <Edit3 size={18} /> Editar Perfil
                </button>
                <button className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">
                  <Settings size={18} />
                </button>
              </div>
            </>
          )}
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

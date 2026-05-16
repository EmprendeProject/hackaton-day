import React, { useState } from "react";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../../context/AuthContext";

interface RegisterProps {
  onGoToLogin: () => void;
}

export default function Register({ onGoToLogin }: RegisterProps) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "student" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta");
        return;
      }
      login(data.user, data.token);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Left Side: Form */}
        <div className="md:col-span-5 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-center order-2 md:order-1">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Crea tu cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Crear Cuenta <Sparkles size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-center text-sm font-medium text-slate-500">
              ¿Ya tienes cuenta?{" "}
              <button onClick={onGoToLogin} className="text-indigo-600 font-bold hover:underline">
                Inicia Sesión
              </button>
            </p>
          </div>
        </div>

        {/* Right Side: Features */}
        <div className="md:col-span-7 bg-indigo-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px] order-1 md:order-2">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-indigo-100 text-xs font-black uppercase tracking-widest mb-8">
              Únete a la élite
            </div>
            <h1 className="text-5xl font-black mb-8 leading-[1.1] tracking-tight">Comienza tu viaje de aprendizaje.</h1>
            <div className="space-y-6">
              {[
                { title: "Acceso Ilimitado", desc: "Más de 500 módulos de alta calidad." },
                { title: "Comunidad VIP", desc: "Networking directo con líderes." },
                { title: "Certificados", desc: "Valida tus conocimientos formalmente." },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{f.title}</h4>
                    <p className="text-indigo-100/60 font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 pt-12">
            <p className="text-indigo-200 text-sm font-bold italic opacity-60">
              "La mejor inversión que puedes hacer es en ti mismo."
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

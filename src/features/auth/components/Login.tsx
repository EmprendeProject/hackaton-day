import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../../context/AuthContext";

interface LoginProps {
  onGoToRegister: () => void;
}

export default function Login({ onGoToRegister }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas");
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Left Side: Branding */}
        <div className="md:col-span-7 bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full"></div>
              </div>
              <span className="font-bold text-2xl tracking-tight">Emprende Más</span>
            </div>
            <h1 className="text-5xl font-black mb-6 leading-[1.1] tracking-tight">Vuelve a tu<br />comunidad.</h1>
            <p className="text-slate-400 text-lg font-medium max-w-sm">
              Conecta con expertos, aprende nuevas habilidades y comparte tu progreso.
            </p>
          </div>

          <div className="relative z-10 flex -space-x-3 mt-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 shadow-sm overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=auth${i}`} alt="user" />
              </div>
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-slate-900 bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white shadow-sm">
              +2k
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-5 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-center">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="••••••••"
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
                <>Entrar <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
            <p className="text-sm text-slate-400 font-medium mb-4">O continúa con</p>
            <button className="w-full flex items-center justify-center gap-3 py-3 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Github size={20} /> Github
            </button>
            <p className="mt-8 text-sm font-medium text-slate-500">
              ¿No tienes cuenta?{" "}
              <button onClick={onGoToRegister} className="text-indigo-600 font-bold hover:underline">
                Regístrate gratis
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

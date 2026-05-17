import React, { useState } from "react";
import { 
  Play, 
  CheckCircle2, 
  Users, 
  Zap, 
  Star, 
  ArrowRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import { motion } from "motion/react";

interface LandingProps {
  onViewChange: (view: "login" | "register") => void;
}

export default function Landing({ onViewChange }: LandingProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">Iconicfy</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#vsl" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">¿Cómo funciona?</a>
          <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Beneficios</a>
          <button 
            onClick={() => onViewChange("login")}
            className="px-6 py-2.5 text-sm font-bold text-slate-900 border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => onViewChange("register")}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 hover:translate-y-[-2px] transition-all"
          >
            Únete Ahora
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Crea un área de miembros <span className="text-indigo-600">profesional</span> en minutos.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12">
            El modelo de negocios de comunidades y área de miembros es uno de los más exitosos de los últimos tiempos en el mercado de productores digitales, y ¡Venezuela es el mejor mercado para hacerlo!
          </p>
        </motion.div>

        {/* VSL (Video Sales Letter) */}
        <motion.div 
          id="vsl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(79,70,229,0.15)] group aspect-video bg-slate-900 flex items-center justify-center border-8 border-white"
        >
          {isVideoPlaying ? (
            <iframe 
              src="https://drive.google.com/file/d/1T1yZBvP8u9bIHQOMCQMe6YCh92BgCYJY/preview" 
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay"
              allowFullScreen
            ></iframe>
          ) : (
            <>
              <img 
                src="https://drive.google.com/thumbnail?id=1T1yZBvP8u9bIHQOMCQMe6YCh92BgCYJY&sz=w1200-h675" 
                alt="VSL Thumbnail" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              
              <button 
                onClick={() => setIsVideoPlaying(true)}
                className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="text-indigo-600 fill-indigo-600 ml-1" size={40} />
                <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
              </button>
              
              <div className="absolute bottom-10 left-10 text-left pointer-events-none">
                <p className="text-white font-black text-xl">Mira el video: "Cómo convertir tu comunidad de seguidores, en ingresos mensuales"</p>
                <p className="text-white/60 text-sm font-medium">8:42 min • Exclusivo para nuevos miembros</p>
              </div>
            </>
          )}
        </motion.div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Estudiantes", value: "12,000+" },
            { label: "Cursos", value: "85+" },
            { label: "Mentores", value: "24" },
            { label: "Casos de Éxito", value: "950+" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl md:text-5xl font-black text-indigo-600">{stat.value}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Todo lo que necesitas para crecer</h2>
          <p className="text-slate-500 font-medium">Diseñado para llevar tu carrera al siguiente nivel de forma orgánica y acelerada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
          {/* Main Bento Cell */}
          <div className="md:col-span-8 bg-indigo-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-end relative overflow-hidden">
            <div className="absolute top-10 right-10 opacity-20"><Globe size={120} /></div>
            <h3 className="text-3xl font-black mb-4">Red de contactos Global</h3>
            <p className="text-indigo-100 font-medium max-w-md">Accede a una red exclusiva de profesionales en Europa y Latinoamérica. Oportunidades laborales que no llegan a LinkedIn.</p>
          </div>

          <div className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-sm">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Garantía de Calidad</h3>
              <p className="text-slate-400 text-sm font-medium">Certificados avalados por líderes de la industria tecnológica.</p>
            </div>
          </div>

          <div className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Zap size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-black mb-2">Actualización Semanal</h3>
              <p className="text-slate-400 text-sm font-medium">Nuevos contenidos cada 7 días para que nunca te quedes atrás.</p>
            </div>
          </div>

          <div className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Mentonría 1 a 1</h3>
              <p className="text-slate-400 text-sm font-medium">Feedback directo de expertos en cada uno de tus proyectos.</p>
            </div>
          </div>

          <div className="md:col-span-4 bg-indigo-50 rounded-[2.5rem] p-10 flex flex-col justify-between border border-indigo-100">
            <div className="flex -space-x-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=feat${i}`} alt="user" />
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xl font-black text-indigo-900 mb-2">Comunidad Activa</h3>
              <p className="text-indigo-700/60 text-sm font-medium">Más de 200 mensajes diarios compartiendo valor real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 pb-24 text-center">
        <div className="bg-slate-900 rounded-[3rem] p-16 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] -mr-48 -mt-48 opacity-40"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">¿Listo para transformar <br />tu futuro?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onViewChange("register")}
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900"
              >
                Empezar Gratis Hoy
              </button>
              <button 
                onClick={() => onViewChange("login")}
                className="w-full sm:w-auto px-10 py-5 bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-700 transition-all"
              >
                Hablar con un asesor
              </button>
            </div>
            <p className="mt-8 text-slate-400 font-bold flex items-center justify-center gap-2">
              <ShieldCheck size={20} className="text-green-500" /> 14 días de prueba sin compromiso
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">Iconicfy</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">© 2026 Iconicfy. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Twitter</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Instagram</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

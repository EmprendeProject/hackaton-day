import React from "react";
import logo from "../../assets/logo.png";
import { MessageSquare, School, Compass, User, Bell, LayoutGrid, LogOut, Shield } from "lucide-react";
import { View } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
}

export default function Layout({ children, activeView, onViewChange, onLogout }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-brand-background text-brand-text-main overflow-hidden">
      {/* Sidebar - Persistent on Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-brand-border flex-col p-8 space-y-10 flex-shrink-0">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onViewChange("muro")}>
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
          <span className="font-bold text-2xl tracking-tight">Emprende Más</span>
        </div>

        <nav className="flex-1 space-y-3">
          {[
            { id: "muro", label: "Comunidad", icon: <MessageSquare size={20} /> },
            { id: "classroom", label: "Aula Virtual", icon: <School size={20} /> },
            { id: "explore", label: "Explorar", icon: <Compass size={20} /> },
            { id: "profile", label: "Mi Perfil", icon: <User size={20} /> },
            { id: "admin", label: "Admin", icon: <Shield size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-semibold transition-all ${
                activeView === item.id
                  ? "bg-indigo-50 text-brand-primary shadow-sm"
                  : "text-brand-text-muted hover:bg-slate-50 hover:text-brand-text-main"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-brand-border">
          <div className="flex items-center gap-2 mb-6">
            <div
              className="flex-1 flex items-center space-x-4 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
              onClick={() => onViewChange("profile")}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{user?.name ?? "Usuario"}</p>
                <p className="text-xs text-brand-text-muted font-medium capitalize">{user?.role ?? "member"}</p>
              </div>
            </div>
            <button className="relative p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Mobile */}
        <header className="lg:hidden h-16 bg-white border-b border-brand-border px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">Emprende Más</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-brand-text-muted hover:bg-slate-100 rounded-full">
              <Bell size={20} />
            </button>
            <button className="p-2 text-brand-text-muted hover:bg-slate-100 rounded-full">
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-brand-border h-20 flex items-center justify-around px-4 z-50">
        {[
          { id: "muro", icon: <MessageSquare size={24} /> },
          { id: "classroom", icon: <School size={24} /> },
          { id: "explore", icon: <Compass size={24} /> },
          { id: "profile", icon: <User size={24} /> },
          { id: "admin", icon: <Shield size={24} /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`p-4 rounded-2xl transition-all ${
              activeView === item.id ? "bg-indigo-50 text-brand-primary" : "text-brand-text-muted"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}

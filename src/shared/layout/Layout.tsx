import React from "react";
import { MessageSquare, School, Compass, User, Bell, LayoutGrid, LogOut } from "lucide-react";
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
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform group-hover:scale-110">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="font-bold text-2xl tracking-tight">Emprende Más</span>
        </div>

        <nav className="flex-1 space-y-3">
          {[
            { id: "muro", label: "Comunidad", icon: <MessageSquare size={20} /> },
            { id: "classroom", label: "Aula Virtual", icon: <School size={20} /> },
            { id: "explore", label: "Explorar", icon: <Compass size={20} /> },
            { id: "profile", label: "Mi Perfil", icon: <User size={20} /> },
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
          <div
            className="flex items-center space-x-4 mb-6 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => onViewChange("profile")}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md overflow-hidden">
              <img
                src={user?.avatar ?? "https://i.pravatar.cc/100?u=default"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-sm">{user?.name ?? "Usuario"}</p>
              <p className="text-xs text-brand-text-muted font-medium capitalize">{user?.role ?? "member"}</p>
            </div>
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
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="font-bold text-lg tracking-tight">Emprende Más</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-brand-text-muted hover:bg-slate-100 rounded-full">
              <Bell size={20} />
            </button>
            <button className="p-2 text-brand-text-muted hover:bg-slate-100 rounded-full">
              <LayoutGrid size={20} />
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

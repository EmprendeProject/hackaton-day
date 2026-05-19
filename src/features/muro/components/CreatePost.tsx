import React, { useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

interface CreatePostProps {
  onSubmit: (content: string) => void;
}

export default function CreatePost({ onSubmit }: CreatePostProps) {
  const [value, setValue] = useState("");
  const { user } = useAuth();

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      <div className="p-6 flex items-center space-x-4 border-b border-slate-50">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name ?? "Usuario"}
            className="w-10 h-10 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-inner flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          type="text"
          placeholder="Comparte algo con la comunidad..."
          className="bg-slate-50 border-none rounded-2xl flex-1 px-6 py-3 text-sm font-medium focus:ring-0 placeholder:text-slate-400"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

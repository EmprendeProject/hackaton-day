import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "./context/AuthContext";
import Layout from "./shared/layout/Layout";
import Login from "./features/auth/components/Login";
import Register from "./features/auth/components/Register";
import PostFeed from "./features/muro/components/PostFeed";
import Classroom from "./features/classroom/components/Classroom";
import Profile from "./features/profile/components/Profile";
import { View } from "./types";

type AuthScreen = "login" | "register";

function AuthGate() {
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");

  return (
    <AnimatePresence mode="wait">
      {authScreen === "login" ? (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Login onGoToRegister={() => setAuthScreen("register")} />
        </motion.div>
      ) : (
        <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Register onGoToLogin={() => setAuthScreen("login")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MainApp() {
  const { logout } = useAuth();
  const [view, setView] = useState<View>("muro");

  const renderView = () => {
    switch (view) {
      case "muro":
        return <PostFeed />;
      case "classroom":
        return <Classroom />;
      case "profile":
        return <Profile />;
      case "explore":
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-[#131b2e]">Explorando comunidades...</h2>
            <p className="text-[#464555] mt-2 italic">Feature coming soon!</p>
          </div>
        );
      default:
        return <PostFeed />;
    }
  };

  return (
    <Layout activeView={view} onViewChange={setView} onLogout={logout}>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainApp /> : <AuthGate />;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Layout from "./components/layout/Layout.tsx";
import PostFeed from "./components/muro/PostFeed.tsx";
import Classroom from "./components/classroom/Classroom.tsx";
import Profile from "./components/profile/Profile.tsx";
import Login from "./components/auth/login.tsx";
import Register from "./components/auth/register.tsx";
import { Post, Course, View } from "./types.ts";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./context/AuthContext.tsx";

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
  const { logout, user } = useAuth();
  const [view, setView] = useState<View>("muro");
  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, coursesRes] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/courses"),
        ]);
        const postsData = await postsRes.json();
        const coursesData = await coursesRes.json();
        setPosts(postsData);
        setCourses(coursesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePost = async (content: string) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, author: user?.name }),
      });
      const newPost = await res.json();
      setPosts([newPost, ...posts]);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-[#3525cd] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (view) {
      case "muro":
        return <PostFeed posts={posts} onCreatePost={handleCreatePost} />;
      case "classroom":
        return <Classroom courses={courses} />;
      case "profile":
        return <Profile />;
      case "explore":
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-[#131b2e]">Exploring Communities...</h2>
            <p className="text-[#464555] mt-2 italic">Feature coming soon in the next update!</p>
          </div>
        );
      default:
        return <PostFeed posts={posts} onCreatePost={handleCreatePost} />;
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

import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateIdea from "./pages/CreateIdea.jsx";
import IdeaDetails from "./pages/IdeaDetails.jsx";
import Network from "./pages/Network.jsx";
import Messages from "./pages/Messages.jsx";
import Profile from "./pages/Profile.jsx";
import api from "./services/api";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const [status, setStatus] = useState(token && user ? "checking" : "unauthenticated");

  useEffect(() => {
    let active = true;

    if (!token || !user) {
      setStatus("unauthenticated");
      return undefined;
    }

    api.get("/auth/me")
      .then(() => active && setStatus("authenticated"))
      .catch(() => active && setStatus("unauthenticated"));

    return () => {
      active = false;
    };
  }, [token, user]);

  if (status === "checking") {
    return <main className="page-shell narrow-shell"><p className="muted-copy">Checking session...</p></main>;
  }

  return status === "authenticated" ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateIdea /></ProtectedRoute>} />
        <Route path="/ideas/:ideaId" element={<ProtectedRoute><IdeaDetails /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

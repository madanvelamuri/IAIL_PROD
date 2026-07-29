import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddMistake from "./pages/AddMistake";
import Register from "./pages/Register";
import TeamsNotifications from "./pages/TeamsNotifications";
import ProLayout from "./components/ProLayout";

// Wrapper for Protected Routes (requires active JWT token)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <ProLayout>{children}</ProLayout>;
};

// Wrapper for Public Routes (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-mistake"
          element={
            <ProtectedRoute>
              <AddMistake />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams-notifications"
          element={
            <ProtectedRoute>
              <TeamsNotifications />
            </ProtectedRoute>
          }
        />

        {/* CATCH ALL ROUTE */}
        <Route
          path="*"
          element={
            <Navigate
              to={localStorage.getItem("token") ? "/dashboard" : "/"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
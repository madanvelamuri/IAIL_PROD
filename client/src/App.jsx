
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ==========================================
// PAGES
// ==========================================

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddMistake from "./pages/AddMistake";
import Register from "./pages/Register";
import TeamsNotifications from "./pages/TeamsNotifications";
import CreatorDashboard from "./pages/CreatorDashboard";

// SETTINGS PAGES
import UpdateProfile from "./pages/settings/UpdateProfile";

// FEEDBACK PAGE
import Feedback from "./pages/Feedback";

// ==========================================
// COMPONENTS
// ==========================================

import ProLayout from "./components/ProLayout";

// ==========================================
// PROTECTED ROUTES
// Requires an active login token
// ==========================================

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <ProLayout>{children}</ProLayout>;
};

// ==========================================
// PUBLIC ROUTES
// Redirect logged-in users to Dashboard
// ==========================================

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ==========================================
// APPLICATION ROUTES
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================
            PUBLIC ROUTES
        ================================== */}

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

        {/* ==================================
            PROTECTED ROUTES
        ================================== */}

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

        {/* ==================================
            CREATOR DASHBOARD
        ================================== */}

        <Route
          path="/creator"
          element={
            <ProtectedRoute>
              <CreatorDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==================================
            SETTINGS
        ================================== */}

        <Route
          path="/settings/profile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />

        {/* ==================================
            FEEDBACK
        ================================== */}

        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        {/* ==================================
            CATCH-ALL ROUTE
        ================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                localStorage.getItem("token")
                  ? "/dashboard"
                  : "/"
              }
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context";
export function UserRoute({ children }) {
  const { user, loading } = useApp();
  const loc = useLocation();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(loc.pathname)}`}
        replace
      />
    );
  return children;
}
export function AdminRoute({ children }) {
  const { user, loading } = useApp();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/account" replace />;
  return children;
}

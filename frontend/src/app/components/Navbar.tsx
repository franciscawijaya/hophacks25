"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav style={{
      width: "100%",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#f5f7fa",
      borderBottom: "1px solid #e0e0e0",
      padding: "0 32px",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Image src="/assets/favicon.png" alt="Logo" width={36} height={36} style={{ borderRadius: 8 }} />
        <Link href="/" style={{ textDecoration: "none" }}>
           <span style={{ fontWeight: 700, fontSize: 22, color: "#1976d2", letterSpacing: 1, cursor: "pointer" }}>Crypto Dashboard</span>
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {isAuthenticated && user ? (
          <>
            <span style={{ fontSize: 17, color: "#333", fontWeight: 500 }}>{user}</span>
            <button
              style={{
                padding: "6px 18px",
                fontSize: 16,
                borderRadius: 8,
                background: "#ff9800",
                color: "#fff",
                border: "none",
                cursor: "pointer"
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            style={{
              padding: "6px 18px",
              fontSize: 16,
              borderRadius: 8,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
            onClick={handleLogin}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button, Box, Typography, Alert } from "@mui/material";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const usernameTrimmed = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_.@-]{3,20}$/;
    if (!usernameRegex.test(usernameTrimmed)) {
      setError("Username must be 3-20 characters and only contain letters, numbers, _ . @ -");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setSuccess("Registration successful! Redirecting to login...");
        setError("");
        setTimeout(() => router.push("/login"), 1500);
      } else if (res.status === 400) {
        setError(data.error || "Username and password required");
      } else if (res.status === 409) {
        setError(data.error || "Username already exists");
      } else if (res.status === 500) {
        setError(data.error || "Server error");
      } else {
        setError("Registration failed");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Box
        boxShadow={3}
        borderRadius={3}
        p={5}
        bgcolor="#fff"
        minWidth={340}
        maxWidth={380}
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h4" mb={2} fontWeight={700} color="primary.main">Register</Typography>
        <Typography variant="body2" mb={3} color="text.secondary">Create a new account to get started.</Typography>
        <Box component="form" onSubmit={handleSubmit} width="100%">
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, py: 1.2, fontWeight: 600, fontSize: 18, letterSpacing: 1 }}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
          <Box mt={2} textAlign="center">
            <a href="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
              Back to login
            </a>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

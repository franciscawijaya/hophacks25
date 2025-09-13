"use client";

import { useEffect, useState } from "react";
import { fetchSymbols } from "@/utils/api";

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSymbols() {
      try {
        const data = await fetchSymbols();
        setSymbols(data.symbols);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      }
    }
    loadSymbols();
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Available Symbols</h1>
      <ul>
        {symbols.map((symbol) => (
          <li key={symbol}>{symbol}</li>
        ))}
      </ul>
    </div>
  );
}
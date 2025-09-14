"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MultiLineChart from '../components/MultiLineChart';
import BubbleChartPage from "../bubble/page";
import BubbleChartPage2 from "../bubble2/page";

export default function ChartPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trading Data Visualization
          </h1>
          <p className="text-gray-600">
            Interactive multiline chart showing real-time candle data for multiple cryptocurrency symbols.
            Hover over data points to see detailed information.
          </p>
        </div>
        
        <MultiLineChart 
          width={1000}
          height={500}
          timeframe="1m"
          limit={1440}
        />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Chart Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Interactive Elements</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hover over data points for detailed tooltips</li>
                <li>• Toggle symbols on/off using the buttons above</li>
                <li>• Select time periods from 1 hour to 3 months</li>
                <li>• Smooth animations and transitions</li>
                <li>• Color-coded legend for easy identification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Information</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time candle data from market API</li>
                <li>• Shows closing prices over time</li>
                <li>• Multiple timeframe options (1H to 3M)</li>
                <li>• Optimized performance for large datasets</li>
                <li>• Multiple cryptocurrency symbols supported</li>
              </ul>
            </div>
          </div>
        </div>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 128 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>Market</div>
              <BubbleChartPage />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>Wallet</div>
              <BubbleChartPage2 />
            </div>
          </div>
      </div>
    </div>
  );
}

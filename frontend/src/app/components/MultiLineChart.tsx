"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { fetchCandles, fetchSymbols } from '@/utils/api';

interface CandleData {
  symbol: string;
  timeframe: string;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MultiLineChartProps {
  width?: number;
  height?: number;
  timeframe?: string;
  limit?: number;
  initialSelectedSymbols?: string[];
}

interface TimeframeOption {
  label: string;
  value: string;
  dataLimit: number;
  description: string;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  width = 800,
  height = 400,
  timeframe = "1m",
  limit = 200,
  initialSelectedSymbols
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<{ [symbol: string]: CandleData[] }>({});
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedDataLimit, setSelectedDataLimit] = useState(limit);
  const [normalizeData, setNormalizeData] = useState(true);

  // Memoize the initial selected symbols to prevent unnecessary re-renders
  const memoizedInitialSymbols = useMemo(() => {
    console.log('🎯 MultiLineChart - memoizedInitialSymbols updated:', initialSelectedSymbols);
    return initialSelectedSymbols;
  }, [initialSelectedSymbols]);

  // Color scale for different symbols
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Normalize data function
  const normalizeCandleData = (candleData: CandleData[]) => {
    if (!normalizeData || candleData.length === 0) return candleData;
    
    const prices = candleData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    if (range === 0) return candleData; // Avoid division by zero
    
    return candleData.map(d => ({
      ...d,
      close: ((d.close - minPrice) / range) * 100, // Scale to 0-100
      open: ((d.open - minPrice) / range) * 100,
      high: ((d.high - minPrice) / range) * 100,
      low: ((d.low - minPrice) / range) * 100
    }));
  };

  // Timeframe options with optimized data limits
  const timeframeOptions: TimeframeOption[] = [
    { label: "1 Hour", value: "1m", dataLimit: 60, description: "Last 60 minutes" },
    { label: "4 Hours", value: "1m", dataLimit: 240, description: "Last 4 hours" },
    { label: "1 Day", value: "1m", dataLimit: 1440, description: "Last 24 hours" },
    { label: "3 Days", value: "1m", dataLimit: 4320, description: "Last 3 days" },
    { label: "1 Week", value: "1m", dataLimit: 10080, description: "Last 7 days" },
    { label: "2 Weeks", value: "1m", dataLimit: 20160, description: "Last 14 days" },
    { label: "1 Month", value: "1m", dataLimit: 43200, description: "Last 30 days" },
    { label: "3 Months", value: "1m", dataLimit: 129600, description: "Last 90 days" }
  ];

  // Load available symbols
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const response = await fetchSymbols();
        setSymbols(response.symbols);
        
        // Use initialSelectedSymbols if provided, otherwise select first 3 symbols by default
        if (memoizedInitialSymbols && memoizedInitialSymbols.length > 0) {
          // Filter to only include symbols that exist in the available symbols
          const validSymbols = memoizedInitialSymbols.filter(symbol => 
            response.symbols.includes(symbol)
          );
          console.log('🎯 Setting initial symbols:', validSymbols.length > 0 ? validSymbols : response.symbols.slice(0, 3));
          setSelectedSymbols(validSymbols.length > 0 ? validSymbols : response.symbols.slice(0, 3));
        } else {
          console.log('🎯 No initial symbols, using default:', response.symbols.slice(0, 3));
          setSelectedSymbols(response.symbols.slice(0, 3));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load symbols");
      }
    };
    loadSymbols();
  }, [memoizedInitialSymbols]);

  // Additional effect to handle initial symbols when they change after symbols are loaded
  useEffect(() => {
    if (symbols.length > 0 && memoizedInitialSymbols && memoizedInitialSymbols.length > 0) {
      const validSymbols = memoizedInitialSymbols.filter(symbol => 
        symbols.includes(symbol)
      );
      if (validSymbols.length > 0) {
        console.log('🎯 Updating selected symbols with initial symbols:', validSymbols);
        setSelectedSymbols(validSymbols);
      }
    }
  }, [symbols, memoizedInitialSymbols]);

  // Effect to handle initial symbols even before symbols are loaded
  useEffect(() => {
    if (memoizedInitialSymbols && memoizedInitialSymbols.length > 0) {
      console.log('🎯 Setting selected symbols immediately with initial symbols:', memoizedInitialSymbols);
      setSelectedSymbols(memoizedInitialSymbols);
    }
  }, [memoizedInitialSymbols]);

  // Load candle data for selected symbols
  useEffect(() => {
    if (selectedSymbols.length === 0) return;

    const loadCandleData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const candlePromises = selectedSymbols.map(symbol =>
          fetchCandles(symbol, selectedTimeframe, selectedDataLimit)
        );
        
        const results = await Promise.all(candlePromises);
        const newData: { [symbol: string]: CandleData[] } = {};
        
        selectedSymbols.forEach((symbol, index) => {
          newData[symbol] = results[index];
        });
        
        setData(newData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load candle data");
      } finally {
        setLoading(false);
      }
    };

    loadCandleData();
  }, [selectedSymbols, selectedTimeframe, selectedDataLimit]);

  // Draw the chart
  useEffect(() => {
    if (!svgRef.current || Object.keys(data).length === 0 || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Get all data points for scaling
    const allData = Object.values(data).flat();
    if (allData.length === 0) return;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(allData, d => new Date(d.ts)) as [Date, Date])
      .range([0, innerWidth]);

    // Y-scale based on normalization
    const yScale = d3.scaleLinear()
      .domain(normalizeData ? [0, 100] : d3.extent(allData, d => d.close) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line<CandleData>()
      .x(d => xScale(new Date(d.ts)))
      .y(d => yScale(d.close))
      .curve(d3.curveMonotoneX);

    // Draw lines for each symbol
    Object.entries(data).forEach(([symbol, candleData], index) => {
      if (candleData.length === 0) return;

      // Normalize the data for this symbol
      const normalizedData = normalizeCandleData(candleData);

      g.append("path")
        .datum(normalizedData)
        .attr("fill", "none")
        .attr("stroke", colorScale(symbol))
        .attr("stroke-width", 2)
        .attr("d", line)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

      // Add dots for data points (optimized for performance with large datasets)
      const maxDots = 100; // Maximum number of dots to display
      const dotInterval = Math.max(1, Math.floor(normalizedData.length / maxDots));
      
      g.selectAll(`.dot-${symbol}`)
        .data(normalizedData.filter((_, i) => i % dotInterval === 0))
        .enter().append("circle")
        .attr("class", `dot-${symbol}`)
        .attr("cx", d => xScale(new Date(d.ts)))
        .attr("cy", d => yScale(d.close))
        .attr("r", selectedDataLimit > 1000 ? 2 : 3) // Smaller dots for longer timeframes
        .attr("fill", colorScale(symbol))
        .style("opacity", 0)
        .on("mouseover", function(event, d) {
          // Tooltip
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000");

          // Find original data for this timestamp
          const originalData = candleData.find(orig => orig.ts === d.ts);
          
          tooltip.html(`
            <strong>${symbol}</strong><br/>
            Time: ${new Date(d.ts).toLocaleString()}<br/>
            ${normalizeData && originalData ? `
              <span style="color: #666;">Normalized Values:</span><br/>
              Open: ${d.open.toFixed(1)} | High: ${d.high.toFixed(1)} | Low: ${d.low.toFixed(1)} | Close: ${d.close.toFixed(1)}<br/>
              <span style="color: #666;">Original Values:</span><br/>
              Open: $${originalData.open.toFixed(2)} | High: $${originalData.high.toFixed(2)} | Low: $${originalData.low.toFixed(2)} | Close: $${originalData.close.toFixed(2)}<br/>
            ` : `
              Open: $${d.open.toFixed(2)}<br/>
              High: $${d.high.toFixed(2)}<br/>
              Low: $${d.low.toFixed(2)}<br/>
              Close: $${d.close.toFixed(2)}<br/>
            `}
            Volume: ${d.volume.toFixed(2)}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.selectAll(".tooltip").remove();
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 20)
        .style("opacity", 0.7);
    });

    // Add grid lines with better contrast
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => ""))
      .style("opacity", 0.15)
      .style("stroke", "#ffffff")
      .style("stroke-dasharray", "2,2");

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => ""))
      .style("opacity", 0.15)
      .style("stroke", "#ffffff")
      .style("stroke-dasharray", "2,2");

    // Add axes with dynamic formatting based on timeframe
    const timeFormat = selectedDataLimit > 1440 ? 
      d3.timeFormat("%m/%d") : // For longer periods, show month/day
      d3.timeFormat("%H:%M");  // For shorter periods, show hour:minute
    
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(timeFormat as any)
      .ticks(selectedDataLimit > 1000 ? 8 : 12); // Fewer ticks for longer timeframes
    
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .style("color", "#ffffff")
      .selectAll("text")
      .style("fill", "#ffffff")
      .style("font-size", "12px");

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(normalizeData ? d3.format(".0f") : d3.format("$.2f")))
      .style("color", "#ffffff")
      .selectAll("text")
      .style("fill", "#ffffff")
      .style("font-size", "12px");

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (innerHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "#ffffff")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text(normalizeData ? "Normalized Price (0-100)" : "Price ($)");

    g.append("text")
      .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + margin.bottom})`)
      .style("text-anchor", "middle")
      .style("fill", "#ffffff")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Time");

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(${innerWidth + 10}, 20)`);

    Object.keys(data).forEach((symbol, index) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${index * 20})`);

      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(symbol))
        .attr("rx", 3)
        .attr("ry", 3);

      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("font-size", "12px")
        .style("fill", "#ffffff")
        .style("font-weight", "500")
        .text(symbol);
    });

    // Add normalization explanation
    if (normalizeData) {
      const explanation = g.append("g")
        .attr("transform", `translate(${innerWidth - 200}, 20)`);
      
      explanation.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-size", "11px")
        .style("fill", "#ffffff")
        .style("font-weight", "500")
        .text("Data normalized to 0-100 scale");
      
      explanation.append("text")
        .attr("x", 0)
        .attr("y", 14)
        .style("font-size", "11px")
        .style("fill", "#ffffff")
        .style("font-weight", "500")
        .text("for better comparison");
    }

  }, [data, width, height, loading, normalizeData, selectedDataLimit]);

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleTimeframeChange = (timeframe: string, dataLimit: number) => {
    setSelectedTimeframe(timeframe);
    setSelectedDataLimit(dataLimit);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Timeframe Selection */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Time Period</h3>
                <p className="text-blue-200 text-sm">
                  {timeframeOptions.find(opt => opt.dataLimit === selectedDataLimit)?.description}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label htmlFor="timeframe-select" className="text-sm font-semibold text-white">
              Select Timeframe:
            </label>
            <select
              id="timeframe-select"
              value={selectedDataLimit}
              onChange={(e) => {
                const limit = parseInt(e.target.value);
                const option = timeframeOptions.find(opt => opt.dataLimit === limit);
                if (option) {
                  handleTimeframeChange(option.value, option.dataLimit);
                }
              }}
              className="px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-lg transition-all duration-300"
            >
              {timeframeOptions.map(option => (
                <option key={option.label} value={option.dataLimit} className="bg-slate-800 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Quick preset buttons for common timeframes */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-blue-200 mb-4 font-semibold">⚡ Quick Select:</p>
          <div className="flex flex-wrap gap-3">
            {timeframeOptions.slice(0, 4).map(option => (
              <button
                key={option.label}
                onClick={() => handleTimeframeChange(option.value, option.dataLimit)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedDataLimit === option.dataLimit
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 backdrop-blur-md rounded-2xl p-6 border border-slate-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-gray-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Cryptocurrency Symbols</h3>
                <p className="text-slate-200 text-sm">
                  {selectedSymbols.length > 0 
                    ? `${selectedSymbols.length} symbol${selectedSymbols.length > 1 ? 's' : ''} selected`
                    : 'No symbols selected'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedSymbols(symbols.slice(0, 3))}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/20 backdrop-blur-md"
            >
              Select Top 3
            </button>
            <button
              onClick={() => setSelectedSymbols([])}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/20 backdrop-blur-md"
            >
              Clear All
            </button>
            <button
              onClick={() => setNormalizeData(!normalizeData)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                normalizeData
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20 backdrop-blur-md'
              }`}
              title={normalizeData ? "Switch to absolute prices" : "Switch to normalized prices (0-100 scale)"}
            >
              {normalizeData ? "📊 Normalized" : "💰 Absolute"}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {symbols.map(symbol => (
            <button
              key={symbol}
              onClick={() => handleSymbolToggle(symbol)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedSymbols.includes(symbol)
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/20 backdrop-blur-md'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-white"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Loading Chart Data</h3>
            <p className="text-slate-300">Fetching real-time market information...</p>
          </div>
        </div>
      )}

      {!loading && selectedSymbols.length === 0 && (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-slate-500 to-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No Symbols Selected</h3>
            <p className="text-slate-300">Please select at least one symbol to display the chart.</p>
          </div>
        </div>
      )}

      {!loading && selectedSymbols.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Multi-Symbol Price Chart
                </h2>
                <p className="text-purple-200">
                  {timeframeOptions.find(opt => opt.dataLimit === selectedDataLimit)?.label} • {selectedSymbols.length} symbols
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-purple-200">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLineChart;

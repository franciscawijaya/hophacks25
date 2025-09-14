"use client";

import React, { useEffect, useRef, useState } from 'react';
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
  limit = 200
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
        // Select first 3 symbols by default
        setSelectedSymbols(response.symbols.slice(0, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load symbols");
      }
    };
    loadSymbols();
  }, []);

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

    // Add axes with dynamic formatting based on timeframe
    const timeFormat = selectedDataLimit > 1440 ? 
      d3.timeFormat("%m/%d") : // For longer periods, show month/day
      d3.timeFormat("%H:%M");  // For shorter periods, show hour:minute
    
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(timeFormat as any)
      .ticks(selectedDataLimit > 1000 ? 8 : 12); // Fewer ticks for longer timeframes
    
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(normalizeData ? d3.format(".0f") : d3.format("$.2f")));

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (innerHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(normalizeData ? "Normalized Price (0-100)" : "Price ($)");

    g.append("text")
      .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + margin.bottom})`)
      .style("text-anchor", "middle")
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
        .attr("fill", colorScale(symbol));

      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("font-size", "12px")
        .text(symbol);
    });

    // Add normalization explanation
    if (normalizeData) {
      const explanation = g.append("g")
        .attr("transform", `translate(${innerWidth - 200}, 20)`);
      
      explanation.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-size", "10px")
        .style("fill", "#666")
        .text("Data normalized to 0-100 scale");
      
      explanation.append("text")
        .attr("x", 0)
        .attr("y", 12)
        .style("font-size", "10px")
        .style("fill", "#666")
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
    <div className="w-full">
      {/* Timeframe Selection */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">Time Period</h3>
            <p className="text-sm text-blue-700">
              {timeframeOptions.find(opt => opt.dataLimit === selectedDataLimit)?.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <label htmlFor="timeframe-select" className="text-sm font-medium text-blue-900">
              Select:
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
              className="px-4 py-2 border border-blue-300 rounded-lg bg-white text-blue-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              {timeframeOptions.map(option => (
                <option key={option.label} value={option.dataLimit}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Quick preset buttons for common timeframes */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-blue-600 mb-2 font-medium">Quick Select:</p>
          <div className="flex flex-wrap gap-2">
            {timeframeOptions.slice(0, 4).map(option => (
              <button
                key={option.label}
                onClick={() => handleTimeframeChange(option.value, option.dataLimit)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedDataLimit === option.dataLimit
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Symbols</h3>
            <p className="text-sm text-gray-600">
              {selectedSymbols.length > 0 
                ? `${selectedSymbols.length} symbol${selectedSymbols.length > 1 ? 's' : ''} selected`
                : 'No symbols selected'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSymbols(symbols.slice(0, 3))}
              className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            >
              Select Top 3
            </button>
            <button
              onClick={() => setSelectedSymbols([])}
              className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setNormalizeData(!normalizeData)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                normalizeData
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-green-700 hover:bg-green-100 border border-green-300'
              }`}
              title={normalizeData ? "Switch to absolute prices" : "Switch to normalized prices (0-100 scale)"}
            >
              {normalizeData ? "Normalized" : "Absolute"}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {symbols.map(symbol => (
            <button
              key={symbol}
              onClick={() => handleSymbolToggle(symbol)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedSymbols.includes(symbol)
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300 hover:border-blue-300'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading chart data...</span>
        </div>
      )}

      {!loading && selectedSymbols.length === 0 && (
        <div className="flex justify-center items-center h-64 text-gray-500">
          Please select at least one symbol to display the chart.
        </div>
      )}

      {!loading && selectedSymbols.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Multi-Symbol Price Chart ({timeframeOptions.find(opt => opt.dataLimit === selectedDataLimit)?.label})
          </h2>
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border border-gray-200 rounded"
          />
        </div>
      )}
    </div>
  );
};

export default MultiLineChart;

"use client";
import React, { use, useEffect } from "react";
import * as d3 from "d3";
import { fetchSymbols, fetchCandles } from "@/utils/api";
import { SYMBOL_NAME_MAP, type Candle } from "@/utils/defines";

export default function BubbleChartPage() {
  const [data, setData] = React.useState<any[]>([]);
  const [frame, setFrame] = React.useState(0);
  const [maxFrame, setMaxFrame] = React.useState(0);

  function draw_frame(index: number) {
      const svg = d3.select("#bubble-chart");
      if (svg.empty()) return;
      const width = 350;
      const height = 700;
      const bubbleHeight = 350;
      const cartHeight = height - bubbleHeight;
      const bubbleGroup = svg.select("#bubble-area");
      const cartGroup = svg.select("#cart-area");
      svg.attr("width", width)
        .attr("height", height);
        // .style("background", "#f5f7fa");

      bubbleGroup.selectAll("*").remove(); 
      bubbleGroup.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", bubbleHeight - 20)
        .attr("height", width - 20)
        .attr("rx", 24)
        .attr("ry", 24)
        .attr("fill", "#b3d6ebff")
        .attr("stroke", "#1976d2")
        .attr("stroke-width", 2);

      const data_frame = data.filter(item => {
        return item.candles.length > index;
      }).map(item => {
        return item.candles[index];
      });

      if (!data_frame.length) return;
      
      const pack = d3.pack<Candle>()
        .size([width, bubbleHeight])
        .padding(3);
      const root = d3.hierarchy({ children: data_frame } as unknown)
        .sum((d: any) => {
          if (typeof d.close === "number") return Math.log10(d.close + 1);
          return 0;
        })
        .sort((a, b) => (b.value as number) - (a.value as number));
      const nodes = pack(root as any).leaves();

      const vividColors = [
        "#ff5252", "#ffb300", "#40c4ff", "#69f0ae", "#d500f9", "#ff4081", "#00bcd4",
        "#8bc34a", "#e040fb", "#ff6e40", "#2979ff", "#cddc39", "#ff1744", "#00e676", "#f50057",
        "#7c4dff", "#00bfae", "#ffab00", "#c51162", "#00b8d4", "#aeea00", "#ff3d00", "#304ffe"
      ];
      const color = d3.scaleOrdinal<string>()
        .domain(data.map(d => d.symbol))
        .range(vividColors);

      const node = bubbleGroup.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      node.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => color((d.data as Candle).symbol))
        .attr("opacity", 0.8)
        .attr("pointer-events", "all");

      node.on("mouseover", function (event, d) {
          d3.select(this).select("circle")
            .attr("opacity", 1);
        })
        .on("mouseout", function (event, d) {
          d3.select(this).select("circle")
            .attr("opacity", 0.8);
        });

      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .style("font-size", d => {
          const symbol = (d.data as Candle).symbol;
          const name = SYMBOL_NAME_MAP[symbol] || symbol;
          const base = Math.max(8, d.r / 2.5);
          return Math.max(8, base - (name.length - 8) * 2);
        })
        .style("font-family", "Geist, Inter, Arial, sans-serif")
        .style("fill", "#222")
        .text(d => SYMBOL_NAME_MAP[(d.data as Candle).symbol]);

      let tooltip = d3.select<HTMLDivElement, unknown>("#bubble-tooltip");
      if (tooltip.empty()) {
        tooltip = d3.select("body")
          .append("div")
          .attr("id", "bubble-tooltip")
          .style("position", "fixed")
          .style("pointer-events", "none")
          .style("z-index", 9999)
          .style("background", "rgba(30, 30, 40, 0.97)")
          .style("color", "#fff")
          .style("padding", "10px 16px")
          .style("border-radius", "8px")
          .style("font-size", "15px")
          .style("font-family", "Geist, Inter, Arial, sans-serif")
          .style("box-shadow", "0 2px 12px 0 rgba(0,0,0,0.18)")
          .style("display", "none");
        tooltip = d3.select<HTMLDivElement, unknown>("#bubble-tooltip");
      }

      node.on("mouseover", function (event, d) {
          const data = d.data as Candle;
          d3.select(this).select("circle")
            .attr("opacity", 1);
          tooltip
            .style("display", "block")
            .html(
              `<div style='font-size:18px;font-weight:700;margin-bottom:2px;'>${SYMBOL_NAME_MAP[data.symbol]}</div>` +
              // `<div>High: <b>${data.high}</b></div>` +
              // `<div>Open: <b>${data.open}</b></div>` +
              `<div>Close: <b>${data.close}</b></div>` +
              `<div>Volume: <b>${data.volume}</b></div>`
            );
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", (event.clientX + 18) + "px")
            .style("top", (event.clientY + 8) + "px");
        })
        .on("mouseout", function (event, d) {
          d3.select(this).select("circle")
            .attr("opacity", 0.8);
          tooltip.style("display", "none");
        });

        // Cart Area
        cartGroup.selectAll("*").remove();
        cartGroup.attr("transform", `translate(0, ${bubbleHeight})`);
        cartGroup.append("rect")
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", cartHeight - 20)
          .attr("height", width - 20)
          .attr("rx", 24)
          .attr("ry", 24)
          .attr("fill", "#fff8ef")
          .attr("stroke", "#ff9800")
          .attr("stroke-width", 2);
    }


    async function draw() {
      let symbols: string[] = [];
      try {
        const res = await fetchSymbols();
        symbols = Array.isArray(res.symbols) ? res.symbols : [];
      } catch {
        return;
      }
      if (!symbols.length) return;

      const all = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const candles = await fetchCandles(symbol, "1m", 1);
            return { symbol, candles };
          } catch {
            return { symbol, candles: [] };
          }
        })
      );
      setData(all);
      const max = Math.max(...all.map(item => item.candles.length));
      setMaxFrame(max > 0 ? max - 1 : 0);
    }

  useEffect(() => {
    draw();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      draw_frame(frame);
    }
  }, [data, frame]);

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <svg id="bubble-chart">
        <g id="bubble-area" />
        <g id="cart-area" />
      </svg>
      {/* <div style={{ width: 600, marginBottom: 24 }}>
        <input
          type="range"
          min={0}
          max={maxFrame}
          value={frame}
          onChange={e => setFrame(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ textAlign: "center", marginTop: 4, color: "#666" }}>
          Timeframe: {frame + 1} / {maxFrame + 1}
        </div>
      </div> */}
    </div>
  );
}

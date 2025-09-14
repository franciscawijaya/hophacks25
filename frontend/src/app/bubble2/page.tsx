"use client";
import React, { use, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { fetchSymbols, fetchCandles } from "@/utils/api";
import { SYMBOL_NAME_MAP, type Candle, type Circle } from "@/utils/defines";
import { start } from "repl";

// svg parameters
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
const width = 350;
const height = 700;
const bubbleHeight = 350;
const cartHeight = height - bubbleHeight;
const dragging_circle_radius = 30;

let dragging_circle: Circle | null = null;
let cart_circles: Circle[] = [];
let originalBalance: number | null = null;

export default function BubbleChartPage2() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [data, setData] = React.useState<any[]>([]);
  const [frame, setFrame] = React.useState(0);
  const [maxFrame, setMaxFrame] = React.useState(0);
  const [balance, setBalance] = React.useState<number | null>(null);
  const balanceRef = React.useRef(balance);
  let wallet: Record<string, number> = {};
  const walletRef = React.useRef(wallet);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const fetchBalance = async () => {
      try {
        const res = await fetch(BACKEND_URL + "/api/balance", {
          method: "GET",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (res.status === 200) {
          setBalance(data.balance);
        } else {
          console.log(data.error || "Failed to fetch balance");
          if (res.status === 401) {
            logout();
            router.push("/login");
            return;
          }
        }
      } catch (e) {
        console.log("Network error");
      }
    };
    if (isAuthenticated) fetchBalance();
  }, [isAuthenticated, refreshKey]);

  function cancelCart() {
    cart_circles = [];
    svg.select("#dragging-circle").selectAll("circle").remove();
    svg.select("#dragging-circle").selectAll("text").remove();
    if (originalBalance !== null) {
      setBalance(originalBalance);
      originalBalance = null;
    }
  }
  
  async function buyCart() {
    if (cart_circles.length === 0) return;
    let totalCost = 0;
    for (const c of cart_circles) {
      totalCost += c.amount * c.price;
    }
    console.log(`Total cost: $${totalCost.toFixed(2)}`);
    if (balanceRef.current === null || balanceRef.current < totalCost) {
      console.log("Insufficient balance");
      return;
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const buyPosition = async (symbol: string, quantity: number, price: number) => {
      try {
        const res = await fetch(BACKEND_URL + "/api/portfolio/sell", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ symbol, quantity, price })
        });
        const data = await res.json();
        if (res.status === 200) {
          return { success: true };
        } else {
          return { success: false, status: res.status, error: data.error };
        }
      } catch (e) {
        return { success: false, status: 500, error: "Network error" };
      }
    };

    for (const c of cart_circles) {
      const result = await buyPosition(c.symbol, c.amount, c.price);
      if (result.success) {
        console.log(`Selling ${c.amount} of ${c.symbol} at price ${c.price}`);
      } else {
        console.log("Sell failed:", result.error);
        if (result.status === 401) {
          logout();
          router.push("/login");
          return;
        }
      }
    }

    originalBalance = null;
    cart_circles = [];
    svg.select("#dragging-circle").selectAll("circle").remove();
    svg.select("#dragging-circle").selectAll("text").remove();

    setRefreshKey(k => k + 1);
  }
  
  function handleBubbleMouseDown(event: any, d: any, color: d3.ScaleOrdinal<string, string>, price: number) {
    if (dragging_circle) return;
  
    const circleGroup = svg.select("#dragging-circle");
    const circle = circleGroup.append("circle")
      .attr("cx", d.x)
      .attr("cy", d.y)
      .attr("r", dragging_circle_radius)
      .attr("fill", color(d.data.symbol))
      .attr("opacity", 0.8)
      .attr("pointer-events", "all");

    const initialAmount = Math.min(1/price, walletRef.current[d.data.symbol] || 0);
    dragging_circle = { symbol: d.data.symbol, amount: initialAmount, price: price, circle: circle.node() as SVGCircleElement };
    const currentSymbol = d.data.symbol;

    let tooltip = d3.select<HTMLDivElement, unknown>("#drag-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("id", "drag-tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("z-index", 9999)
        .style("background", "rgba(30, 30, 40, 0.97)")
        .style("color", "#ff7f3bff")
        .style("padding", "8px 14px")
        .style("border-radius", "8px")
        .style("font-size", "15px")
        .style("font-family", "Geist, Inter, Arial, sans-serif")
        .style("box-shadow", "0 2px 12px 0 rgba(0,0,0,0.18)")
        .style("display", "none");
      tooltip = d3.select<HTMLDivElement, unknown>("#drag-tooltip");
    }
  
    svg.on("mousemove", function(event) {
      if (!dragging_circle) return;
      const [x, y] = d3.pointer(event);
      d3.select(dragging_circle.circle).attr("cx", x).attr("cy", y);
      tooltip
        .style("display", "block")
        .style("left", (event.clientX + 18) + "px")
        .style("top", (event.clientY + 8) + "px")
        .html(
          `<div style='font-size:16px;font-weight:700;margin-bottom:2px;'>${SYMBOL_NAME_MAP[d.data.symbol] || d.data.symbol}</div>`
        );
    });
    svg.on("mouseup", function(event) {
      if (!dragging_circle) return;
      const cartGroup = svg.select("#cart-area");
      const cartRect = cartGroup.select("rect");
      const circle = d3.select(dragging_circle.circle);
      const cx = parseFloat(circle.attr("cx"));
      const cy = parseFloat(circle.attr("cy"));
      const rx = parseFloat(cartRect.attr("x"));
      const ry = parseFloat(cartRect.attr("y"));
      const rw = parseFloat(cartRect.attr("width"));
      const rh = parseFloat(cartRect.attr("height"));
      if (cx - dragging_circle_radius >= rx && cx + dragging_circle_radius <= rx + rw &&
        cy - bubbleHeight - dragging_circle_radius >= ry && cy - bubbleHeight + dragging_circle_radius <= ry + rh) {
        if (cart_circles.length === 0) {
          originalBalance = balance;
        }
        cart_circles.push(dragging_circle);
        const oldAmount = dragging_circle.amount;
        let circle_text_amount = circleGroup.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .attr("x", circle.attr("cx"))
          .attr("y", circle.attr("cy"))
          .style("font-size", 16)
          .style("font-family", "Geist, Inter, Arial, sans-serif")
          .style("fill", "#000000ff")
          .style("user-select", "none")
          .text(oldAmount < 0.001 ? oldAmount.toExponential(2) : oldAmount.toFixed(4));
        const oldPrice = price;
        const oldCost = oldAmount * oldPrice;
        setBalance(prev => prev === null ? null : prev + oldCost);
        let circle_text_cost = circleGroup.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "1.8em")
          .attr("x", circle.attr("cx"))
          .attr("y", circle.attr("cy"))
          .style("font-size", 14)
          .style("font-family", "Geist, Inter, Arial, sans-serif")
          .style("fill", "#801100ff")
          .style("user-select", "none")
          .text(`$${oldCost.toFixed(2)}`);
        circle
          .on("mouseover", function() {
            d3.select(this).style("cursor", "nwse-resize");
          })
          .on("mouseout", function() {
            d3.select(this).style("cursor", "default");
          })
          .on("mousedown", function(event, d) {
            const [x, y] = d3.pointer(event, svg.node());
            const dx = x - cx;
            const dy = y - cy;
            const startDis = Math.sqrt(dx * dx + dy * dy);
            const startR = +d3.select(this).attr("r");
            const startBalance = balanceRef.current;
            const startCost = cart_circles.find(c => c.circle === circle.node())!.amount * price;
            d3.select(window).on("mousemove.resize", function(event2) {
              const [x, y] = d3.pointer(event2, svg.node());
              const dx = x - cx;
              const dy = y - cy;
              const dis = Math.sqrt(dx * dx + dy * dy);
              let newR = Math.max(20, startR * dis / startDis);
              const ratio = newR / dragging_circle_radius;
              let newAmount = Math.max(0.0001, Math.pow(ratio, 5) * oldAmount);
              let newCost = newAmount * oldPrice;
              let newBalance = startBalance === null ? null : startBalance + newCost - startCost;
              if (newBalance === null) {
                return;
              }
              if (newAmount > walletRef.current[currentSymbol]) {
                newAmount = walletRef.current[currentSymbol];
                newCost = walletRef.current[currentSymbol] * oldPrice;
                newR = dragging_circle_radius * Math.pow(newAmount / oldAmount, 1/5);
                newBalance = startBalance + newCost - startCost;
              }
              cart_circles.find(c => c.circle === circle.node())!.amount = newAmount;
              circle_text_amount.text(newAmount < 0.001 ? newAmount.toExponential(2) : newAmount.toFixed(4));
              setBalance(newBalance);
              circle_text_cost.text(`$${newCost.toFixed(2)}`);
              d3.select(circle.node()).attr("r", newR);
            });
            d3.select(window).on("mouseup.resize", function(event) {
              d3.select(window).on("mousemove.resize", null).on("mouseup.resize", null);
            });
          });
      } else {
        circle.remove();
      }
      dragging_circle = null;
      tooltip.style("display", "none");
    });
  }

  function draw_frame(index: number) {
      if (svg.empty()) return;
      const bubbleGroup = svg.select("#bubble-area");
      const cartGroup = svg.select("#cart-area");
      svg.attr("width", width)
        .attr("height", height);
        // .style("background", "#f5f7fa");

      bubbleGroup.selectAll("*").remove(); 
      
      // Add gradient definitions
      const defs = svg.select("defs");
      if (defs.empty()) {
        svg.append("defs");
      }
      
      // Portfolio gradient
      svg.select("defs").selectAll("#portfolioGradient").remove();
      svg.select("defs").append("linearGradient")
        .attr("id", "portfolioGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .selectAll("stop")
        .data([
          { offset: "0%", color: "#8b5cf6", opacity: 0.3 },
          { offset: "50%", color: "#ec4899", opacity: 0.2 },
          { offset: "100%", color: "#f59e0b", opacity: 0.3 }
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color)
        .attr("stop-opacity", d => d.opacity);
      
      bubbleGroup.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", bubbleHeight - 20)
        .attr("height", width - 20)
        .attr("rx", 24)
        .attr("ry", 24)
        .attr("fill", "url(#portfolioGradient)")
        .attr("stroke", "#8b5cf6")
        .attr("stroke-width", 2)
        .attr("filter", "url(#glow2)");

      const data_frame = data;

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
        .domain(Object.keys(SYMBOL_NAME_MAP))
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
        .attr("pointer-events", "all")
        .attr("filter", "url(#glow2)")
        .style("transition", "all 0.3s ease")
        .on("mouseover", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 1)
            .attr("r", d => d.r * 1.1);
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 0.8)
            .attr("r", d => d.r);
        });

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
              `<div>Price: <b>${data.low}</b></div>` +
              `<div>Balance: <b>${data.high}</b></div>`
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
        }).on("mousedown", function(event, d) {
          handleBubbleMouseDown(event, d, color, (d.data as Candle).low);
        });

        // Cart Area
        cartGroup.selectAll("*").remove();
        cartGroup.attr("transform", `translate(0, ${bubbleHeight})`);
        
        // Sell cart gradient
        svg.select("defs").selectAll("#sellCartGradient").remove();
        svg.select("defs").append("linearGradient")
          .attr("id", "sellCartGradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .selectAll("stop")
          .data([
            { offset: "0%", color: "#10b981", opacity: 0.3 },
            { offset: "50%", color: "#059669", opacity: 0.2 },
            { offset: "100%", color: "#047857", opacity: 0.3 }
          ])
          .enter().append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color)
          .attr("stop-opacity", d => d.opacity);
        
        cartGroup.append("rect")
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", cartHeight - 20)
          .attr("height", width - 20)
          .attr("rx", 24)
          .attr("ry", 24)
          .attr("fill", "url(#sellCartGradient)")
          .attr("stroke", "#10b981")
          .attr("stroke-width", 2)
          .attr("filter", "url(#glow2)");

      svg.selectAll("text").style("user-select", "none");
    }


    async function draw() {
      svg = d3.select("#bubble2-chart");
      async function fetchPortfolio() {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        try {
          const res = await fetch(BACKEND_URL + "/api/portfolio", {
            method: "GET",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
          });
          if (!res.ok) throw new Error("Failed to fetch portfolio");
          const data = await res.json();
          return data;
        } catch (error) {
          console.error(error);
        }
      }
      const portfolio = await fetchPortfolio();
      const all = portfolio.portfolio.map((item: any) => ({
        symbol: item.symbol,
        high: item.quantity,
        low: item.price_per_unit_bought,
        close: item.quantity * item.price_per_unit_bought
      }) as Candle);
      for (const item of all) {
        walletRef.current[item.symbol] = item.high;
      }
      setData(all);
      setMaxFrame(0);
    }

  useEffect(() => {
    draw();
    cancelCart();
  }, [refreshKey]);

  useEffect(() => {
    if (data.length > 0) {
      draw_frame(frame);
    }
  }, [data, frame]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  return (
    <div className="flex flex-col justify-center items-center min-h-[700px] space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-white">Your Portfolio</h3>
        </div>
        <p className="text-purple-200 text-sm">Drag from wallet to cart to sell</p>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-2xl">
          <svg id="bubble2-chart" width={width} height={height} className="rounded-2xl">
            <defs>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g id="bubble-area" />
            <g id="cart-area" />
            <g id="dragging-circle" />
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleRefresh}
          className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        </button>
        
        <button 
          onClick={buyCart}
          className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span>Sell</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        </button>
        
        <div className="flex items-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${cart_circles.length === 0 ? 'bg-purple-400' : 'bg-green-400'} animate-pulse`}></div>
            <span className="text-white font-semibold">Balance:</span>
          </div>
          <span className={`text-lg font-bold ${cart_circles.length === 0 ? 'text-purple-300' : 'text-green-300'}`}>
            {balance === null ? '...' : `$${balance.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Cart Status */}
      {cart_circles.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-200 font-semibold">
              {cart_circles.length} position{cart_circles.length > 1 ? 's' : ''} ready to sell
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

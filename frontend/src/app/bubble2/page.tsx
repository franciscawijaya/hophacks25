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
      bubbleGroup.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", bubbleHeight - 20)
        .attr("height", width - 20)
        .attr("rx", 24)
        .attr("ry", 24)
        .attr("fill", "#f1dab4ff")
        .attr("stroke", "#f07110ff")
        .attr("stroke-width", 2);

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
              `<div>Price: <b>${data.low}</b></div>` +
              `<div>Balance: <b>${data.close}</b></div>`
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
        cartGroup.append("rect")
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", cartHeight - 20)
          .attr("height", width - 20)
          .attr("rx", 24)
          .attr("ry", 24)
          .attr("fill", "#b3c2e6ff")
          .attr("stroke", "#1b17f4ff")
          .attr("stroke-width", 2);

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
        walletRef.current[item.symbol] = item.close;
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
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <svg id="bubble2-chart" width={width} height={height}>
        <g id="bubble-area" />
        <g id="cart-area" />
        <g id="dragging-circle" />
      </svg>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={{ padding: '8px 18px', fontSize: 18, borderRadius: 8, background: '#eee', border: '1px solid #bbb', cursor: 'pointer' }} onClick={handleRefresh}>↻</button>
        {/* <button style={{ padding: '8px 18px', fontSize: 18, borderRadius: 8, background: '#eee', border: '1px solid #bbb', cursor: 'pointer' }} onClick={cancelCart}>Cancel</button> */}
        <button style={{ padding: '8px 18px', fontSize: 18, borderRadius: 8, background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={buyCart}>Sell</button>
        <span style={{ marginLeft: 6, fontSize: 18, color: cart_circles.length === 0 ? '#1976d2' : '#f43b3bff', fontWeight: 600 }}>
          Balance: {balance === null ? '...' : `$${balance.toFixed(2)}`}
        </span>
      </div>
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

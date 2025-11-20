import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  BarChart2,
  Save,
  AlertTriangle,
  Target,
  Shield,
  Filter,
  Download,
  Calculator,
  Sparkles,
  BrainCircuit,
  X,
  Clock,
  Zap,
  Award,
  FileText,
  UploadCloud,
  DownloadCloud,
  Globe,
  Wifi,
  Pencil, // <--- ADDED PENCIL ICON HERE
} from "lucide-react";

// --- GEMINI API KEY ---
const apiKey = "AIzaSyDC2O6hetpJGfXQ6RnicdIYK-Cn1KDIkUs";

// --- HELPER FUNCTIONS ---
const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
};

const calculateProfit = (entry, exit, type, lots) => {
  if (!entry || !exit || !lots) return 0;
  const direction = type === "Long" ? 1 : -1;
  const contractSize = 100;
  const rawProfit = (exit - entry) * direction * lots * contractSize;
  const commission = lots * 5;
  return rawProfit - commission;
};

const calculateRR = (entry, sl, tp, type) => {
  if (!entry || !sl || !tp) return "0:0";
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return "0:0";
  const ratio = (reward / risk).toFixed(1);
  return `1:${ratio}`;
};

const exportToCSV = (trades) => {
  const headers = [
    "Date",
    "Session",
    "Pair",
    "Type",
    "Strategy",
    "Lot Size",
    "Entry",
    "Exit",
    "Profit",
    "R:R",
    "Notes",
  ];
  const rows = trades.map((t) => [
    t.date,
    t.session || "N/A",
    t.pair,
    t.type,
    t.strategy || "N/A",
    t.lotSize,
    t.entry,
    t.exit,
    t.profit.toFixed(2),
    t.rr,
    `"${t.notes}"`,
  ]);
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "backtest_terminal_data.csv");
  document.body.appendChild(link);
  link.click();
};

const callGeminiAPI = async (prompt) => {
  if (!apiKey)
    return "Please add your AI API Key in the code to use this feature.";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No analysis available."
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Analysis failed. Please check your API Key.";
  }
};

// --- COMPONENTS ---

const DataSyncModal = ({ onClose, trades, setTrades, balance, setBalance }) => {
  const fileInputRef = useRef(null);

  const handleDownload = () => {
    const backupData = {
      version: 1,
      balance: balance,
      trades: trades,
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trade_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (Array.isArray(importedData)) {
          setTrades(importedData);
          localStorage.setItem("trades", JSON.stringify(importedData));
          alert("⚠️ Only trades synced. Please set balance manually.");
        } else if (
          importedData.trades &&
          typeof importedData.balance !== "undefined"
        ) {
          setTrades(importedData.trades);
          setBalance(importedData.balance);

          localStorage.setItem("trades", JSON.stringify(importedData.trades));
          localStorage.setItem("balance", importedData.balance);

          alert("✅ Full Sync Complete! Trades & Balance updated.");
        } else {
          alert("❌ Invalid file format.");
        }
        onClose();
      } catch (error) {
        alert("❌ Error reading file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#131722] p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-wide">
            <UploadCloud size={24} className="text-emerald-400" /> FULL SYNC
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">
              Step 1: Backup (Laptop)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Save your Trades AND Balance to a file.
            </p>
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <DownloadCloud size={18} /> Download Full Backup
            </button>
          </div>

          <div className="flex items-center justify-center text-slate-600">
            <span className="h-px w-full bg-slate-800"></span>
            <span className="px-3 text-xs font-bold uppercase">THEN</span>
            <span className="h-px w-full bg-slate-800"></span>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wider">
              Step 2: Restore (Phone)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Upload file here. It will fix your balance instantly.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".json"
            />
            <button
              onClick={handleUploadClick}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <UploadCloud size={18} /> Load Full Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketSessionWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const utcHour = time.getUTCHours();
  const sessions = [
    {
      name: "LDN",
      active: utcHour >= 7 && utcHour < 16,
      color: "text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]",
    },
    {
      name: "NYC",
      active: utcHour >= 12 && utcHour < 21,
      color: "text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
    },
    {
      name: "TKY",
      active: utcHour >= 0 && utcHour < 9,
      color: "text-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]",
    },
    {
      name: "SYD",
      active: utcHour >= 22 || utcHour < 7,
      color: "text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]",
    },
  ];

  return (
    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-inner">
      <Clock size={14} className="text-slate-400" />
      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
        {sessions.map((s) => (
          <span
            key={s.name}
            className={`transition-all duration-500 ${
              s.active ? s.color + " font-extrabold" : "text-slate-600"
            }`}
          >
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
};

const AIAnalysisModal = ({ isOpen, onClose, title, content, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/90 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-950/30 to-transparent">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 font-mono tracking-tight">
            <Sparkles className="text-emerald-400" size={20} /> {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-emerald-500/30 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-emerald-400 font-mono text-xs animate-pulse uppercase tracking-widest">
                Processing Neural Data...
              </p>
            </div>
          ) : (
            content
          )}
        </div>
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

const RiskCalculatorModal = ({ onClose, currentBalance }) => {
  const [riskType, setRiskType] = useState("USD");
  const [riskValue, setRiskValue] = useState(100);
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");

  const result = useMemo(() => {
    if (!entry || !sl) return 0;
    const riskAmount =
      riskType === "USD"
        ? parseFloat(riskValue)
        : currentBalance * (parseFloat(riskValue) / 100);
    const distance = Math.abs(entry - sl);
    if (distance === 0) return 0;
    const lots = riskAmount / (distance * 100);
    return lots.toFixed(2);
  }, [riskType, riskValue, entry, sl, currentBalance]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700/50 shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold flex items-center gap-2 font-mono">
            <Calculator size={18} className="text-emerald-400" /> POSITION SIZER
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                Risk Mode
              </label>
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setRiskType("USD")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded ${
                    riskType === "USD"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setRiskType("Percent")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded ${
                    riskType === "Percent"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  ACCT (%)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                Risk Amount
              </label>
              <input
                type="number"
                value={riskValue}
                onChange={(e) => setRiskValue(e.target.value)}
                className="w-full p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm font-mono focus:border-emerald-500/50 outline-none transition-all focus:bg-slate-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                Entry Price
              </label>
              <input
                type="number"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                className="w-full p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm font-mono focus:border-blue-500/50 outline-none transition-all focus:bg-slate-800"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                Stop Loss
              </label>
              <input
                type="number"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                className="w-full p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm font-mono focus:border-rose-500/50 outline-none transition-all focus:bg-slate-800"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-xl text-center mt-4 shadow-inner">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-2">
              Optimal Position Size
            </p>
            <p className="text-4xl font-bold text-white font-mono tracking-tight">
              {result}{" "}
              <span className="text-sm text-emerald-400 font-sans">LOTS</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropObjectiveCard = ({ title, current, target, isLossLimit = false }) => {
  let percentage = 0;

  if (isLossLimit) {
    if (current > 0) {
      percentage = 0;
    } else {
      percentage = Math.min(100, (Math.abs(current) / Math.abs(target)) * 100);
    }
  } else {
    percentage = Math.min(100, Math.max(0, (current / target) * 100));
  }

  const isFailed = isLossLimit && percentage >= 100;
  const isPassed = !isLossLimit && percentage >= 100;

  const progressBarColor = isLossLimit
    ? isFailed
      ? "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)]"
      : "bg-orange-500"
    : isPassed
    ? "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
    : "bg-blue-500";

  let statusText = `${percentage.toFixed(1)}%`;
  let statusColor = "text-slate-400";

  if (isFailed) {
    statusText = "FAILED";
    statusColor = "text-rose-500 font-black animate-pulse";
  } else if (isPassed) {
    statusText = "PASSED";
    statusColor = "text-emerald-400 font-black";
  }

  return (
    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="flex justify-between items-start mb-2 relative z-10">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          {title}
        </p>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded bg-black/20 border border-white/5 ${statusColor}`}
        >
          {statusText}
        </span>
      </div>

      <div className="relative z-10 mb-3">
        <p className="text-white font-mono text-sm lg:text-base font-bold truncate">
          <span className={current < 0 ? "text-rose-400" : "text-emerald-400"}>
            {formatCurrency(current)}
          </span>
          <span className="text-slate-600 text-xs mx-1">/</span>
          <span className="text-slate-500 text-xs">
            {formatCurrency(target)}
          </span>
        </p>
      </div>

      <div className="w-full bg-black/30 rounded-full h-1.5 relative z-10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${progressBarColor}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  colorClass,
  bgClass,
}) => (
  <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-lg flex items-start justify-between hover:border-emerald-500/20 hover:shadow-emerald-900/20 hover:-translate-y-1 transition-all duration-300 group">
    <div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-slate-300 transition-colors">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-white tracking-tight font-mono drop-shadow-sm">
        {value}
      </h3>
      {subValue && (
        <p className={`text-xs mt-2 font-medium ${colorClass}`}>{subValue}</p>
      )}
    </div>
    <div
      className={`p-3 rounded-xl ${bgClass} ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity shadow-inner`}
    >
      <Icon size={22} />
    </div>
  </div>
);

const MonthlyCard = ({ monthData }) => {
  const isProfitable = monthData.profit >= 0;
  return (
    <div
      className={`bg-white/5 backdrop-blur-md p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all group relative overflow-hidden ${
        isProfitable
          ? "border-emerald-500/20 hover:border-emerald-500/40"
          : "border-rose-500/20 hover:border-rose-500/40"
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-16 -mt-16 opacity-20 ${
          isProfitable ? "bg-emerald-500" : "bg-rose-500"
        }`}
      ></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h4 className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-1">
            {monthData.monthName}
          </h4>
          <p className="text-slate-500 text-[10px] font-mono">
            {monthData.year}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-lg border ${
            isProfitable
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <span className="text-lg font-bold font-mono">
            {formatCurrency(monthData.profit)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs relative z-10">
        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 mb-1 uppercase tracking-wider font-bold text-[9px]">
            Trades
          </p>
          <p className="text-white font-mono font-bold">{monthData.trades}</p>
        </div>
        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
          <p className="text-slate-500 mb-1 uppercase tracking-wider font-bold text-[9px]">
            Win Rate
          </p>
          <p className="text-white font-mono font-bold">{monthData.winRate}%</p>
        </div>
      </div>
    </div>
  );
};

const HeatmapCell = ({ date, profit }) => {
  let bgClass = "bg-slate-800/30 border border-slate-700/30 text-slate-600";
  if (profit > 0) {
    bgClass =
      "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  } else if (profit < 0) {
    bgClass =
      "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
  }

  return (
    <div className="group relative">
      <div
        className={`w-full h-16 rounded-lg border ${bgClass} flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer`}
      >
        <span className="text-[8px] font-bold uppercase opacity-50 mb-1">
          {date.slice(5)}
        </span>
        <span className="text-[10px] font-mono font-bold">
          {profit === 0 ? "-" : formatCurrency(profit)}
        </span>
      </div>
    </div>
  );
};

export default function ForexJournalApp() {
  // --- LOCAL STORAGE INITIALIZATION ---
  const [trades, setTrades] = useState(() => {
    const savedTrades = localStorage.getItem("trades");
    return savedTrades ? JSON.parse(savedTrades) : [];
  });

  useEffect(() => {
    localStorage.setItem("trades", JSON.stringify(trades));
  }, [trades]);

  const [startingBalance, setStartingBalance] = useState(() => {
    const savedBal = localStorage.getItem("balance");
    if (!savedBal || Number(savedBal) === 100000) {
      return 5000;
    }
    return Number(savedBal);
  });

  useEffect(() => {
    if (startingBalance === 100000) {
      setStartingBalance(5000);
    }
    localStorage.setItem("balance", startingBalance);
  }, [startingBalance]);

  // --- STATE & VARIABLES ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    title: "",
    content: "",
    isLoading: false,
  });
  const [filterPair, setFilterPair] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [editingId, setEditingId] = useState(null); // <--- TRACK EDITING ID

  const profitTarget = startingBalance * 0.1;
  const dailyLossLimit = -(startingBalance * 0.05);
  const maxLossLimit = -(startingBalance * 0.1);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    session: "London",
    pair: "XAUUSD",
    type: "Short",
    strategy: "SMC",
    lotSize: 1.0,
    entry: "",
    stopLoss: "",
    takeProfit: "",
    exit: "",
    notes: "",
  });

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- NEW: EDIT MODE HANDLERS ---
  const handleEdit = (trade) => {
    setEditingId(trade.id);
    setFormData({
      date: trade.date,
      session: trade.session,
      pair: trade.pair,
      type: trade.type,
      strategy: trade.strategy,
      lotSize: trade.lotSize,
      entry: trade.entry,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      exit: trade.exit,
      notes: trade.notes,
    });
    setActiveTab("journal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      session: "London",
      pair: "XAUUSD",
      type: "Short",
      strategy: "SMC",
      lotSize: 1.0,
      entry: "",
      stopLoss: "",
      takeProfit: "",
      exit: "",
      notes: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const entry = parseFloat(formData.entry);
    const exit = parseFloat(formData.exit);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);
    const lots = parseFloat(formData.lotSize);

    const profit = calculateProfit(entry, exit, formData.type, lots);
    const rr = calculateRR(entry, sl, tp, formData.type);
    const outcome = profit > 0 ? "Win" : profit < 0 ? "Loss" : "Breakeven";

    const tradeData = {
      ...formData,
      entry,
      exit,
      stopLoss: sl,
      takeProfit: tp,
      lotSize: lots,
      profit,
      rr,
      outcome,
    };

    if (editingId) {
      // EDIT EXISTING TRADE
      setTrades((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...tradeData, id: editingId, createdAt: t.createdAt }
            : t
        )
      );
      setEditingId(null); // Turn off edit mode
    } else {
      // CREATE NEW TRADE
      const newTrade = {
        id: Date.now(),
        ...tradeData,
        createdAt: new Date().toISOString(),
      };
      setTrades((prev) => [newTrade, ...prev]);
    }

    // Reset Form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      session: "London",
      pair: "XAUUSD",
      type: "Short",
      strategy: "SMC",
      lotSize: 1.0,
      entry: "",
      stopLoss: "",
      takeProfit: "",
      exit: "",
      notes: "",
    });
  };

  const handleDelete = (id) => {
    if (confirm("Delete this trade record?")) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
      // If we delete the trade we are currently editing, cancel edit mode
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  const handleAnalyzeTrade = async (trade) => {
    setAiModal({
      isOpen: true,
      title: "Trade Analysis",
      content: "",
      isLoading: true,
    });
    const prompt = `Act as a strict prop firm coach. Analyze this ${
      trade.pair
    } trade taken in the ${trade.session} session. Result: ${
      trade.outcome
    } (${formatCurrency(trade.profit)}). Strategy: ${trade.strategy}. Notes: "${
      trade.notes
    }". Critique execution and risk management.`;
    const response = await callGeminiAPI(prompt);
    setAiModal({
      isOpen: true,
      title: "Trade Analysis",
      content: response,
      isLoading: false,
    });
  };

  const handleAnalyzeSession = async () => {
    setAiModal({
      isOpen: true,
      title: "Performance Coach",
      content: "",
      isLoading: true,
    });
    const prompt = `Analyze my last 10 trades. Win Rate: ${stats.winRate}%. Profit Factor: ${stats.profitFactor}. Best session: ${stats.bestSession.name}. Identify patterns and give 3 actionable tips to pass my funded challenge.`;
    const response = await callGeminiAPI(prompt);
    setAiModal({
      isOpen: true,
      title: "Performance Coach",
      content: response,
      isLoading: false,
    });
  };

  // --- STATISTICS LOGIC (Memoized) ---
  const stats = useMemo(() => {
    let filteredTrades = trades.filter((t) => {
      if (filterPair !== "All" && t.pair !== filterPair) return false;
      if (filterType !== "All" && t.type !== filterType) return false;
      return true;
    });

    const sortedTrades = [...filteredTrades].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let currentBal = startingBalance;
    let wins = 0,
      losses = 0,
      breakeven = 0;
    let maxWin = 0,
      maxLoss = 0;
    let grossProfit = 0,
      grossLoss = 0;

    let peak = startingBalance;
    let maxDrawdown = 0;

    const dailyPnL = {};
    const heatmapData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      heatmapData.push({ date: ds, profit: 0 });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    let todaysPnL = 0;

    const strategyStats = {};
    const sessionStats = {};
    const monthlyGroups = {};

    const chartData = sortedTrades.map((t) => {
      currentBal += t.profit;

      if (currentBal > peak) peak = currentBal;
      const dd = currentBal - peak;
      if (dd < maxDrawdown) maxDrawdown = dd;

      if (t.profit > 0) {
        wins++;
        grossProfit += t.profit;
        if (t.profit > maxWin) maxWin = t.profit;
      } else if (t.profit < 0) {
        losses++;
        grossLoss += Math.abs(t.profit);
        if (t.profit < maxLoss) maxLoss = t.profit;
      } else breakeven++;

      if (dailyPnL[t.date] === undefined) dailyPnL[t.date] = 0;
      dailyPnL[t.date] += t.profit;
      if (t.date === todayStr) todaysPnL += t.profit;

      const strat = t.strategy || "Unknown";
      if (!strategyStats[strat])
        strategyStats[strat] = { profit: 0, wins: 0, total: 0 };
      strategyStats[strat].profit += t.profit;
      strategyStats[strat].total += 1;
      if (t.profit > 0) strategyStats[strat].wins += 1;

      const sess = t.session || "Unknown";
      if (!sessionStats[sess]) sessionStats[sess] = { profit: 0 };
      sessionStats[sess].profit += t.profit;

      const monthKey = t.date.substring(0, 7);
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          profit: 0,
          trades: 0,
          wins: 0,
          dailyPnL: {},
          bestDay: { profit: -Infinity, date: "-" },
          worstDay: { profit: Infinity, date: "-" },
        };
      }
      monthlyGroups[monthKey].profit += t.profit;
      monthlyGroups[monthKey].trades += 1;
      if (t.profit > 0) monthlyGroups[monthKey].wins += 1;
      if (!monthlyGroups[monthKey].dailyPnL[t.date])
        monthlyGroups[monthKey].dailyPnL[t.date] = 0;
      monthlyGroups[monthKey].dailyPnL[t.date] += t.profit;

      return { date: t.date, balance: currentBal, profit: t.profit };
    });

    let currentDrawdown = 0;
    if (currentBal < startingBalance) {
      currentDrawdown = currentBal - startingBalance;
    } else {
      currentDrawdown = 0;
    }

    const filledHeatmap = heatmapData.map((d) => ({
      date: d.date,
      profit: dailyPnL[d.date] || 0,
    }));

    const monthlyData = Object.values(monthlyGroups)
      .map((m) => {
        Object.entries(m.dailyPnL).forEach(([date, profit]) => {
          if (profit > m.bestDay.profit) m.bestDay = { profit, date };
          if (profit < m.worstDay.profit) m.worstDay = { profit, date };
        });
        const dateObj = new Date(m.monthKey + "-01");
        return {
          ...m,
          monthName: dateObj.toLocaleString("default", { month: "long" }),
          year: dateObj.getFullYear(),
          winRate: ((m.wins / m.trades) * 100).toFixed(0),
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    const totalCount = filteredTrades.length;
    const winRate = totalCount > 0 ? ((wins / totalCount) * 100).toFixed(1) : 0;
    const netProfit = currentBal - startingBalance;
    const profitFactor =
      grossLoss === 0
        ? grossProfit > 0
          ? "∞"
          : "0.00"
        : (grossProfit / grossLoss).toFixed(2);

    let accountStatus = "ACTIVE";
    if (todaysPnL <= dailyLossLimit || maxDrawdown <= maxLossLimit)
      accountStatus = "BREACHED";
    else if (netProfit >= profitTarget) accountStatus = "PASSED";

    const strategyChartData = Object.keys(strategyStats)
      .map((k) => ({
        name: k,
        profit: strategyStats[k].profit,
        winRate: (
          (strategyStats[k].wins / strategyStats[k].total) *
          100
        ).toFixed(0),
      }))
      .sort((a, b) => b.profit - a.profit);

    const sessionChartData = Object.keys(sessionStats)
      .map((k) => ({
        name: k,
        profit: sessionStats[k].profit,
      }))
      .sort((a, b) => b.profit - a.profit);

    return {
      currentBal,
      wins,
      losses,
      breakeven,
      winRate,
      netProfit,
      profitFactor,
      equityCurve: [{ date: "Start", balance: startingBalance }, ...chartData],
      heatmapData: filledHeatmap,
      strategyChartData,
      sessionChartData,
      monthlyData,
      pieData: [
        { name: "Wins", value: wins, color: "#34d399" },
        { name: "Losses", value: losses, color: "#f43f5e" },
        { name: "BE", value: breakeven, color: "#94a3b8" },
      ].filter((d) => d.value > 0),
      maxWin,
      maxLoss,
      todaysPnL,
      maxDrawdown,
      currentDrawdown,
      accountStatus,
      bestSession: sessionChartData[0] || { name: "N/A", profit: 0 },
    };
  }, [
    trades,
    startingBalance,
    filterPair,
    filterType,
    dailyLossLimit,
    maxLossLimit,
    profitTarget,
  ]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none z-0"></div>

      {showCalculator && (
        <RiskCalculatorModal
          onClose={() => setShowCalculator(false)}
          currentBalance={stats.currentBal}
        />
      )}
      {showSync && (
        <DataSyncModal
          onClose={() => setShowSync(false)}
          trades={trades}
          setTrades={setTrades}
          balance={startingBalance}
          setBalance={setStartingBalance}
        />
      )}
      <AIAnalysisModal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal((p) => ({ ...p, isOpen: false }))}
        title={aiModal.title}
        content={aiModal.content}
        isLoading={aiModal.isLoading}
      />

      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-white/10">
              <Activity className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white tracking-wide font-sans flex items-center gap-2">
                BACK<span className="text-emerald-400">TEST</span> TERMINAL
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-emerald-400/80 font-bold tracking-[0.2em] uppercase">
                  System Online
                </p>
              </div>
            </div>
            <div className="ml-6 hidden md:block">
              <MarketSessionWidget />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-black/20 border border-white/5 rounded-xl px-4 py-2 shadow-inner w-48">
              <span className="text-[10px] text-slate-400 mr-2 font-bold tracking-wider uppercase whitespace-nowrap">
                Init Balance
              </span>
              <span className="text-sm font-mono text-emerald-400 mr-1">$</span>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
                className="bg-transparent w-full text-sm font-bold text-white outline-none placeholder-slate-600 font-mono focus:text-emerald-300 transition-colors"
              />
            </div>

            <button
              onClick={() => setShowSync(true)}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border border-white/10 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <UploadCloud size={16} /> Data Sync
            </button>

            <nav className="flex bg-black/20 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${
                  activeTab === "dashboard"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("journal")}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${
                  activeTab === "journal"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                Journal
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* === DASHBOARD TAB === */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Filter & Status Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 p-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider px-3">
                  <Filter size={14} className="text-emerald-400" /> Filters
                </div>
                <select
                  value={filterPair}
                  onChange={(e) => setFilterPair(e.target.value)}
                  className="bg-black/20 text-slate-200 text-xs font-bold uppercase tracking-wider p-2.5 rounded-lg border border-white/5 outline-none focus:border-emerald-500/50 transition-colors hover:bg-black/30 cursor-pointer"
                >
                  <option value="All">All Pairs</option>
                  <option value="XAUUSD">XAUUSD</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                  <option value="USDJPY">USDJPY</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-black/20 text-slate-200 text-xs font-bold uppercase tracking-wider p-2.5 rounded-lg border border-white/5 outline-none focus:border-emerald-500/50 transition-colors hover:bg-black/30 cursor-pointer"
                >
                  <option value="All">All Sides</option>
                  <option value="Long">Longs</option>
                  <option value="Short">Shorts</option>
                </select>
              </div>

              <div className="flex items-center gap-4 p-2">
                <button
                  onClick={handleAnalyzeSession}
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[10px] uppercase tracking-widest hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 border border-white/10 hover:-translate-y-0.5"
                >
                  <BrainCircuit size={14} /> AI Coach
                </button>

                <div className="flex items-center gap-3 px-6 border-l border-white/10">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    Status
                  </span>
                  <span
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border shadow-inner ${
                      stats.accountStatus === "ACTIVE"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : stats.accountStatus === "PASSED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                    }`}
                  >
                    {stats.accountStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <StatCard
                title="BALANCE"
                value={formatCurrency(stats.currentBal)}
                subValue={`${stats.netProfit >= 0 ? "+" : ""}${formatCurrency(
                  stats.netProfit
                )}`}
                icon={DollarSign}
                bgClass="bg-emerald-500/10"
                colorClass={
                  stats.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              />
              <StatCard
                title="PROFIT FACTOR"
                value={stats.profitFactor}
                subValue="Gross P / Gross L"
                icon={Zap}
                bgClass="bg-amber-500/10"
                colorClass="text-amber-400"
              />
              <StatCard
                title="WIN RATE"
                value={`${stats.winRate}%`}
                subValue={`${stats.wins}W - ${stats.losses}L`}
                icon={Activity}
                bgClass="bg-blue-500/10"
                colorClass="text-blue-400"
              />
              <StatCard
                title="TODAY'S P/L"
                value={formatCurrency(stats.todaysPnL)}
                subValue={`Limit: ${formatCurrency(dailyLossLimit)}`}
                icon={Calendar}
                bgClass={
                  stats.todaysPnL >= 0
                    ? "bg-emerald-500/10"
                    : "bg-orange-500/10"
                }
                colorClass={
                  stats.todaysPnL >= 0 ? "text-emerald-400" : "text-orange-400"
                }
              />
              <StatCard
                title="MAX DRAWDOWN"
                value={formatCurrency(stats.maxDrawdown)}
                subValue={`Limit: ${formatCurrency(maxLossLimit)}`}
                icon={TrendingDown}
                bgClass="bg-rose-500/10"
                colorClass="text-rose-400"
              />
            </div>

            {/* Monthly Reports Section */}
            <div>
              <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
                <Calendar size={14} className="text-emerald-500" /> Monthly
                Performance Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.monthlyData.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-slate-500 text-sm italic">
                      No monthly data available yet.
                    </p>
                  </div>
                ) : (
                  stats.monthlyData.map((m, i) => (
                    <MonthlyCard key={i} monthData={m} />
                  ))
                )}
              </div>
            </div>

            {/* Objectives & Heatmap Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Objectives */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 px-2">
                  <Shield size={14} className="text-emerald-500" /> Risk
                  Objectives
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <PropObjectiveCard
                    title="Profit Target"
                    current={stats.netProfit}
                    target={profitTarget}
                  />
                  <PropObjectiveCard
                    title="Daily Loss"
                    current={stats.todaysPnL}
                    target={dailyLossLimit}
                    isLossLimit={true}
                  />
                  <PropObjectiveCard
                    title="Max Trailing DD"
                    current={stats.maxDrawdown}
                    target={maxLossLimit}
                    isLossLimit={true}
                  />
                  <PropObjectiveCard
                    title="Current Drawdown"
                    current={stats.currentDrawdown}
                    target={maxLossLimit}
                    isLossLimit={true}
                  />
                </div>

                {/* Strategy & Session Performance Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Strategy Chart */}
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Award size={14} className="text-amber-400" /> Top
                      Strategies
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.strategyChartData}
                          layout="vertical"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={true}
                            vertical={false}
                            stroke="#334155"
                            opacity={0.5}
                          />
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                            tick={{
                              fill: "#94a3b8",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid #334155",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Bar
                            dataKey="profit"
                            radius={[0, 6, 6, 0]}
                            barSize={24}
                          >
                            {stats.strategyChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.profit >= 0 ? "#34d399" : "#fb7185"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Session Chart */}
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Globe size={14} className="text-blue-400" /> Session
                      Performance
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.sessionChartData}
                          layout="vertical"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={true}
                            vertical={false}
                            stroke="#334155"
                            opacity={0.5}
                          />
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                            tick={{
                              fill: "#94a3b8",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid #334155",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Bar
                            dataKey="profit"
                            radius={[0, 6, 6, 0]}
                            barSize={24}
                          >
                            {stats.sessionChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.profit >= 0 ? "#3b82f6" : "#f43f5e"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Heatmap & Pie */}
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col items-center justify-center relative group hover:border-white/10 transition-all">
                  <h3 className="absolute top-6 left-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    Win Ratio
                  </h3>
                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
                      <span className="text-4xl font-black text-white font-sans tracking-tight drop-shadow-lg">
                        {stats.winRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg hover:border-white/10 transition-all">
                  <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" /> 30-Day
                    Heatmap
                  </h3>
                  <div className="grid grid-cols-7 gap-2.5">
                    {stats.heatmapData.map((day, i) => (
                      <HeatmapCell
                        key={i}
                        date={day.date}
                        profit={day.profit}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Equity Curve */}
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" /> Equity
                Curve
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.equityCurve}>
                    <defs>
                      <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#334155"
                      opacity={0.4}
                    />
                    <XAxis dataKey="date" hide={true} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => `$${val}`}
                      stroke="#475569"
                      fontSize={10}
                      tick={{ fill: "#94a3b8", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorBal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* === JOURNAL TAB === */}
        {activeTab === "journal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 sticky top-24 shadow-2xl hover:border-white/10 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Plus size={16} className="text-emerald-400" />{" "}
                    {editingId ? "Edit Trade" : "New Trade"}
                  </h3>
                  <button
                    onClick={() => setShowCalculator(true)}
                    className="p-2 bg-white/5 rounded-lg hover:bg-emerald-600 transition-colors text-slate-400 hover:text-white border border-white/5"
                    title="Risk Calculator"
                  >
                    <Calculator size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg text-white focus:border-emerald-500/50 outline-none transition-all text-xs font-bold uppercase shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Session
                      </label>
                      <select
                        name="session"
                        value={formData.session}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-white text-xs font-bold uppercase shadow-inner focus:border-emerald-500/50 transition-all cursor-pointer"
                      >
                        <option>London</option>
                        <option>New York</option>
                        <option>Tokyo</option>
                        <option>Sydney</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Pair
                      </label>
                      <select
                        name="pair"
                        value={formData.pair}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-white text-xs font-bold uppercase shadow-inner focus:border-emerald-500/50 transition-all cursor-pointer"
                      >
                        <option>XAUUSD</option>
                        <option>EURUSD</option>
                        <option>GBPUSD</option>
                        <option>USDJPY</option>
                        <option>BTCUSD</option>
                        <option>US30</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Strategy
                      </label>
                      <select
                        name="strategy"
                        value={formData.strategy}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-white text-xs font-bold uppercase shadow-inner focus:border-emerald-500/50 transition-all cursor-pointer"
                      >
                        <option>SMC</option>
                        <option>Breakout</option>
                        <option>Reversal</option>
                        <option>Trend Following</option>
                        <option>News</option>
                        <option>Scalping</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Side
                      </label>
                      <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, type: "Long" }))
                          }
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${
                            formData.type === "Long"
                              ? "bg-emerald-600 text-white shadow-lg"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          LONG
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, type: "Short" }))
                          }
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${
                            formData.type === "Short"
                              ? "bg-rose-600 text-white shadow-lg"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          SHORT
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Lots
                      </label>
                      <input
                        type="number"
                        name="lotSize"
                        step="0.01"
                        required
                        value={formData.lotSize}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-white text-xs font-mono font-bold focus:border-emerald-500/50 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Entry
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="entry"
                        placeholder="0.00"
                        required
                        value={formData.entry}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-white font-mono text-xs focus:border-blue-500/50 transition-colors shadow-inner"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                          Stop Loss
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="stopLoss"
                          required
                          value={formData.stopLoss}
                          onChange={handleInputChange}
                          className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none font-mono text-xs text-rose-400 focus:border-rose-500/50 transition-colors shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                          Take Profit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="takeProfit"
                          required
                          value={formData.takeProfit}
                          onChange={handleInputChange}
                          className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none font-mono text-xs text-emerald-400 focus:border-emerald-500/50 transition-colors shadow-inner"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                        Exit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="exit"
                        placeholder="0.00"
                        required
                        value={formData.exit}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-white font-mono text-xs focus:border-blue-500/50 transition-colors shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows="2"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-black/20 border border-white/5 rounded-lg outline-none text-slate-300 text-xs resize-none focus:border-emerald-500/50 transition-colors shadow-inner"
                      placeholder="Setup confirmation..."
                    ></textarea>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider text-[10px]"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`flex-1 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-[10px] hover:-translate-y-0.5 ${
                        editingId
                          ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 text-white"
                          : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 text-white"
                      }`}
                    >
                      {editingId ? (
                        <>
                          <Pencil size={14} /> Update Trade
                        </>
                      ) : (
                        <>
                          <Save size={14} /> Log Execution
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Trade List */}
            <div className="lg:col-span-3">
              <div className="w-full overflow-x-auto bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl min-h-[600px]">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20 sticky left-0 z-10">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Activity size={16} className="text-emerald-400" />{" "}
                    Execution Log
                  </h3>
                  <button
                    onClick={() => exportToCSV(trades)}
                    className="text-[10px] font-bold flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-slate-300 transition-colors uppercase tracking-wider"
                  >
                    <Download size={12} /> CSV Export
                  </button>
                </div>
                <div className="min-w-[900px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] text-slate-400 uppercase bg-black/20 border-b border-white/5 font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Session</th>
                        <th className="px-6 py-4">Pair</th>
                        <th className="px-6 py-4">Strategy</th>
                        <th className="px-6 py-4">Side</th>
                        <th className="px-6 py-4 text-right">Lots</th>
                        <th className="px-6 py-4 text-right">R:R</th>
                        <th className="px-6 py-4 text-right">Net P/L</th>
                        <th className="px-6 py-4 text-center">Notes</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {trades.length === 0 ? (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center py-24 text-slate-500 italic"
                          >
                            No executions found in terminal.
                          </td>
                        </tr>
                      ) : (
                        trades.map((trade) => (
                          <tr
                            key={trade.id}
                            className="hover:bg-white/5 transition-colors group"
                          >
                            <td className="px-6 py-4 font-medium text-slate-300 font-mono">
                              {trade.date}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              <span className="px-2 py-1 bg-white/5 rounded border border-white/5 font-bold uppercase tracking-wide text-[9px]">
                                {trade.session || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white font-bold tracking-wide">
                              {trade.pair}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              <span className="px-2 py-1 bg-white/5 rounded border border-white/5">
                                {trade.strategy || "General"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wide border shadow-sm ${
                                  trade.type === "Long"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                }`}
                              >
                                {trade.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-slate-300">
                              {trade.lotSize}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                              {trade.rr}
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-bold font-mono ${
                                trade.profit >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {trade.profit >= 0 ? "+" : ""}
                              {formatCurrency(trade.profit)}
                            </td>
                            <td className="px-6 py-4 text-center relative">
                              {trade.notes && (
                                <div className="group/note relative flex justify-center">
                                  <FileText
                                    size={16}
                                    className="text-slate-400 cursor-help hover:text-emerald-400 transition-colors"
                                  />
                                  <div className="absolute bottom-full mb-2 hidden group-hover/note:block w-48 p-3 bg-slate-900 text-xs text-slate-200 rounded-xl shadow-2xl border border-slate-700 z-50 whitespace-normal text-left">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                                    <p className="font-medium">{trade.notes}</p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleAnalyzeTrade(trade)}
                                  className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                                  title="AI Trade Doctor"
                                >
                                  <Sparkles size={12} />
                                </button>

                                {/* --- EDIT BUTTON --- */}
                                <button
                                  onClick={() => handleEdit(trade)}
                                  className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/20"
                                  title="Edit Trade"
                                >
                                  <Pencil size={12} />
                                </button>

                                {/* --- DELETE BUTTON --- */}
                                <button
                                  onClick={() => handleDelete(trade.id)}
                                  className="p-1.5 bg-white/5 text-slate-400 rounded hover:bg-rose-500 hover:text-white transition-colors border border-white/10"
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

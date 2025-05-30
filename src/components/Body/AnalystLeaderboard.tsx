"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  FaTrophy,
  FaCrown,
  FaCheck,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
} from "react-icons/fa";
import { useRouter } from "@bprogress/next/app";
import {
  HeartPulse,
  TrendingUp,
  BarChart2,
  Loader2,
  AlertCircle,
  SearchX,
  ChevronUp,
  Shield,
  Users,
  Info,
  X,
  Search,
} from "lucide-react";
import { LuWandSparkles } from "react-icons/lu";
import { useSession } from "next-auth/react";
import { RiPulseLine } from "react-icons/ri";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useUserData } from "@/context/UserDataContext";
import MobileAnalystCard from "./MobileAnalystCard";

type Mode = "impact" | "heartbeat";
type SortField =
  | "impactFactor"
  | "heartbeat"
  | "mindshare"
  | "followers"
  | "username"
  | "herdedVsHidden"
  | "convictionVsHype"
  | "memeVsInstitutional";
type SortDirection = "asc" | "desc";

interface Agent {
  twitterHandle: string;
  name: string;
  profileUrl?: string;
  verified?: boolean;
  impactFactor?: number;
  heartbeat?: number;
  mindshare?: number;
  followers?: number;
  herdedVsHidden?: number;
  convictionVsHype?: number;
  memeVsInstitutional?: number;
  subscribers?: number;
  signals?: number;
  tokens?: number;
  subscriptionPrice?: number;
}

interface AnalystLeaderboardProps {
  mode: Mode;
  subscribedHandles: string[];
  subscribingHandle: string | null;
  onSubscribe: (agent: Agent) => void;
  setRefreshData: (refresh: () => void) => void;
  searchText: string;
}

const AnalystLeaderboard: React.FC<AnalystLeaderboardProps> = ({
  mode,
  subscribedHandles,
  subscribingHandle,
  onSubscribe,
  setRefreshData,
  searchText,
}) => {
  const container = useRef(null);
  gsap.registerPlugin(useGSAP);
  const [showStats, setShowStats] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [userSortField, setUserSortField] = useState<SortField | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // This function will be used in the search input
  const [localSearchText, setLocalSearchText] = useState(searchText);

  // In App Router, we need a different approach to update the URL
  const handleSearchChange = (value: string) => {
    setLocalSearchText(value);
    // We would typically update URL params here, but for now we'll just use local state
    // The parent component should be responsible for updating the URL if needed
  };

  // Keep localSearchText in sync with props.searchText
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  const { agents, loadingUmd, error, refreshData } = useUserData();

  const effectiveSortField =
    userSortField || (mode === "impact" ? "impactFactor" : "heartbeat");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, effectiveSortField, sortDirection]);

  const toggleStats = (handle: string) => {
    setShowStats((prev) => ({ ...prev, [handle]: !prev[handle] }));
  };

  const sortAgents = (field: SortField) => {
    if (userSortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setUserSortField(field);
      setSortDirection("desc");
    }
  };

  const renderMetricIndicator = (
    value: number,
    leftColor: string,
    rightColor: string
  ) => {
    const normalizedValue = Math.max(-50, Math.min(50, value));
    const leftPercentage = ((normalizedValue + 50) / 100) * 100;
    const rightPercentage = 100 - leftPercentage;
    return (
      <div className="w-full flex flex-col gap-1">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="flex h-full w-full">
            <div
              className={`${leftColor} h-full transition-all duration-300`}
              style={{ width: `${leftPercentage}%` }}
            ></div>
            <div
              className={`${rightColor} h-full transition-all duration-300`}
              style={{ width: `${rightPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  useGSAP(
    () => {
      if (!loadingUmd && agents.length > 0) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          ".top-card",
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.15 }
        );
        tl.fromTo(
          ".list-item",
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.03 },
          "-=0.7"
        );
      }
    },
    { scope: container, dependencies: [loadingUmd, agents] }
  );

  const getSortedAndFilteredAgents = () => {
    const filtered = localSearchText
      ? agents.filter(
          (agent) =>
            agent.name.toLowerCase().includes(localSearchText.toLowerCase()) ||
            agent.twitterHandle
              .toLowerCase()
              .includes(localSearchText.toLowerCase())
        )
      : agents;

    return [...filtered].sort((a, b) => {
      let valueA, valueB;
      switch (effectiveSortField) {
        case "impactFactor":
          valueA = a.impactFactor || 0;
          valueB = b.impactFactor || 0;
          break;
        case "heartbeat":
          valueA = a.heartbeat || 0;
          valueB = b.heartbeat || 0;
          break;
        case "mindshare":
          valueA = a.mindshare || 0;
          valueB = b.mindshare || 0;
          break;
        case "followers":
          valueA = a.followers || 0;
          valueB = b.followers || 0;
          break;
        case "username":
          valueA = a.twitterHandle.toLowerCase();
          valueB = b.twitterHandle.toLowerCase();
          return sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "herdedVsHidden":
          valueA = a.herdedVsHidden || 0;
          valueB = b.herdedVsHidden || 0;
          break;
        case "convictionVsHype":
          valueA = a.convictionVsHype || 0;
          valueB = b.convictionVsHype || 0;
          break;
        case "memeVsInstitutional":
          valueA = a.memeVsInstitutional || 0;
          valueB = b.memeVsInstitutional || 0;
          break;
        default:
          valueA = a[mode === "impact" ? "impactFactor" : "heartbeat"] || 0;
          valueB = b[mode === "impact" ? "impactFactor" : "heartbeat"] || 0;
      }
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });
  };

  const renderCurrentUserCard = (agent) => {
    const rank =
      sortedAgents.findIndex((a) => a.twitterHandle === agent.twitterHandle) +
      1;
    const cleanHandle = agent.twitterHandle.replace("@", "");
    const isSubscribed = subscribedHandles.includes(cleanHandle);
    const isCurrentlySubscribing = subscribingHandle === cleanHandle;
    const creditCost = renderCreditCost(agent.impactFactor || 0);
    const isCurrentUser =
      session?.user?.username &&
      cleanHandle.toLowerCase() ===
        session.user.username.replace("@", "").toLowerCase();

    return (
      <div
        key={agent.twitterHandle}
        className={`impact-card list-item relative ${
          isCurrentUser
            ? "bg-gradient-to-br from-gray-900 via-blue-950/80 to-gray-900 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]"
            : "bg-gray-900/50 border-gray-800/50 hover:bg-cyan-950"
        } backdrop-blur-sm border rounded-lg overflow-hidden transition-all duration-200 hover:cursor-pointer`}
        onClick={() => router.push(`/influencer/${cleanHandle}`)}
      >
        {/* Animated Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),transparent_70%)] z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.1),transparent_70%)] z-0"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

        {/* Glowing border effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/0 via-blue-400/20 to-cyan-500/0 blur-md"></div>

        {/* Desktop Layout (md and above) */}
        <div className="hidden lg:flex px-6 py-3 items-center gap-6 relative z-10">
          <div className="flex items-center flex-shrink-0 w-[240px] group-hover:translate-x-1 transition-transform duration-300">
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xs font-semibold mr-4 flex-shrink-0 shadow-md">
              {rank}
            </div>
            {agent.twitterHandle && (
              <div className="relative w-10 h-10 mr-3 flex-shrink-0 transition-all duration-300 group-hover:scale-105">
                <img
                  src={
                    agent.profileUrl?.trim().length > 0
                      ? agent.profileUrl
                      : `https://picsum.photos/seed/${encodeURIComponent(
                          agent.twitterHandle
                        )}/64/64`
                  }
                  alt={agent.name}
                  className="w-full h-full object-cover rounded-full border-2 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                />
                {agent.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-1 border border-gray-900 shadow-lg">
                    <FaCheck className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
            )}
            <div className="flex-grow overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate tracking-wide">
                {agent.name}{" "}
                {isCurrentUser && (
                  <span className="text-blue-300 font-medium">(You)</span>
                )}
              </h4>
              <p className="text-xs text-blue-300/80 truncate">
                {agent.twitterHandle}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 flex-grow min-w-0 px-2 group-hover:opacity-90 transition-opacity">
            <div className="w-1/3 text-center">
              {renderMetricIndicator(
                agent.herdedVsHidden || 0,
                "bg-gradient-to-r from-red-400 to-red-500",
                "bg-gradient-to-r from-cyan-400 to-cyan-500"
              )}
            </div>
            <div className="w-1/3 text-center">
              {renderMetricIndicator(
                agent.convictionVsHype || 0,
                "bg-gradient-to-r from-green-400 to-green-500",
                "bg-gradient-to-r from-rose-400 to-rose-500"
              )}
            </div>
            <div className="w-1/3 text-center">
              {renderMetricIndicator(
                agent.memeVsInstitutional || 0,
                "bg-gradient-to-r from-yellow-300 to-amber-400",
                "bg-gradient-to-r from-gray-100 to-gray-200"
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-4 flex-shrink-0 w-[385px]">
            <div className="w-16 text-right">
              {agent.mindshare > 0 ? (
                <p className="text-blue-300 text-sm font-medium group-hover:text-blue-200 transition-colors">
                  {agent.mindshare != null
                    ? `${agent.mindshare.toFixed(2)}%`
                    : "--"}
                </p>
              ) : (
                <span className="text-sm text-blue-400">--</span>
              )}
            </div>
            <div className="w-20 text-right">
              {agent.followers > 0 ? (
                <p className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  {agent.followers != null
                    ? formatFollowersCount(agent.followers)
                    : "--"}
                </p>
              ) : (
                <span className="text-sm text-gray-100">--</span>
              )}
            </div>
            <div className="w-14 text-right">
              <p className="text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                {agent[primaryField] ?? "--"}
              </p>
            </div>
            <div className="w-16 text-right">
              <p className="text-amber-300 text-sm font-medium group-hover:text-amber-200 transition-colors">
                {creditCost}
              </p>
            </div>
            <div className="w-8 flex justify-center">
              <Link
                href={`https://x.com/${cleanHandle}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-300 hover:bg-blue-900/50 transition-colors duration-200"
                title="View Profile"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
              </Link>
            </div>
            <div className="w-24 flex justify-center">
              <button
                className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-xs w-full transition-all duration-300 whitespace-nowrap shadow-md ${
                  isSubscribed || isCurrentlySubscribing
                    ? "bg-gradient-to-r from-green-600/50 to-green-500/50 text-green-200 border border-green-500/30"
                    : "bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white border border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                } ${isCurrentlySubscribing ? "animate-pulse" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSubscribed && !isCurrentlySubscribing) {
                    onSubscribe(agent);
                  }
                }}
                disabled={isSubscribed || isCurrentlySubscribing}
              >
                {isCurrentlySubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  <>
                    <FaCrown
                      size={13}
                      className="mr-1.5 flex-shrink-0 text-yellow-300"
                    />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <FaCrown
                      size={13}
                      className="mr-1.5 flex-shrink-0 text-yellow-300"
                    />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Layout (below md) */}
        <div className="lg:hidden">
          <MobileAnalystCard
            agent={
              isCurrentUser ? { ...agent, name: `${agent.name} (You)` } : agent
            }
            rank={rank}
            subscribedHandles={subscribedHandles}
            subscribingHandle={subscribingHandle}
            onSubscribe={onSubscribe}
            primaryField={primaryField}
            primaryLabel={primaryLabel}
            formatFollowersCount={formatFollowersCount}
            renderMetricIndicator={renderMetricIndicator}
            isCurrentUser={isCurrentUser || false}
          />
        </div>
      </div>
    );
  };

  const loading = loadingUmd;

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800/30 shadow-lg p-6 min-h-[30vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mb-4 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
            <Loader2 className="w-12 h-12 text-blue-500/70 animate-spin absolute inset-0" />
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-1">
            Loading Data
          </h3>
          <p className="text-gray-400 text-xs">
            {mode === "impact"
              ? "Analyzing crypto market influence..."
              : "Analyzing market heartbeat..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <h3 className="text-lg font-medium text-red-200 mb-2">
          Failed to load rankings
        </h3>
        <p className="text-red-300/80 text-xs max-w-md">{error}</p>
      </div>
    );
  }

  const sortedAgents = getSortedAndFilteredAgents();

  // Check if the current user is in the agents list
  const currentUserHandle = session?.user?.username?.toLowerCase();
  const currentUserAgentIndex = currentUserHandle
    ? sortedAgents.findIndex(
        (agent) =>
          agent.twitterHandle.toLowerCase().replace("@", "") ===
          currentUserHandle.replace("@", "")
      )
    : -1;

  const currentUserAgent =
    currentUserAgentIndex >= 0 ? sortedAgents[currentUserAgentIndex] : null;
  const currentUserRank =
    currentUserAgentIndex >= 0 ? currentUserAgentIndex + 1 : null;

  const topAgents = sortedAgents.slice(0, 3);
  const remainingAgents = sortedAgents.slice(3);
  const totalPages = Math.ceil(remainingAgents.length / PAGE_SIZE);
  const paginatedAgents = remainingAgents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const medalColors = [
    "from-yellow-300 to-amber-500",
    "from-gray-300 to-gray-400",
    "from-amber-700 to-amber-900",
  ];

  const primaryField = mode === "impact" ? "impactFactor" : "heartbeat";
  const title =
    mode === "impact" ? "Impact Factor Rankings" : "Market Heartbeat Dashboard";
  const description =
    mode === "impact"
      ? "Discover crypto analysts ranked by their market influence and prediction accuracy"
      : "Discover analysts ranked by their real-time market pulse";
  const primaryLabel = mode === "impact" ? "Impact" : "Beat";
  const primaryIcon = mode === "impact" ? LuWandSparkles : HeartPulse;
  const progressBarClass =
    mode === "impact"
      ? "from-blue-500 to-indigo-500"
      : "from-blue-500 to-cyan-500";

  function formatFollowersCount(num?: number): string {
    if (num === undefined || num === null) return "--";
    if (num < 1000) return num.toString();
    if (num < 1_000_000)
      return (num / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
    return (num / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  }

  const renderCreditCost = (impactFactor: number) => {
    const cost = impactFactor * 10;
    return cost.toFixed(0);
  };

  return (
    <div ref={container}>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {React.createElement(primaryIcon, {
              size: 18,
              className: "text-blue-400",
            })}
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <p className="text-sm text-slate-400">{description}</p>
        </div>

        <div className="w-full sm:w-auto min-w-[280px]">
          <div className="relative font-leagueSpartan">
            <div className="flex items-center bg-gray-800 rounded-full border border-solid border-gray-200 focus-within:border-blue-500 overflow-hidden">
              <input
                type="text"
                placeholder="Search analysts..."
                value={localSearchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 text-white text-sm bg-transparent focus:outline-none border border-solid border-gray-100"
              />
              <div className="px-3 flex">
                {localSearchText ? (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="text-gray-400 w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-3 mb-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500/70 absolute animate-ping"></div>
            </div>
            <span className="text-xs sm:text-sm text-cyan-500">
              Data updated •{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-0 items-center">
            <div className="relative group">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 sm:px-3 sm:py-2 bg-gray-800 text-gray-200 text-[10px] sm:text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Tap to sort analysts
              </div>
            </div>
            <div
              onClick={() => sortAgents(primaryField)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md cursor-pointer flex items-center gap-1 ${
                effectiveSortField === primaryField
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              }`}
            >
              {React.createElement(primaryIcon, { size: 12 })}
              <span>{mode === "impact" ? "Impact" : "Heartbeat"}</span>
              {effectiveSortField === primaryField &&
                (sortDirection === "asc" ? (
                  <FaChevronUp className="ml-1 w-3 h-3" />
                ) : (
                  <FaChevronDown className="ml-1 w-3 h-3" />
                ))}
            </div>
            <div
              onClick={() => sortAgents("mindshare")}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md cursor-pointer flex items-center gap-1 ${
                userSortField === "mindshare"
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <BarChart2 size={12} />
              <span>Mindshare</span>
              {userSortField === "mindshare" &&
                (sortDirection === "asc" ? (
                  <FaChevronUp className="ml-1 w-3 h-3" />
                ) : (
                  <FaChevronDown className="ml-1 w-3 h-3" />
                ))}
            </div>
            <div
              onClick={() => sortAgents("followers")}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md cursor-pointer flex items-center gap-1 ${
                userSortField === "followers"
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <Users size={12} />
              <span>Followers</span>
              {userSortField === "followers" &&
                (sortDirection === "asc" ? (
                  <FaChevronUp className="ml-1 w-3 h-3" />
                ) : (
                  <FaChevronDown className="ml-1 w-3 h-3" />
                ))}
            </div>
            <div
              onClick={() => sortAgents("herdedVsHidden")}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md cursor-pointer flex items-center gap-1 ${
                userSortField === "herdedVsHidden"
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span>Herded-Hidden</span>
              {userSortField === "herdedVsHidden" &&
                (sortDirection === "asc" ? (
                  <FaChevronUp className="ml-1 w-3 h-3" />
                ) : (
                  <FaChevronDown className="ml-1 w-3 h-3" />
                ))}
            </div>
            <div
              onClick={() => sortAgents("convictionVsHype")}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md cursor-pointer flex items-center gap-1 ${
                userSortField === "convictionVsHype"
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span>Conviction-Hype</span>
              {userSortField === "convictionVsHype" &&
                (sortDirection === "asc" ? (
                  <FaChevronUp className="ml-1 w-3 h-3" />
                ) : (
                  <FaChevronDown className="ml-1 w-3 h-3" />
                ))}
            </div>
            <div
              onClick={() => sortAgents("memeVsInstitutional")}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md cursor-pointer flex items-center gap-1 ${
                userSortField === "memeVsInstitutional"
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span>Meme-Institutional</span>
              {userSortField === "memeVsInstitutional" &&
                (sortDirection === "asc" ? (
                  <FaChevronUp className="ml-1 w-3 h-3" />
                ) : (
                  <FaChevronDown className="ml-1 w-3 h-3" />
                ))}
            </div>
          </div>
        </div>
      </div>

      {topAgents.length === 0 && sortedAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center mt-4">
          <SearchX className="w-10 h-10 text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No analysts found
          </h3>
        </div>
      )}

      {/* Top 3 agents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {topAgents.map((agent, index) => {
          const rank = index + 1;
          const cleanHandle = agent.twitterHandle.replace("@", "");
          const isSubscribed = subscribedHandles.includes(cleanHandle);
          const isCurrentlySubscribing = subscribingHandle === cleanHandle;
          const creditCost = agent.subscriptionPrice;

          return (
            <div
              key={agent.twitterHandle}
              className={`impact-card top-card relative overflow-hidden rounded-lg border ${
                rank === 1
                  ? "border-yellow-500/30"
                  : rank === 2
                  ? "border-gray-400/30"
                  : "border-amber-700/30"
              } bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-blue-900/20 backdrop-blur-sm min-w-0`}
              onClick={() => router.push(`/influencer/${cleanHandle}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    medalColors[rank - 1]
                  } opacity-50 rotate-45`}
                ></div>
              </div>
              <div className="p-3 sm:p-4 lg:p-5">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full bg-gradient-to-br ${
                        medalColors[rank - 1]
                      } p-0.5`}
                    >
                      <div className="absolute inset-0.5 rounded-full bg-gray-900/80"></div>
                      <FaTrophy
                        className={`relative w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                          rank === 1
                            ? "text-yellow-300"
                            : rank === 2
                            ? "text-gray-300"
                            : "text-amber-700"
                        }`}
                      />
                    </div>
                    <div>
                      <span className="block text-xs sm:text-sm lg:text-base text-blue-400 mb-0.5 font-medium">
                        Rank #{rank}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        {agent.twitterHandle && (
                          <div className="relative w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
                            <img
                              src={
                                agent.profileUrl?.trim().length > 0
                                  ? agent.profileUrl
                                  : `https://picsum.photos/seed/${encodeURIComponent(
                                      agent.twitterHandle
                                    )}/40/40`
                              }
                              alt={agent.name}
                              className="w-full h-full object-cover rounded-full border border-gray-700/50"
                            />
                            {agent.verified && (
                              <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border border-gray-900">
                                <FaCheck className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]">
                          {agent.name}
                        </h3>
                      </div>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-400 truncate">
                        {agent.twitterHandle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs lg:text-sm uppercase font-extrabold tracking-wider text-white mb-0.5 sm:mb-1">
                      {primaryLabel}
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                      {agent[primaryField] ?? "--"}
                    </div>
                  </div>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-gray-800 rounded-full mb-2 sm:mb-3 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${progressBarClass} rounded-full progress-bar-fill`}
                    style={{
                      width: `${Math.min(agent[primaryField] || 0, 100)}%`,
                    }}
                  ></div>
                </div>
                {agent.mindshare >= 0 && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 lg:mb-6 border border-gray-700/30 shadow-lg">
                    <div className="backdrop-blur-sm bg-white/5 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 lg:mb-4 border border-white/10 shadow-inner relative z-10">
                      <div className="flex justify-between">
                        <div className="text-center relative">
                          <div className="relative p-1 sm:p-2 lg:p-3 flex flex-col items-center">
                            <p className="text-gray-200 text-sm sm:text-base lg:text-xl font-bold tracking-tight transition-transform duration-300">
                              {agent.mindshare > 0
                                ? `${agent.mindshare.toFixed(2)}%`
                                : "--"}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                              <div className="relative flex items-center">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-500"></div>
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-500/70 absolute animate-ping"></div>
                              </div>
                              <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium mt-[3px]">
                                Mindshare
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-[1px] sm:w-[2px] h-8 sm:h-12 lg:h-16 bg-gradient-to-b from-transparent via-gray-200/50 to-transparent"></div>
                        </div>
                        <div className="text-center relative">
                          <div className="relative p-1 sm:p-2 lg:p-3 flex flex-col items-center">
                            <p className="text-gray-200 text-sm sm:text-base lg:text-xl font-bold tracking-tight transition-transform duration-300">
                              {agent.mindshare > 0
                                ? formatFollowersCount(agent.followers)
                                : "--"}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                              <div className="relative flex items-center">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500"></div>
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500/70 absolute animate-ping"></div>
                              </div>
                              <p className="text-xs text-purple-400 uppercase tracking-wider font-medium mt-[3px]">
                                Followers
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`https://x.com/${cleanHandle}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="group relative overflow-hidden flex items-center justify-center gap-1 sm:gap-2 w-full py-1.5 sm:py-2 lg:py-3 text-[10px] sm:text-xs lg:text-sm font-medium rounded-lg z-10 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-700 text-white transition-all duration-300 shadow-md"
                    >
                      <span className="relative z-10 flex items-center gap-1 sm:gap-2 group-hover:translate-x-1 transition-transform duration-300">
                        View Profile{" "}
                        <FaExternalLinkAlt className="text-[8px] sm:text-xs" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-400/20 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </Link>
                  </div>
                )}
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    showStats[agent.twitterHandle]
                      ? "max-h-[500px] opacity-100 mb-3 sm:mb-4"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-3">
                    <div className="flex flex-col items-center justify-center bg-blue-900/20 rounded-lg p-1 sm:p-2 border border-blue-700/20">
                      <Shield className="h-2 w-2 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-blue-400" />
                      <span className="text-[8px] sm:text-[10px] lg:text-xs text-blue-400 mb-0.5">
                        Subscribers
                      </span>
                      <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white">
                        {agent.subscribers}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-cyan-900/20 rounded-lg p-1 sm:p-2 border border-cyan-700/20">
                      <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-cyan-400 mb-0.5 sm:mb-1" />
                      <span className="text-[8px] sm:text-[10px] lg:text-xs text-cyan-400 mb-0.5">
                        Credits
                      </span>
                      <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white">
                        {agent.subscriptionPrice}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-blue-800/20 rounded-lg p-1 sm:p-2 border border-blue-700/20">
                      <BarChart2 className="h-2 w-2 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-blue-300 mb-0.5 sm:mb-1" />
                      <span className="text-[8px] sm:text-[10px] lg:text-xs text-blue-300 mb-0.5">
                        {primaryLabel}
                      </span>
                      <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white">
                        {agent[primaryField]}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-24 mb-4 hidden md:block">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full max-w-[120px] max-h-[120px] relative">
                        <div className="absolute inset-0 border-2 border-blue-800/30 rounded-full"></div>
                        <div className="absolute inset-[20%] border-2 border-blue-800/20 rounded-full"></div>
                        <div className="absolute inset-[40%] border-2 border-blue-800/10 rounded-full"></div>
                        <div className="absolute top-0 left-1/2 h-1/2 w-0.5 bg-blue-800/20 -translate-x-1/2"></div>
                        <div className="absolute top-1/2 left-0 h-0.5 w-1/2 bg-blue-800/20"></div>
                        <div className="absolute bottom-0 left-1/2 h-1/2 w-0.5 bg-blue-800/20 -translate-x-1/2"></div>
                        <div className="absolute top-1/2 right-0 h-0.5 w-1/2 bg-blue-800/20"></div>

                        {/* Calculate normalized positions for metrics to fit within the 0-100 range */}
                        {(() => {
                          // Define scaling functions for each metric
                          const normalizeSubscribers = (val) => {
                            // Scale subscribers (typically 0-1000) to be between 0-50%
                            const maxSubscribers = 1000;
                            return Math.min(50, (val / maxSubscribers) * 50);
                          };

                          const normalizePrice = (val) => {
                            // Scale price (typically 0-100) to be between 0-50%
                            const maxPrice = 100;
                            return Math.min(50, (val / maxPrice) * 50);
                          };

                          const normalizeImpact = (val) => {
                            // Scale impact/heartbeat (typically 0-100) to be between 0-50%
                            const maxImpact = 100;
                            return Math.min(50, (val / maxImpact) * 50);
                          };

                          const normalizeFollowers = (val) => {
                            // Scale followers (can be thousands or millions) to be between 0-50%
                            const maxFollowers = 1000000; // 1 million
                            return Math.min(50, (val / maxFollowers) * 50);
                          };

                          // Calculate positions for each metric point
                          const subscribersY = Math.max(45, 50 - normalizeSubscribers(agent.subscribers || 0));
                          const priceX = Math.max(5, Math.min(85, normalizePrice(agent.subscriptionPrice || 0)));
                          const impactY = Math.min(85, 50 + normalizeImpact(agent[primaryField] || 0));
                          const followersX = Math.min(85, 50 + normalizeFollowers(agent.followers || 0));

                          // Define points for the polygon
                          const points = `${50},${subscribersY} ${priceX},50 ${50},${impactY} ${followersX},50`;

                          return (
                            <>
                              {/* Data points */}
                              <div
                                className="absolute rounded-full w-2 h-2 bg-blue-400"
                                style={{
                                  top: `${subscribersY}%`,
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  boxShadow: "0 0 5px rgba(96, 165, 250, 0.7)",
                                }}
                              ></div>
                              <div
                                className="absolute rounded-full w-2 h-2 bg-cyan-400"
                                style={{
                                  top: "50%",
                                  left: `${priceX}%`,
                                  transform: "translate(-50%, -50%)",
                                  boxShadow: "0 0 5px rgba(34, 211, 238, 0.7)",
                                }}
                              ></div>
                              <div
                                className="absolute rounded-full w-2 h-2 bg-blue-300"
                                style={{
                                  top: `${impactY}%`,
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  boxShadow: mode === "impact" ? "0 0 5px rgba(147, 197, 253, 0.7)" : "0 0 5px rgba(239, 68, 68, 0.7)",
                                }}
                              ></div>
                              <div
                                className="absolute rounded-full w-2 h-2 bg-blue-500"
                                style={{
                                  top: "50%",
                                  left: `${followersX}%`,
                                  transform: "translate(-50%, -50%)",
                                  boxShadow: "0 0 5px rgba(59, 130, 246, 0.7)",
                                }}
                              ></div>

                              {/* SVG Polygon */}
                              <svg className="absolute inset-0 w-full h-full">
                                <polygon
                                  points={points}
                                  fill={mode === "impact" ? "rgba(59, 130, 246, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                                  stroke={mode === "impact" ? "rgba(59, 130, 246, 0.6)" : "rgba(239, 68, 68, 0.6)"}
                                  strokeWidth="1"
                                />
                              </svg>

                              {/* Labels */}
                              <div className="absolute text-[6px] text-blue-300 top-0 left-1/2 -translate-x-1/2">Subscribers</div>
                              <div className="absolute text-[6px] text-cyan-300 top-1/2 left-0 -translate-y-1/2">Credits</div>
                              <div className="absolute text-[6px] text-blue-300 bottom-0 left-1/2 -translate-x-1/2">{primaryLabel}</div>
                              <div className="absolute text-[6px] text-blue-300 top-1/2 right-0 -translate-y-1/2">Followers</div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 bg-gray-900/30 rounded-lg border border-gray-800/20 mb-2 sm:mb-3">
                    <div>
                      <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-red-400">
                            Herded
                          </span>
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">
                            vs
                          </span>
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-cyan-400">
                            Hidden
                          </span>
                        </div>
                      </div>
                      {renderMetricIndicator(
                        agent.herdedVsHidden || 0,
                        "bg-red-400",
                        "bg-cyan-400"
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-green-400">
                            Conviction
                          </span>
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">
                            vs
                          </span>
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-rose-400">
                            Hype
                          </span>
                        </div>
                      </div>
                      {renderMetricIndicator(
                        agent.convictionVsHype || 0,
                        "bg-green-500",
                        "bg-rose-500"
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-yellow-300">
                            Meme
                          </span>
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-gray-300">
                            vs
                          </span>
                          <span className="text-[8px] sm:text-[10px] lg:text-xs text-gray-100">
                            Institutional
                          </span>
                        </div>
                      </div>
                      {renderMetricIndicator(
                        agent.memeVsInstitutional || 0,
                        "bg-yellow-300",
                        "bg-gray-100"
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="w-full flex items-center justify-center gap-1 py-1 sm:py-1.5 mb-2 sm:mb-3 rounded-lg text-[10px] sm:text-xs lg:text-sm font-medium text-blue-300 hover:text-blue-200 bg-blue-900/30 hover:bg-blue-800/40 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStats(agent.twitterHandle);
                  }}
                >
                  {showStats[agent.twitterHandle] ? (
                    <>
                      <ChevronUp className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span>Hide Details</span>
                    </>
                  ) : (
                    <>
                      <RiPulseLine className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span>View Metrics</span>
                    </>
                  )}
                </button>
                <button
                  className={`w-full flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs lg:text-sm font-medium ${
                    isSubscribed || isCurrentlySubscribing
                      ? "bg-green-600/30 text-green-300"
                      : "bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-cyan-700 hover:to-blue-800 text-white"
                  } transition-all duration-200 ${
                    isCurrentlySubscribing ? "animate-pulse" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSubscribed && !isCurrentlySubscribing) {
                      onSubscribe(agent);
                    }
                  }}
                  disabled={isSubscribed || isCurrentlySubscribing}
                >
                  {isCurrentlySubscribing ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : isSubscribed ? (
                    <>
                      <FaCrown className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" />
                      <span>Subscribed</span>
                    </>
                  ) : (
                    <>
                      <FaCrown className="w-4 h-4 text-yellow-300" />
                      <span>Subscribe ({creditCost} Credits)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserAgent && currentPage === 1 && (
        <div className="mb-6">
          <h3 className="ml-[10px] text-base sm:text-lg font-semibold text-gray-300 mb-3 sm:mb-4 flex items-center">
            <span className="mr-2">
              <FaUser></FaUser>
            </span>
            Your Analytics
          </h3>
          {renderCurrentUserCard(currentUserAgent)}
        </div>
      )}

      {paginatedAgents.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <div className="px-4 py-2 flex items-center gap-3 md:gap-4 text-xs text-gray-300 border-b border-gray-800/50 mb-2">
            <div className="flex items-center flex-shrink-0 w-[30%] sm:w-[25%] md:w-[240px]">
              <span className="w-6 text-center mr-3 flex-shrink-0">#</span>
              <span className="flex-grow truncate pr-1">Analyst</span>
            </div>
            <div className="hidden lg:flex items-center justify-between gap-2 md:gap-4 flex-grow min-w-0 px-1">
              <span className="w-1/3 text-center truncate">Herded/Hidden</span>
              <span className="w-1/3 text-center truncate">
                Conviction/Hype
              </span>
              <span className="w-1/3 text-center truncate">Meme/Inst.</span>
            </div>
            <div className="hidden lg:flex items-center justify-end gap-2 md:gap-3 flex-shrink-0 w-auto sm:w-[300px] md:w-[390px]">
              <span className="w-16 text-right hidden sm:inline-block">
                Mindshare
              </span>
              <span className="w-20 text-right hidden lg:inline-block">
                Followers
              </span>
              <span className="w-16 text-right">
                {mode === "impact" ? "Impact" : "Heartbeat"}
              </span>
              <span className="w-16 text-right">Credits</span>
              <span className="w-8 text-center">View</span>
              <span className="w-24 text-center">Subscribe</span>
            </div>
          </div>
          <div className="space-y-2">
            {paginatedAgents.map((agent) => {
              const rank =
                sortedAgents.findIndex(
                  (a) => a.twitterHandle === agent.twitterHandle
                ) + 1;
              const cleanHandle = agent.twitterHandle.replace("@", "");
              const isSubscribed = subscribedHandles.includes(cleanHandle);
              const isCurrentlySubscribing = subscribingHandle === cleanHandle;
              const isCurrentUser =
                session?.user?.username &&
                cleanHandle.toLowerCase() ===
                  session.user.username.replace("@", "").toLowerCase();
              const creditCost = agent?.subscriptionPrice;
              return (
                <div
                  key={agent.twitterHandle}
                  className={`impact-card list-item relative ${
                    isCurrentUser
                      ? "bg-gradient-to-br from-gray-900 via-blue-950/80 to-gray-900 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]"
                      : "bg-gray-900/50 border-gray-800/50 hover:bg-cyan-950"
                  } backdrop-blur-sm border rounded-lg overflow-hidden transition-all duration-200 hover:cursor-pointer`}
                  onClick={() => router.push(`/influencer/${cleanHandle}`)}
                >
                  {/* Desktop Layout (md and above) */}
                  <div className="hidden lg:flex px-4 py-2 items-center gap-4">
                    <div className="flex items-center flex-shrink-0 w-[240px]">
                      <div className="w-6 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 text-xs font-medium mr-3 flex-shrink-0">
                        {rank}
                      </div>
                      {agent.twitterHandle && (
                        <div className="relative w-8 h-8 mr-3 flex-shrink-0">
                          <img
                            src={
                              agent.profileUrl?.trim().length > 0
                                ? agent.profileUrl
                                : `https://picsum.photos/seed/${encodeURIComponent(
                                    agent.twitterHandle
                                  )}/40/40`
                            }
                            alt={agent.name}
                            className="w-full h-full object-cover rounded-full border border-gray-700/50"
                          />
                          {agent.verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border border-gray-900">
                              <FaCheck className="w-1.5 h-1.5 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-grow overflow-hidden">
                        <h4 className="text-sm font-medium text-white truncate">
                          {agent.name}{" "}
                          {isCurrentUser && (
                            <span className="text-blue-300 font-medium">
                              (You)
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {agent.twitterHandle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-grow min-w-0 px-1">
                      <div className="w-1/3 text-center">
                        {renderMetricIndicator(
                          agent.herdedVsHidden || 0,
                          "bg-red-400",
                          "bg-cyan-400"
                        )}
                      </div>
                      <div className="w-1/3 text-center">
                        {renderMetricIndicator(
                          agent.convictionVsHype || 0,
                          "bg-green-500",
                          "bg-rose-500"
                        )}
                      </div>
                      <div className="w-1/3 text-center">
                        {renderMetricIndicator(
                          agent.memeVsInstitutional || 0,
                          "bg-yellow-300",
                          "bg-gray-100"
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 flex-shrink-0 w-[385px]">
                      <div className="w-16 text-right">
                        {agent.mindshare > 0 ? (
                          <p className="text-blue-400 text-sm font-medium">
                            {agent.mindshare != null
                              ? `${agent.mindshare.toFixed(2)}%`
                              : "--"}
                          </p>
                        ) : (
                          <span className="text-sm text-[#5DA1F3]">--</span>
                        )}
                      </div>
                      <div className="w-20 text-right">
                        {agent.followers > 0 ? (
                          <p className="text-gray-300 text-sm">
                            {agent.followers != null
                              ? formatFollowersCount(agent.followers)
                              : "--"}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-100">--</span>
                        )}
                      </div>
                      <div className="w-14 text-right">
                        <p className="text-blue-400 text-sm font-medium">
                          {agent[primaryField] ?? "--"}
                        </p>
                      </div>
                      <div className="w-16 text-right">
                        <p className="text-amber-400 text-sm font-medium">
                          {creditCost}
                        </p>
                      </div>
                      <div className="w-8 flex justify-center">
                        <Link
                          href={`https://x.com/${cleanHandle}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-300 hover:bg-gray-700/50 transition-colors"
                          title="View Profile"
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="w-24 flex justify-center">
                        <button
                          className={`flex items-center justify-center px-2 py-1.5 rounded-md text-xs w-full ${
                            isSubscribed || isCurrentlySubscribing
                              ? "bg-green-500/20 text-green-300"
                              : "bg-blue-600/80 hover:bg-blue-700 text-white"
                          } transition-all duration-200 whitespace-nowrap ${
                            isCurrentlySubscribing ? "animate-pulse" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSubscribed && !isCurrentlySubscribing) {
                              onSubscribe(agent);
                            }
                          }}
                          disabled={isSubscribed || isCurrentlySubscribing}
                        >
                          {isCurrentlySubscribing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isSubscribed ? (
                            <>
                              <FaCrown
                                size={12}
                                className="mr-1.5 flex-shrink-0"
                              />
                              <span>Subscribed</span>
                            </>
                          ) : (
                            <>
                              <FaCrown
                                size={12}
                                className="mr-1.5 flex-shrink-0"
                              />
                              <span>Subscribe</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Mobile Layout (below md) */}
                  <div className="lg:hidden">
                    <MobileAnalystCard
                      agent={
                        isCurrentUser
                          ? { ...agent, name: `${agent.name} (You)` }
                          : agent
                      }
                      rank={rank}
                      subscribedHandles={subscribedHandles}
                      subscribingHandle={subscribingHandle}
                      onSubscribe={onSubscribe}
                      primaryField={primaryField}
                      primaryLabel={primaryLabel}
                      formatFollowersCount={formatFollowersCount}
                      renderMetricIndicator={renderMetricIndicator} 
                      isCurrentUser={isCurrentUser || false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-700 to-blue-900 text-white shadow-lg transition-all duration-300 hover:shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                aria-label="Previous page"
              >
                <FaChevronLeft
                  size={16}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
              </button>
              <div className="px-4 py-1.5 sm:px-5 sm:py-2 bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-full text-white font-medium shadow-lg text-xs sm:text-sm">
                <span className="text-gray-400">Page </span>
                <span className="text-blue-400 mx-1 font-bold">
                  {currentPage}
                </span>
                <span className="text-gray-400">of </span>
                <span className="text-blue-400 font-bold">{totalPages}</span>
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-700 to-blue-900 text-white shadow-lg transition-all duration-300 hover:shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                aria-label="Next page"
              >
                <FaChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(AnalystLeaderboard);

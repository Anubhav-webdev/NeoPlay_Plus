import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Flag,
  Image,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import {
  getAdminContent,
  getAdminOverview,
  getAdminReports,
  getAdminUsers,
  permanentlyDeleteAdminContent,
  setAdminUserRole,
  updateAdminContent,
  updateAdminReport,
} from "../../api/adminApi.js";
import {
  decideCreatorApplication,
  decideDuplicateReview,
  getDuplicateReviewQueuePage,
  getCreatorApplications,
} from "../../api/mediaApi.js";

const TABS = [
  ["overview", "Overview", BarChart3],
  ["reports", "Reports", Flag],
  ["content", "Content", FileImage],
  ["creators", "Creators", ShieldCheck],
  ["media-reviews", "Media reviews", FileImage],
  ["users", "Users", Users],
];

const PANEL = "rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg shadow-black/10";
const BUTTON = "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50";

function dateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-700 bg-slate-800 text-slate-300",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    red: "border-red-500/20 bg-red-500/10 text-red-200",
    blue: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${tones[tone] || tones.slate}`}>
      {children || "unknown"}
    </span>
  );
}

function MetricCard({ label, value, detail, icon: Icon, accent = "cyan" }) {
  const accents = {
    cyan: "text-cyan-300 bg-cyan-400/10",
    violet: "text-violet-300 bg-violet-400/10",
    emerald: "text-emerald-300 bg-emerald-400/10",
    amber: "text-amber-300 bg-amber-400/10",
    rose: "text-rose-300 bg-rose-400/10",
  };
  return (
    <article className={`${PANEL} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">{Number(value || 0).toLocaleString()}</p>
          {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
        </div>
        <span className={`rounded-xl p-3 ${accents[accent] || accents.cyan}`}><Icon size={20} /></span>
      </div>
    </article>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-slate-500">{text}</div>;
}

export default function AdminDashboard() {
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === "admin";
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [contentType, setContentType] = useState("");
  const [page, setPage] = useState(1);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setError("");
    setNotice("");
    if (tab === "reports" || tab === "creators") setStatus("pending");
    else if (tab === "content") setStatus("published");
    else if (tab === "users") setStatus("all");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadOverview = useCallback(async (signal) => {
    try {
      const result = await getAdminOverview({ signal });
      if (!signal?.aborted) setOverview(result);
      setError("");
    } catch (loadError) {
      if (!signal?.aborted && loadError.name !== "AbortError") {
        setError(loadError.message || "Could not load dashboard totals.");
      }
    } finally {
      if (!signal?.aborted) setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const controller = new AbortController();
    void loadOverview(controller.signal);
    return () => controller.abort();
  }, [isAdmin, loadOverview]);

  const loadRecords = useCallback(async (signal) => {
    if (activeTab === "overview") return;
    setLoading(true);
    setError("");
    try {
      let result;
      if (activeTab === "reports") {
        result = await getAdminReports({ page, limit: 25, status, signal });
        setRecords(result.reports || []);
      } else if (activeTab === "content") {
        result = await getAdminContent({ page, limit: 25, status, type: contentType, signal });
        setRecords(result.items || []);
      } else if (activeTab === "creators") {
        const creators = await getCreatorApplications({ status, signal });
        result = { items: creators, pagination: { page: 1, pages: 1, total: creators.length } };
        setRecords(creators || []);
      } else if (activeTab === "media-reviews") {
        result = await getDuplicateReviewQueuePage({ page, limit: 25, signal });
        setRecords(result.uploads || []);
      } else if (activeTab === "users") {
        result = await getAdminUsers({ page, limit: 25, role: status === "all" ? "" : status, search: debouncedSearch, signal });
        setRecords(result.users || []);
      }
      if (signal?.aborted) return;
      setPagination(result?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (loadError) {
      if (!signal?.aborted && loadError.name !== "AbortError") {
        setError(loadError.message || "Could not load this admin section.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeTab, contentType, debouncedSearch, page, status]);

  useEffect(() => {
    if (!isAdmin || activeTab === "overview") return undefined;
    const controller = new AbortController();
    void loadRecords(controller.signal);
    return () => controller.abort();
  }, [activeTab, isAdmin, loadRecords]);

  const refresh = async () => {
    setNotice("");
    setError("");
    const controller = new AbortController();
    await Promise.all([loadOverview(controller.signal), loadRecords(controller.signal)]);
  };

  const runAction = async (id, action, successMessage) => {
    setActionId(String(id));
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      const controller = new AbortController();
      await Promise.all([loadOverview(controller.signal), loadRecords(controller.signal)]);
    } catch (actionError) {
      setError(actionError.message || "The action could not be completed.");
    } finally {
      setActionId("");
    }
  };

  const reviewDuplicate = async (uploadId, decision) => {
    const actionLabel = decision === "approve" ? "approved for processing" : "rejected";
    await runAction(
      `duplicate:${uploadId}`,
      () => decideDuplicateReview(uploadId, decision),
      `Upload ${actionLabel}.`,
    );
  };

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-slate-100">
        <section className={`${PANEL} p-8 text-center`}>
          <Shield className="mx-auto text-amber-300" size={34} />
          <h1 className="mt-4 text-2xl font-black">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with an administrator account to open the control center.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-[1500px] px-4 py-7 text-slate-100 sm:px-6 lg:px-8 all-font">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300"><ShieldCheck size={15} /> NeoPlay+ control center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Platform growth, creator performance, user activity, and moderation actions.</p>
        </div>
        <button type="button" className={BUTTON} onClick={refresh} disabled={loading || overviewLoading}>
          <RefreshCw size={15} className={loading || overviewLoading ? "animate-spin" : ""} /> Refresh data
        </button>
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}

      <nav aria-label="Admin dashboard sections" className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => changeTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${activeTab === id ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        overviewLoading && !overview ? (
          <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400"><LoaderCircle className="animate-spin" size={18} /> Loading platform analytics…</div>
        ) : overview ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total users" value={overview.users} icon={Users} accent="cyan" />
              <MetricCard label="Creators" value={overview.creators?.total} detail={`${overview.creators?.approved || 0} approved · ${overview.creators?.pending || 0} pending`} icon={ShieldCheck} accent="violet" />
              <MetricCard label="Published posts" value={overview.content?.published} detail={`${overview.content?.total || 0} total posts`} icon={Play} accent="emerald" />
              <MetricCard label="Open reports" value={(overview.reports?.pending || 0) + (overview.reports?.reviewing || 0)} detail={`${overview.reports?.resolved || 0} resolved`} icon={AlertTriangle} accent="rose" />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Video posts" value={overview.content?.videos} detail={`${overview.content?.readyVideoAssets || 0} verified video files`} icon={Video} accent="cyan" />
              <MetricCard label="Image posts" value={overview.content?.images} detail={`${overview.content?.readyImageAssets || 0} verified image files`} icon={Image} accent="amber" />
              <MetricCard label="Tweets" value={overview.content?.tweets} detail="All creator text posts" icon={ArrowUpRight} accent="violet" />
              <MetricCard label="Media reviews" value={overview.mediaReviewCount} detail="Uploads waiting for duplicate review" icon={FileImage} accent="rose" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <article className={`${PANEL} p-5 sm:p-6`}>
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="text-lg font-black">Top creators</h2><p className="mt-1 text-xs text-slate-500">Ranked by subscribers</p></div>
                  <Users size={18} className="text-violet-300" />
                </div>
                <div className="mt-4 space-y-2">
                  {(overview.topCreators || []).length ? overview.topCreators.map((creator, index) => (
                    <div key={creator._id} className="flex items-center gap-3 rounded-xl bg-slate-950/60 p-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-400/10 text-xs font-black text-violet-200">{index + 1}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{creator.displayName || "Creator"}</p><p className="truncate text-xs text-slate-500">{creator.creatorId ? `@${creator.creatorId}` : creator.applicationStatus}</p></div>
                      <span className="whitespace-nowrap text-sm font-black text-cyan-200">{Number(creator.subscribers || 0).toLocaleString()} <span className="text-[10px] font-medium text-slate-500">subs</span></span>
                    </div>
                  )) : <EmptyState text="No creator subscriptions yet." />}
                </div>
              </article>
                <section className="grid  lg:grid-cols-1 gap-2">
              <article className={`${PANEL} p-5`}><h2 className="font-black">Report queue</h2><p className="mt-2 text-sm text-slate-400">{overview.reports?.pending || 0} waiting · {overview.reports?.reviewing || 0} being reviewed</p><button className={`${BUTTON} mt-4`} type="button" onClick={() => changeTab("reports")}>Open reports <ChevronRight size={14} /></button></article>
              <article className={`${PANEL} p-5`}><h2 className="font-black">Creator applications</h2><p className="mt-2 text-sm text-slate-400">{overview.creators?.pending || 0} waiting for a decision</p><button className={`${BUTTON} mt-4`} type="button" onClick={() => changeTab("creators")}>Review applications <ChevronRight size={14} /></button></article>
              <article className={`${PANEL} p-5`}><h2 className="font-black">Content moderation</h2><p className="mt-2 text-sm text-slate-400">Review or archive published videos, images, and tweets.</p><button className={`${BUTTON} mt-4`} type="button" onClick={() => changeTab("content")}>Manage content <ChevronRight size={14} /></button></article>
            </section>
            </section>
          </div>
        ) : <EmptyState text="Analytics are not available right now." />
      ) : (
        <section className={`${PANEL} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
            <div><h2 className="text-lg font-black">{TABS.find(([id]) => id === activeTab)?.[1]}</h2><p className="mt-1 text-xs text-slate-500">{pagination.total?.toLocaleString?.() || 0} records</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "users" && <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input className="w-52 rounded-lg border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-400/50" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search users" /></label>}
              {activeTab === "reports" && <select className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="pending">Pending</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="">All statuses</option></select>}
              {activeTab === "content" && <><select className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option><option value="">All statuses</option></select><select className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={contentType} onChange={(event) => { setContentType(event.target.value); setPage(1); }}><option value="">All types</option><option value="Video">Videos</option><option value="Image">Images</option><option value="Tweet">Tweets</option></select></>}
              {activeTab === "creators" && <select className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>}
              {activeTab === "users" && <select className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All roles</option><option value="user">User</option><option value="creator">Creator</option><option value="admin">Admin</option></select>}
            </div>
          </div>

          {loading ? <div role="status" className="flex items-center justify-center gap-2 p-14 text-sm text-slate-400"><LoaderCircle size={17} className="animate-spin" /> Loading records…</div> : records.length === 0 ? <div className="p-5"><EmptyState text="No records match this filter." /></div> : (
            <div className="divide-y divide-white/5">
              {activeTab === "reports" && records.map((report) => {
                const actionKey = `report:${report._id}`;
                return <article key={report._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusPill tone={report.status === "pending" ? "amber" : report.status === "resolved" ? "green" : report.status === "dismissed" ? "slate" : "blue"}>{report.status}</StatusPill><StatusPill>{report.reason}</StatusPill><StatusPill>{report.contentId?.type || "post"}</StatusPill></div><p className="mt-2 truncate text-sm font-bold">{report.contentId?.title || "Content unavailable"}</p><p className="mt-1 text-xs text-slate-500">Reported by {report.reporterId?.username || report.reporterId?.name || "account"} · {dateTime(report.createdAt)} · Post status: {report.contentId?.status || "unknown"}</p>{report.contentId?.description && <p className="mt-2 line-clamp-2 text-xs text-slate-400">{report.contentId.description}</p>}{report.contentId?.creatorId?.displayName && <p className="mt-1 text-xs text-slate-500">Creator: {report.contentId.creatorId.displayName}</p>}{report.contentId?.mediaUrl && <a className="mt-2 inline-flex text-xs font-bold text-cyan-300 underline" href={report.contentId.mediaUrl} target="_blank" rel="noreferrer">Open reported media</a>}</div>
                  <div className="flex flex-wrap gap-2">{report.status !== "reviewing" && <button className={BUTTON} disabled={Boolean(actionId)} onClick={() => void runAction(actionKey, () => updateAdminReport(report._id, "reviewing"), "Report moved to review.")}>Review</button>}{report.status !== "resolved" && <button className={`${BUTTON} text-emerald-200`} disabled={Boolean(actionId)} onClick={() => void runAction(actionKey, () => updateAdminReport(report._id, "resolved"), "Report marked resolved.")}><Check size={14} /> Resolve</button>}{report.status !== "dismissed" && <button className={`${BUTTON} text-slate-400`} disabled={Boolean(actionId)} onClick={() => void runAction(actionKey, () => updateAdminReport(report._id, "dismissed"), "Report dismissed.")}>Dismiss</button>}</div>
                </article>;
              })}

              {activeTab === "content" && records.map((item) => {
                const owner = item.creatorId;
                const nextStatus = item.status === "archived" ? "published" : "archived";
                return <article key={item._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusPill tone={item.status === "published" ? "green" : item.status === "draft" ? "amber" : "slate"}>{item.status}</StatusPill><StatusPill>{item.type}</StatusPill></div><p className="mt-2 truncate text-sm font-bold">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">Creator: {owner?.displayName || "Unknown"} · {Number(item.viewCount || 0).toLocaleString()} views · {dateTime(item.publishedAt || item.createdAt)}</p></div>
                  <div className="flex gap-2">
                    <button className={BUTTON} disabled={Boolean(actionId) || (item.status === "draft" && nextStatus === "published" && item.type !== "Tweet" && !item.mediaUrl)} onClick={() => void runAction(`content:${item._id}`, () => updateAdminContent(item._id, nextStatus), `Content ${nextStatus}.`)}>{item.status === "archived" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{item.status === "archived" ? "Republish" : "Archive"}</button>
                    <button className={`${BUTTON} text-red-200 hover:border-red-400/50`} disabled={Boolean(actionId)} onClick={() => { if (window.confirm(`Permanently delete "${item.title}" and any media not used by other posts? This cannot be undone.`)) void runAction(`content:${item._id}`, () => permanentlyDeleteAdminContent(item._id), "Permanent deletion queued; media cleanup will retry automatically."); }}><Trash2 size={14} /> Delete permanently</button>
                  </div>
                </article>;
              })}

              {activeTab === "creators" && records.map((creator) => {
                const owner = creator.userId;
                return <article key={creator._id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusPill tone={creator.applicationStatus === "approved" ? "green" : creator.applicationStatus === "pending" ? "amber" : creator.applicationStatus === "suspended" ? "red" : "slate"}>{creator.applicationStatus}</StatusPill><StatusPill>{creator.creatorId || "ID not assigned"}</StatusPill></div><p className="mt-2 text-sm font-bold">{creator.displayName}</p><p className="mt-1 text-xs text-slate-500">{owner?.name || owner?.username || "Account"}{owner?.email ? ` · ${owner.email}` : ""} · Applied {dateTime(creator.createdAt)}</p>{creator.tagline && <p className="mt-2 text-sm text-slate-400">{creator.tagline}</p>}</div>
                  <div className="flex flex-wrap gap-2">{creator.applicationStatus !== "approved" && <button className={`${BUTTON} text-emerald-200`} disabled={Boolean(actionId)} onClick={() => void runAction(`creator:${creator._id}`, () => decideCreatorApplication(creator._id, "approved"), `${creator.displayName} approved.`)}>Approve</button>}{creator.applicationStatus !== "suspended" && <button className={`${BUTTON} text-amber-200`} disabled={Boolean(actionId)} onClick={() => void runAction(`creator:${creator._id}`, () => decideCreatorApplication(creator._id, "suspended"), `${creator.displayName} suspended.`)}>Suspend</button>}{creator.applicationStatus !== "rejected" && <button className={`${BUTTON} text-red-200`} disabled={Boolean(actionId)} onClick={() => void runAction(`creator:${creator._id}`, () => decideCreatorApplication(creator._id, "rejected"), `${creator.displayName} rejected.`)}>Reject</button>}</div>
                </article>;
              })}

              {activeTab === "media-reviews" && records.map((upload) => {
                const match = upload.duplicateDecision?.matchAssetId;
                const score = upload.duplicateDecision?.score;
                return <article key={upload._id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusPill tone="amber">Review required</StatusPill><StatusPill>{upload.mediaType}</StatusPill>{typeof score === "number" && <StatusPill>{`${(score * 100).toFixed(1)}% match`}</StatusPill>}</div><p className="mt-2 break-all text-sm font-bold">{upload.originalName}</p><p className="mt-1 text-xs text-slate-500">Uploaded by {upload.ownerId?.username || upload.ownerId?.name || "Unknown account"} · {dateTime(upload.createdAt)}</p><p className="mt-2 text-sm text-slate-400">{upload.duplicateDecision?.reason || "Possible duplicate requires review."}</p>{match && <><p className="mt-1 text-xs text-slate-500">Matched upload: {match.originalName || match._id}{match.mediaType ? ` · ${match.mediaType}` : ""}{match.status ? ` · ${match.status}` : ""}</p>{match.secureUrl && <a className="mt-1 inline-flex text-xs font-bold text-amber-200 underline" href={match.secureUrl} target="_blank" rel="noreferrer">View existing match</a>}</>}{upload.secureUrl && <a className="mt-2 inline-flex text-xs font-bold text-cyan-300 underline" href={upload.secureUrl} target="_blank" rel="noreferrer">View uploaded media</a>}</div>
                  <div className="flex flex-wrap gap-2"><button type="button" className={`${BUTTON} text-emerald-200`} disabled={Boolean(actionId)} onClick={() => void reviewDuplicate(upload._id, "approve")}><Check size={14} /> Approve</button><button type="button" className={`${BUTTON} text-red-200`} disabled={Boolean(actionId)} onClick={() => void reviewDuplicate(upload._id, "reject")}><Flag size={14} /> Reject</button></div>
                </article>;
              })}

              {activeTab === "users" && records.map((user) => (
                <article key={user._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-800 text-sm font-black text-cyan-200">{user.avatar ? <img className="h-full w-full object-cover" src={user.avatar} alt="" /> : (user.name || user.username || "U").slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{user.name || user.username}</p><p className="truncate text-xs text-slate-500">{user.email}{user.username ? ` · @${user.username}` : ""}</p><p className="mt-1 text-[11px] text-slate-600">Joined {dateTime(user.createdAt)}</p></div></div>
                  <div className="flex items-center gap-3"><StatusPill tone={user.role === "admin" ? "blue" : user.role === "creator" ? "violet" : "slate"}>{user.role}</StatusPill>{user.role !== "creator" && <button className={BUTTON} disabled={Boolean(actionId) || String(user._id) === String(currentUser.id || currentUser._id)} onClick={() => { const nextRole = user.role === "admin" ? "user" : "admin"; if (window.confirm(`${nextRole === "admin" ? "Grant" : "Remove"} administrator access for ${user.name || user.username}?`)) void runAction(`user:${user._id}`, async () => { const updated = await setAdminUserRole(user._id, nextRole); setRecords((current) => current.map((entry) => entry._id === user._id ? updated : entry)); }, `Account role changed to ${nextRole}.`); }}>{user.role === "admin" ? "Remove admin" : "Grant admin"}</button>}</div>
                </article>
              ))}
            </div>
          )}

          {pagination.pages > 1 && activeTab !== "creators" && <footer className="flex items-center justify-between border-t border-white/10 p-4"><p className="text-xs text-slate-500">Page {pagination.page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" className={BUTTON} disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /> Previous</button><button type="button" className={BUTTON} disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={15} /></button></div></footer>}
        </section>
      )}
    </main>
  );
}

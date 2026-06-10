import { MoreHorizontal, Play, Plus, Settings, Trophy, Undo2 } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BracketPanel } from "./components/BracketPanel";
import { Dashboard } from "./components/Dashboard";
import { GroupsPanel } from "./components/GroupsPanel";
import { OfflineBanner } from "./components/OfflineBanner";
import { OnboardingDialog } from "./components/OnboardingDialog";
import { PrintView } from "./components/PrintView";
import { RankingPanel } from "./components/RankingPanel";
import { SchedulePanel } from "./components/SchedulePanel";
import { SettingsSheet } from "./components/SettingsSheet";
import { SetupWizard } from "./components/SetupWizard";
import { Spinner } from "./components/Spinner";
import { StatisticsPanel } from "./components/StatisticsPanel";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { type PhaseId, SubNav } from "./components/ui/PhaseNav";
import { useConfirm } from "./hooks/useConfirm";
import { useSync } from "./hooks/useSync";
import { useToast } from "./hooks/useToast";
import { useTournament } from "./hooks/useTournament";
import { useTranslation } from "./i18n";
import { ROUTES } from "./lib/routes.ts";
import { AppShell, Button, type NavItem } from "./lib/ui";
import { generateSchedule } from "./scheduler";
import { migrate } from "./storage";
import type { Tournament } from "./types";

// Prep-phase panels pull in @dnd-kit (drag-and-drop) — lazy-load them so that
// dependency stays out of the initial bundle for users who land mid-tournament.
const PlayersPanel = lazy(() =>
  import("./components/PlayersPanel").then((m) => ({ default: m.PlayersPanel })),
);
const EntriesPanel = lazy(() =>
  import("./components/EntriesPanel").then((m) => ({ default: m.EntriesPanel })),
);

const ONBOARDING_KEY = "tennisturnier:welcomeDismissed";

function readOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

function inferPhase(t: ReturnType<typeof useTournament>["tournament"]): PhaseId {
  const f = t.format;
  if (f === "rotation") {
    if (t.schedule.length === 0) return "prep";
    const all = t.schedule.flatMap((r) => r.matches);
    const allDone = all.length > 0 && all.every((m) => m.scoreA != null && m.scoreB != null);
    return allDone ? "results" : "live";
  }
  if (f === "groups") {
    if (t.entries.length < 2 || t.groupSchedule.length === 0) return "prep";
    const allDone = t.groupSchedule.every((m) => m.scoreA != null && m.scoreB != null);
    return allDone ? "results" : "live";
  }
  // knockout / groups-ko
  if (t.entries.length < 2 || t.bracket.length === 0) return "prep";
  const allDone = t.bracket.every((m) => m.scoreA != null && m.scoreB != null);
  return allDone ? "results" : "live";
}

/** The active phase is derived from the URL (see src/lib/router.tsx). */
function phaseFromPath(pathname: string): PhaseId {
  if (pathname === ROUTES.live) return "live";
  if (pathname === ROUTES.results) return "results";
  return "prep";
}

function pathForPhase(phase: PhaseId): string {
  if (phase === "live") return ROUTES.live;
  if (phase === "results") return ROUTES.results;
  return ROUTES.setup;
}

function App() {
  const { t: tr } = useTranslation();
  const t = useTournament();
  // Remote snapshots come from the server unvalidated (`tournament: unknown` in
  // KV) — run them through the same migrate() the JSON import uses, so a payload
  // from an older/foreign client can't crash or corrupt local state. Memoized
  // because applyRemote sits in the viewer poll effect's dependency array.
  const { replaceTournament } = t;
  const applyRemote = useCallback(
    (next: Tournament) => replaceTournament(migrate(next)),
    [replaceTournament],
  );
  const sync = useSync({
    tournament: t.tournament,
    setSync: t.setSync,
    applyRemote,
  });
  const isOwner = sync.role !== "viewer";
  const confirm = useConfirm();
  const { toast } = useToast();

  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingDone());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Phase is route-driven (/, /live, /ergebnis); sub-tabs stay local state.
  const location = useLocation();
  const navigate = useNavigate();
  const phase = phaseFromPath(location.pathname);
  const setPhase = useCallback(
    (p: PhaseId) => {
      navigate(pathForPhase(p));
    },
    [navigate],
  );
  const [subTab, setSubTab] = useState<string>("");

  // Tournament data hydrates asynchronously from idb. Once it lands, jump to the
  // inferred phase exactly once — but only from the default route, so a deep
  // link (e.g. /live) is respected. Runs behind the hydration gate, no flash.
  const didInitPhase = useRef(false);
  useEffect(() => {
    if (t.hydrated && !didInitPhase.current) {
      didInitPhase.current = true;
      const inferred = inferPhase(t.tournament);
      if (inferred !== "prep" && location.pathname === ROUTES.setup) {
        navigate(pathForPhase(inferred), { replace: true });
      }
    }
  }, [t.hydrated, t.tournament, location.pathname, navigate]);

  // Smart re-default: when phase becomes invalid (e.g. user reset / imported
  // an empty tournament), step back to prep.
  useEffect(() => {
    const inferred = inferPhase(t.tournament);
    if ((phase === "live" || phase === "results") && inferred === "prep") {
      setPhase("prep");
    }
  }, [t.tournament, phase, setPhase]);

  // Derived: sub-tabs per phase
  const subTabs = useMemo(() => {
    const f = t.tournament.format;
    if (phase === "prep") {
      const tabs = [{ id: "setup", label: tr("tab.setup") }];
      if (f === "rotation") tabs.push({ id: "players", label: tr("tab.players") });
      else tabs.push({ id: "entries", label: tr("tab.entries") });
      return tabs;
    }
    if (phase === "live") {
      const tabs = [{ id: "overview", label: tr("tab.overview") }];
      if (f === "rotation") tabs.push({ id: "schedule", label: tr("tab.schedule") });
      if (f === "groups" || f === "groups-ko") tabs.push({ id: "groups", label: tr("tab.groups") });
      if (f === "knockout" || f === "groups-ko")
        tabs.push({ id: "bracket", label: tr("tab.bracket") });
      tabs.push({ id: "statistics", label: tr("tab.statistics") });
      return tabs;
    }
    // results
    return [
      { id: "ranking", label: tr("tab.ranking") },
      { id: "statistics", label: tr("tab.statistics") },
      { id: "print", label: tr("tab.print") },
    ];
  }, [phase, t.tournament.format, tr]);

  // Reset sub-tab to first valid when phase changes or list changes
  useEffect(() => {
    if (!subTabs.some((s) => s.id === subTab)) {
      setSubTab(subTabs[0]?.id ?? "");
    }
  }, [subTabs, subTab]);

  // Auto-join via ?join=<code> URL param — runs once on first mount.
  const joinedRef = useRef(false);
  useEffect(() => {
    if (joinedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if (!code) return;
    joinedRef.current = true;
    sync
      .joinSession(code)
      .catch(() => {})
      .finally(() => {
        params.delete("join");
        const next = `${window.location.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        window.history.replaceState({}, "", next);
      });
  }, [sync.joinSession]);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    window.setTimeout(() => {
      try {
        t.snapshot();
        const result = generateSchedule(t.tournament, tr);
        t.setSchedule(result.rounds);
        setWarnings(result.warnings);
        if (result.warnings.length === 0) {
          toast({ variant: "success", title: tr("toast.scheduleCreated") });
        } else {
          toast({
            variant: "info",
            title: tr("toast.scheduleCreated"),
            description: tr(
              result.warnings.length === 1 ? "toast.scheduleHints" : "toast.scheduleHintsPlural",
              { count: result.warnings.length },
            ),
          });
        }
        // Move to live phase after generating
        setPhase("live");
      } catch (err) {
        toast({
          variant: "error",
          title: tr("toast.scheduleFailed"),
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setIsGenerating(false);
      }
    }, 0);
  }, [t, toast, tr, setPhase]);

  const handleReset = useCallback(() => {
    t.snapshot();
    t.reset();
    setPhase("prep");
  }, [t.snapshot, t.reset, setPhase]);

  const handleNewTournament = useCallback(async () => {
    const ok = await confirm({
      title: tr("settings.newTournamentConfirm.title"),
      description: tr("settings.newTournamentConfirm.description"),
      confirmLabel: tr("settings.newTournamentConfirm.button"),
      destructive: true,
    });
    if (ok) handleReset();
  }, [tr, handleReset, confirm]);

  const handleReshuffle = () => {
    t.snapshot();
    t.reshuffleGroups();
  };

  const handleExport = () => {
    const exportable = t.tournament.sync
      ? { ...t.tournament, sync: { ...t.tournament.sync, ownerToken: undefined } }
      : t.tournament;
    const blob = new Blob([JSON.stringify(exportable, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (t.tournament.name || "turnier").replace(/[^a-z0-9-_]+/gi, "_").toLowerCase();
    a.href = url;
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    let next: ReturnType<typeof migrate>;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      next = migrate(parsed);
    } catch {
      toast({
        variant: "error",
        title: tr("toast.importFailed"),
        description: tr("toast.importFailedDesc"),
      });
      return;
    }
    const ok = await confirm({
      title: tr("toast.loadConfirm.title"),
      description: tr("toast.loadConfirm.description", { name: next.name }),
      confirmLabel: tr("toast.loadConfirm.button"),
      destructive: true,
    });
    if (ok) {
      t.snapshot();
      t.replaceTournament(next);
      // re-infer phase from new data
      setPhase(inferPhase(next));
      toast({ variant: "success", title: tr("toast.loaded") });
    }
  };

  const finishOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+Z triggers undo (when not editing form fields).
  // Destructure the stable callback + flag so the listener only re-binds when
  // undo availability actually changes (not on every render).
  const { undo, canUndo } = t;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (canUndo) {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUndo, undo]);

  const navItems: NavItem[] = [
    {
      to: ROUTES.setup,
      label: tr("phase.prep"),
      icon: <Settings className="h-5 w-5" aria-hidden="true" />,
    },
    {
      to: ROUTES.live,
      label: tr("phase.live"),
      icon: <Play className="h-5 w-5" aria-hidden="true" />,
    },
    {
      to: ROUTES.results,
      label: tr("phase.results"),
      icon: <Trophy className="h-5 w-5" aria-hidden="true" />,
    },
  ];

  // Hold a loading state until the tournament is read from idb, so the first
  // visible paint already lands on the inferred phase with real data.
  if (!t.hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted text-court">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <>
      <OfflineBanner />
      <AppShell
        title={t.tournament.name || tr("app.defaultName")}
        logo={<TennisLogo />}
        navItems={navItems}
        headerActions={
          <>
            {sync.role !== "none" && (
              <SyncIndicator
                status={sync.status}
                role={sync.role}
                label={tr(sync.role === "owner" ? "app.role.owner" : "app.role.viewer")}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={t.undo}
              disabled={!t.canUndo || !isOwner}
              title={isOwner ? tr("app.undoTitle") : tr("app.undoDisabledTitle")}
              aria-label={tr("app.undo")}
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewTournament}
              disabled={!isOwner}
              title={tr("settings.newTournament")}
              aria-label={tr("settings.newTournament")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tr("header.new")}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              title={tr("settings.openMenu")}
              aria-label={tr("settings.openMenu")}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        }
      >
        {/* Sub-tabs */}
        <div className="-mt-2 mb-5 border-b border-border">
          <SubNav current={subTab} onChange={setSubTab} tabs={subTabs} />
        </div>

        <div key={`${phase}-${subTab}`} className="animate-fade-in">
          <Suspense
            fallback={
              <div className="py-16 flex justify-center">
                <Spinner />
              </div>
            }
          >
            {/* PREP PHASE */}
            {phase === "prep" && subTab === "setup" && (
              <SetupWizard
                name={t.tournament.name}
                format={t.tournament.format}
                entryFormat={t.tournament.entryFormat}
                courts={t.tournament.courts}
                rounds={t.tournament.rounds}
                mode={t.tournament.mode}
                allowPartialFinalRound={t.tournament.allowPartialFinalRound}
                groupCount={t.tournament.groupCount}
                advancePerGroup={t.tournament.advancePerGroup}
                thirdPlaceMatch={t.tournament.thirdPlaceMatch}
                perGenderRanking={t.tournament.perGenderRanking}
                onName={t.setName}
                onFormat={t.setFormat}
                onEntryFormat={t.setEntryFormat}
                onCourts={t.setCourts}
                onRounds={t.setRounds}
                onMode={t.setMode}
                onAllowPartialFinalRound={t.setAllowPartialFinalRound}
                onGroupCount={t.setGroupCount}
                onAdvancePerGroup={t.setAdvancePerGroup}
                onThirdPlaceMatch={t.setThirdPlaceMatch}
                onPerGenderRanking={t.setPerGenderRanking}
                onFinish={() => {
                  const next = subTabs.find((s) => s.id !== "setup");
                  if (next) setSubTab(next.id);
                }}
              />
            )}
            {phase === "prep" && subTab === "players" && (
              <PlayersPanel
                players={t.tournament.players}
                onAdd={t.addPlayer}
                onUpdate={t.updatePlayer}
                onRemove={t.removePlayer}
                onSort={t.sortPlayersBy}
                onArrayMove={t.setPlayersOrder}
                onContinue={() => {
                  if (t.tournament.schedule.length === 0) handleGenerate();
                  else setPhase("live");
                }}
                continueLabel={
                  t.tournament.schedule.length === 0
                    ? tr("dashboard.scheduleButton")
                    : tr("phase.live")
                }
              />
            )}
            {phase === "prep" && subTab === "entries" && (
              <EntriesPanel
                entries={t.tournament.entries}
                entryFormat={t.tournament.entryFormat}
                onAdd={t.addEntry}
                onUpdate={t.updateEntry}
                onRemove={t.removeEntry}
                onReorder={t.setEntriesOrder}
                onSortByName={t.sortEntriesByName}
                onContinue={() => setPhase("live")}
                continueLabel={tr("phase.live")}
              />
            )}

            {/* LIVE PHASE */}
            {phase === "live" && subTab === "overview" && (
              <Dashboard
                tournament={t.tournament}
                isOwner={isOwner}
                onTimerMinutes={t.setTimerMinutes}
                onBellVariant={t.setBellVariant}
                onMatchScore={t.setMatchScore}
                onGroupScore={t.setGroupScore}
                onBracketScore={t.setBracketScore}
                onGotoSetup={() => setPhase("prep")}
                onGotoSchedule={() => {
                  const target =
                    t.tournament.format === "rotation"
                      ? "schedule"
                      : t.tournament.format === "knockout"
                        ? "bracket"
                        : "groups";
                  setSubTab(target);
                }}
                onGenerate={handleGenerate}
              />
            )}
            {phase === "live" && subTab === "schedule" && (
              <SchedulePanel
                tournament={t.tournament}
                onGenerate={handleGenerate}
                onTimerMinutes={t.setTimerMinutes}
                onBellVariant={t.setBellVariant}
                onScore={t.setMatchScore}
                warnings={warnings}
                isGenerating={isGenerating}
              />
            )}
            {phase === "live" && subTab === "groups" && (
              <GroupsPanel
                tournament={t.tournament}
                onSetGroupSchedule={t.setGroupSchedule}
                onScore={t.setGroupScore}
                onSetGroupCount={t.setGroupCount}
                onInitGroupAssignment={t.initGroupAssignment}
                onReshuffle={handleReshuffle}
              />
            )}
            {phase === "live" && subTab === "bracket" && (
              <BracketPanel
                tournament={t.tournament}
                onSetBracket={t.setBracket}
                onScore={t.setBracketScore}
              />
            )}
            {phase === "live" && subTab === "statistics" && (
              <StatisticsPanel tournament={t.tournament} />
            )}

            {/* RESULTS PHASE */}
            {phase === "results" && subTab === "ranking" && (
              <RankingPanel
                tournament={t.tournament}
                isOwner={isOwner}
                onSetRevealActive={t.setRevealActive}
                onSetRevealStep={t.setRevealStep}
                onResetReveal={t.resetReveal}
              />
            )}
            {phase === "results" && subTab === "statistics" && (
              <StatisticsPanel tournament={t.tournament} />
            )}
            {phase === "results" && subTab === "print" && <PrintView tournament={t.tournament} />}
          </Suspense>
        </div>

        <footer className="no-print mt-10 text-center text-xs text-fg-subtle">
          <div className="opacity-70">{tr("app.tagline")}</div>
        </footer>
      </AppShell>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tournament={t.tournament}
        isOwner={isOwner}
        syncStatus={sync.status}
        syncRole={sync.role}
        syncError={sync.error}
        onSyncCreate={sync.createSession}
        onSyncJoin={sync.joinSession}
        onSyncLeave={sync.leaveSession}
        onExport={handleExport}
        onImport={handleImport}
      />
      <UpdatePrompt />
      {showOnboarding && <OnboardingDialog onDone={finishOnboarding} onImport={handleImport} />}
    </>
  );
}

function TennisLogo() {
  return (
    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-accent-100 border border-accent-200 shrink-0">
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
        <circle cx="12" cy="12" r="10" fill="#e5f04a" stroke="#1a3a2e" strokeWidth="1.5" />
        <path d="M3.5 8.5 c 4 1.5 9 1.5 17 0" stroke="#1a3a2e" strokeWidth="1.2" fill="none" />
        <path d="M3.5 15.5 c 4 -1.5 9 -1.5 17 0" stroke="#1a3a2e" strokeWidth="1.2" fill="none" />
      </svg>
    </span>
  );
}

function SyncIndicator({
  status,
  label,
}: {
  status: "disabled" | "connecting" | "live" | "offline" | "error";
  role: "none" | "owner" | "viewer";
  label: string;
}) {
  const color =
    status === "live"
      ? "bg-emerald-300"
      : status === "connecting"
        ? "bg-amber-300 animate-pulse"
        : "bg-rose-400";
  return (
    <span
      role="status"
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2 py-0.5"
    >
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted">
        {label}
      </span>
    </span>
  );
}

export default App;

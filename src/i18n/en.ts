import type { TranslationKey } from "./de";

export const en: Record<TranslationKey, string> = {
  // App / header / footer
  "app.title": "Tennis Tournament Planner",
  "app.defaultName": "Club Tournament",
  "app.tagline": "Stored locally in your browser · no data leaves your device",
  "app.privacyLink": "Privacy",
  "app.undo": "Undo",
  "app.undoTitle": "Undo (Ctrl/Cmd+Z)",
  "app.undoDisabledTitle": "Disabled in viewer mode",
  "app.syncStatusLabel": "Sync status: {status} ({role})",
  "app.role.owner": "Owner",
  "app.role.viewer": "Viewer",
  "header.new": "New",

  // Tabs
  "tab.setup": "Settings",
  "tab.players": "Players",
  "tab.entries": "Teams",
  "tab.schedule": "Schedule",
  "tab.groups": "Groups",
  "tab.bracket": "Bracket",
  "tab.ranking": "Ranking",
  "tab.statistics": "Statistics",
  "tab.print": "Print",
  "tab.overview": "Overview",

  // Phases (top-level navigation)
  "phase.prep": "Setup",
  "phase.live": "Live",
  "phase.results": "Results",
  "phase.prep.short": "Setup",
  "phase.live.short": "Live",
  "phase.results.short": "Result",

  // Dashboard
  "dashboard.title": "Overview",
  "dashboard.subtitle": "Live tournament status",
  "dashboard.currentRound": "Round {n} of {total}",
  "dashboard.currentRoundShort": "Round {n}",
  "dashboard.allMatches": "Matches total",
  "dashboard.progress": "{done} / {total} recorded",
  "dashboard.matchesDone": "{done} matches played",
  "dashboard.matchesLeft": "{count} pending",
  "dashboard.noResults": "No results yet",
  "dashboard.scheduleButton": "Generate schedule",
  "dashboard.viewAll": "View all rounds →",
  "dashboard.resting": "Resting this round",
  "dashboard.empty.title": "Tournament not started yet",
  "dashboard.empty.description": "Switch to Setup, add players, then generate the schedule.",
  "dashboard.empty.action": "Go to Setup",
  "dashboard.nextRound": "Next round",

  // Setup wizard
  "wizard.step.format": "Format",
  "wizard.step.details": "Details",
  "wizard.step.players": "Players",
  "wizard.title.format": "Which tournament format?",
  "wizard.title.details": "Tournament details",
  "wizard.title.players": "Who is playing?",
  "wizard.next": "Next →",
  "wizard.back": "← Back",
  "wizard.finish": "Done — let's go",
  "wizard.format.rotation.desc": "Rotating doubles · everyone plays every round",
  "wizard.format.groups.desc": "Round-robin within groups · clear standings",
  "wizard.format.knockout.desc": "Direct knockout · every match counts",
  "wizard.format.groups-ko.desc": "Group phase + KO finals · the classic",

  // Settings sheet
  "settings.title": "Settings",
  "settings.appearance": "Appearance",
  "settings.appearance.theme": "Theme",
  "settings.appearance.language": "Language",
  "settings.sync": "Live sync",
  "settings.data": "Tournament",
  "settings.export": "Export (JSON)",
  "settings.import": "Import",
  "settings.reset": "Reset tournament",
  "settings.newTournament": "+ Start new tournament",
  "settings.newTournamentHint":
    "Discards the current tournament and starts an empty one. Tip: export first.",
  "settings.newTournamentConfirm.title": "Start new tournament?",
  "settings.newTournamentConfirm.description":
    "Players, schedule and results of the current tournament will be discarded. This cannot be undone.",
  "settings.newTournamentConfirm.button": "Discard current",
  "settings.about": "About",
  "settings.aboutVersion": "Version {version}",
  "settings.openMenu": "Open settings",

  // Bulk import
  "players.bulkImport": "Add multiple at once",
  "players.bulkImport.title": "Paste multiple players",
  "players.bulkImport.description":
    'One name per line. Optionally add „;m" or „;f" for gender (e.g. „Anna;f").',
  "players.bulkImport.placeholder": "Anna\nBen;m\nCarla;f\n…",
  "players.bulkImport.add": "Add {count}",
  "entries.bulkImport.title": "Paste multiple teams",
  "entries.bulkImport.descriptionDoubles":
    'One team per line, members separated by „&" or „+" (e.g. „Anna & Ben").',
  "entries.bulkImport.descriptionSingles": "One name per line.",
  "entries.bulkImport.placeholderDoubles": "Anna & Ben\nCarla & Dan\n…",
  "entries.bulkImport.placeholderSingles": "Anna\nBen\nCarla\n…",

  // Score sheet
  "scoreSheet.title": "{teamA} vs. {teamB}",
  "scoreSheet.teamAScore": "Score {team}",
  "scoreSheet.clear": "Clear score",
  "scoreSheet.done": "Done",

  // Common
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.add": "Add",
  "common.remove": "Remove",
  "common.move": "Move",
  "common.sortAZ": "Sort A→Z",
  "common.notifications": "Notifications",
  "common.dash": "—",
  "common.vs": "vs.",

  // Theme toggle
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "theme.title": "Theme: {current} → {next}",
  "theme.label": "Switch theme (current: {current})",

  // Locale toggle
  "locale.label": "Language: {current}",
  "locale.title": "Switch language",
  "locale.de": "DE",
  "locale.en": "EN",

  // Format / mode / entry-format labels
  "format.rotation": "Rotation (Mixed Doubles)",
  "format.groups": "Group stage",
  "format.knockout": "Knockout",
  "format.groups-ko": "Groups + Knockout",
  "mode.mixed": "Mixed doubles",
  "mode.women": "Women's doubles",
  "mode.men": "Men's doubles",
  "mode.open": "Open doubles",
  "entryFormat.singles": "Singles",
  "entryFormat.doubles": "Doubles (fixed pairs)",
  "gender.female": "Woman",
  "gender.male": "Man",

  // Bell variants
  "bell.classic": "Classic",
  "bell.boxing": "Boxing bell",
  "bell.alarm": "Alarm",
  "bell.temple": "Temple bell",

  // Onboarding
  "onboarding.welcome.title": "Welcome to the Tennis Tournament Planner",
  "onboarding.welcome.body":
    "Schedule, round timer, score entry and award ceremony — all in your browser, no sign-up.",
  "onboarding.formats.title": "Four tournament formats",
  "onboarding.formats.body":
    "Rotation (Mixed/Women/Men/Open), groups, knockout, or groups + knockout. Pick the format on the setup page.",
  "onboarding.privacy.title": "Your data stays here",
  "onboarding.privacy.body":
    "Stored locally in your browser — nothing leaves your device. Optional: live-sync via code between devices, e.g. enter on phone, display on TV.",
  "onboarding.start.title": "Ready?",
  "onboarding.start.body":
    "Add players or teams, generate the schedule and enter results. The award ceremony is computed automatically.",
  "onboarding.back": "Back",
  "onboarding.skip": "Skip",
  "onboarding.next": "Next",
  "onboarding.import": "Import tournament",
  "onboarding.go": "Let's go",

  // Setup
  "setup.tournamentName": "Tournament name",
  "setup.format": "Tournament format",
  "setup.formatHint.rotation":
    "Rotation tournament with rotating mixed doubles. Every round fills all courts.",
  "setup.formatHint.groups": "Group stage with round-robin in each group. Standings per group.",
  "setup.formatHint.knockout":
    "Knockout from round 1. Bracket with byes if the participant count is not a power of 2.",
  "setup.formatHint.groups-ko":
    "Group stage + final knockout. The top N per group advance to the bracket.",
  "setup.courts": "Number of courts",
  "setup.rounds": "Number of rounds",
  "setup.doublesMode": "Doubles mode",
  "setup.partialFinal": "Allow last round to be partial so everyone plays the same amount",
  "setup.partialFinalHint":
    "Surplus rounds are dropped if everyone has already played the same amount.",
  "setup.perGenderRanking": "Also show separate rankings for women and men",
  "setup.perGenderRankingHint":
    "In the ranking view, separate tables per gender appear next to the overall ranking.",
  "setup.entryFormat": "Participant format",
  "setup.groupCount": "Number of groups",
  "setup.advancePerGroup": "Advancers per group",
  "setup.thirdPlace": "Play a 3rd-place match",
  "setup.thirdPlaceHint": "Semifinal losers play for third place.",
  "setup.exportJson": "Export (JSON)",
  "setup.import": "Import",
  "setup.reset": "Reset tournament",
  "setup.resetConfirm.title": "Reset tournament?",
  "setup.resetConfirm.description": "Players, teams and schedule will be lost.",
  "setup.resetConfirm.button": "Reset",

  // Players
  "players.namePlaceholder": "Enter name…",
  "players.count": "{count} players ({women} women, {men} men)",
  "players.sortWomenFirst": "Women first",
  "players.sortMenFirst": "Men first",
  "players.empty.title": "No players yet",
  "players.empty.description":
    'Type a name above and pick Woman/Man — then "Add". Drag-and-drop to reorder.',
  "players.empty.action": "Add the first player",
  "players.removeConfirm.title": 'Remove "{name}"?',

  // Entries
  "entries.descDoubles":
    "Add fixed doubles pairs. Order = seeding (1st = strongest team), reorderable via drag-and-drop.",
  "entries.descSingles": "Add singles players. Order = seeding, reorderable via drag-and-drop.",
  "entries.placeholder.name": "Name",
  "entries.placeholder.member": "Player {n}",
  "entries.countDoubles": "{count} pairs",
  "entries.countSingles": "{count} players",
  "entries.empty.titleDoubles": "No pairs added yet",
  "entries.empty.titleSingles": "No participants added yet",
  "entries.empty.description":
    'Enter the names above and click "Add". Drag-and-drop to change the seeding order.',
  "entries.empty.actionDoubles": "Add the first pair",
  "entries.empty.actionSingles": "Add the first entry",
  "entries.removeConfirm.title": 'Remove "{name}"?',

  // Schedule
  "schedule.generate": "Generate schedule",
  "schedule.generating": "Generating…",
  "schedule.modeSummary": "Mode: {mode} · {courts} courts · {rounds} rounds",
  "schedule.minPlayersWarning": "At least 4 players are required.",
  "schedule.empty.title": "No schedule generated yet",
  "schedule.empty.descriptionMin": "Add at least 4 players first.",
  "schedule.empty.descriptionGenerate": 'Click "Generate schedule" to start.',
  "schedule.statsSummary": "Statistics (matches / rests per player)",
  "schedule.statsCol.name": "Name",
  "schedule.statsCol.plays": "Matches",
  "schedule.statsCol.rests": "Rests",
  "schedule.statsCol.partners": "Different partners",
  "schedule.round": "Round {n}",
  "schedule.partial": "Partial round",
  "schedule.rest": "Resting: {names}",
  "schedule.court": "Court {n}",
  "schedule.statusComplete": "Recorded",
  "schedule.statusPartial": "Incomplete",
  "schedule.scoreAria": "Games {team}",

  // Groups
  "groups.empty.title": "No participants yet",
  "groups.empty.description":
    "Add participants on the Teams page first — groups will form automatically.",
  "groups.summary": "{count} participants · spread across {groups} groups",
  "groups.reshuffle": "Reshuffle groups",
  "groups.reshuffleConfirm.title": "Reshuffle groups?",
  "groups.reshuffleConfirm.description": "All recorded results will be lost.",
  "groups.reshuffleConfirm.button": "Reshuffle",
  "groups.groupHeading": "Group {letter} ({count} teams)",
  "groups.matches": "{count} matches",

  // Bracket
  "bracket.empty.title": "No participants yet",
  "bracket.empty.descriptionKo":
    "Add at least 2 participants on the Teams page — the bracket will be generated automatically.",
  "bracket.empty.descriptionGroupsKo":
    "Add participants first. The knockout bracket appears once the group stage is finished.",
  "bracket.summary": "{count} matches in the bracket",
  "bracket.summaryByes": "{count} matches in the bracket (incl. {byes} bye)",
  "bracket.summaryByesPlural": "{count} matches in the bracket (incl. {byes} byes)",
  "bracket.roundFinal": "Final",
  "bracket.roundFinalThird": "Final + 3rd-place match",
  "bracket.roundSemi": "Semifinals",
  "bracket.roundQuarter": "Quarterfinals",
  "bracket.roundEighth": "Round of 16",
  "bracket.roundOther": "Round {n} ({count} matches)",
  "bracket.thirdPlace": "3rd-place match",
  "bracket.bye": "Bye",
  "bracket.tieWarning": "Tie in knockout — please correct, otherwise no one advances.",

  // Ranking
  "ranking.startReveal": "🎉 Start award ceremony",
  "ranking.empty.scheduleTitle": "No schedule generated yet",
  "ranking.empty.scheduleDescription": 'Switch to the Schedule tab and click "Generate schedule".',
  "ranking.empty.resultsTitle": "No results entered yet",
  "ranking.empty.resultsDescription": "Enter results in the Schedule tab — the table updates live.",
  "ranking.empty.entriesTitle": "No participants added yet",
  "ranking.empty.entriesDescription":
    "Add participants on the Teams page — group standings appear automatically.",
  "ranking.empty.bracketTitle": "No bracket generated yet",
  "ranking.empty.bracketDescription": "Add participants — the bracket is generated automatically.",
  "ranking.matchesProgress": "{done} of {total} matches recorded",
  "ranking.liveSuffix": " — table updates live.",
  "ranking.overall": "Overall",
  "ranking.women": "Women",
  "ranking.men": "Men",
  "ranking.groupsHint": "Standings per group — sorted by wins, then game balance, then games won.",
  "ranking.groupHeading": "Group {letter}",
  "ranking.groupTablesToggle": "Group standings tables",
  "ranking.champion": "Champion",
  "ranking.finalPending":
    "🎯 Final not decided yet — the ceremony is waiting for the last results.",
  "ranking.finalist": "🥈 Finalist",
  "ranking.semiLosers": "🥉 Semifinal losers",
  "ranking.col.played": "Matches",
  "ranking.col.playedShort": "M",
  "ranking.col.wins": "Wins",
  "ranking.col.winsShort": "W",
  "ranking.col.draws": "Draws",
  "ranking.col.drawsShort": "D",
  "ranking.col.losses": "Losses",
  "ranking.col.lossesShort": "L",
  "ranking.col.gamesTitle": "Games won : games lost",
  "ranking.col.games": "Games +/–",
  "ranking.col.gamesShort": "Games",
  "ranking.col.diffTitle": "Difference of +/–",
  "ranking.col.diff": "Diff",
  "ranking.col.name": "Name",
  "ranking.podiumWinsDiff": "{wins} W · {diff}",

  // Reveal
  "reveal.notRotation": "Reveal mode is currently only available for rotation tournaments.",
  "reveal.exit": "Exit reveal mode",
  "reveal.heading": "🎉 Award ceremony",
  "reveal.fullscreen": "Fullscreen",
  "reveal.fullscreenExit": "Exit fullscreen",
  "reveal.fullscreenTitleEnter": "Fullscreen for TV display",
  "reveal.fullscreenTitleExit": "Exit fullscreen (Esc)",
  "reveal.tabsOverall": "Overall",
  "reveal.tabsWomen": "Women",
  "reveal.tabsMen": "Men",
  "reveal.notEnough": "Not enough players with results for a podium yet.",
  "reveal.podiumStat": "{wins} wins · {diff}",
  "reveal.controllerHint": "Drive the reveal — the display updates on all connected devices.",
  "reveal.unveil3": "🥉 Reveal 3rd place",
  "reveal.unveil2": "🥈 Reveal 2nd place",
  "reveal.unveil1": "🥇 Reveal 1st place",
  "reveal.restart": "Restart show",
  "reveal.dryrun": "Rehearsal",
  "reveal.jumpToWinner": "Jump straight to the winner",

  // Print
  "print.button": "Print",
  "print.tip": 'Tip: enable "Background graphics" in the print dialog if desired.',
  "print.empty.title": "Nothing to print yet",
  "print.empty.description":
    "Generate a schedule, group stage or bracket first — the printable layout appears here.",
  "print.subtitlePlayers": "{count} players",
  "print.subtitleTeams": "{count} teams",
  "print.subtitleCourts": "{count} courts",
  "print.subtitleRounds": "{count} rounds",
  "print.col.court": "Court",
  "print.col.teamA": "Team A",
  "print.col.teamB": "Team B",
  "print.col.result": "Result",
  "print.col.player": "Player",
  "print.col.winner": "Winner",
  "print.col.group": "Group",
  "print.col.round": "Round",
  "print.heading.groups": "Group stage",
  "print.heading.bracket": "Bracket",
  "print.heading.standings": "Final standings",
  "print.heading.groupWinners": "Group winners",
  "print.podium.gold": "🥇 Champion",
  "print.podium.silver": "🥈 Finalist",
  "print.podium.bronze": "🥉 3rd place",

  // Round timer
  "timer.bell": "Bell",
  "timer.duration": "Duration",
  "timer.start": "Start",
  "timer.continue": "Resume",
  "timer.pause": "Pause",
  "timer.reset": "Reset",
  "timer.silence": "🔕 Silence bell",
  "timer.test": "Test",
  "timer.testTitle": "Test the bell",
  "timer.expired.ringing": 'Time is up – the bell rings until you click "Silence bell".',
  "timer.expired.idle": 'Time is up. Hit "Reset" for the next round.',
  "timer.minutes": "min",

  // Sync
  "sync.heading": "Live sync (multi-device)",
  "sync.intro":
    "Share your tournament across multiple devices — e.g. enter on phone, display on TV. Data lives in Cloudflare KV for 7 days, then is deleted.",
  "sync.start": "Start sync for this tournament",
  "sync.starting": "Creating…",
  "sync.joinLabel": "...or join an existing code as a viewer:",
  "sync.joinPlaceholder": "e.g. K7P3MN",
  "sync.connect": "Connect",
  "sync.connecting": "Connecting…",
  "sync.ownerHint": "Share the code with display devices or let them scan the QR.",
  "sync.copyCode": "Copy code",
  "sync.codeCopied": "Code copied",
  "sync.copyFailed": "Could not copy",
  "sync.copyFailedDesc": "Select and copy the code manually.",
  "sync.qrAlt": "QR code to join",
  "sync.qrHint": "Scan on the display device — opens the app in read-only mode.",
  "sync.ownerToken": "Owner token (for backup)",
  "sync.ownerTokenHint":
    "Stored on this device. If lost, no one can write — create a new code in that case.",
  "sync.leave": "Stop sync (the code becomes invalid)",
  "sync.viewerConnected": "Connected to code {code} — display only.",
  "sync.disconnect": "Disconnect",
  "sync.status.disabled": "off",
  "sync.status.connecting": "connecting…",
  "sync.status.live": "live",
  "sync.status.offline": "offline",
  "sync.status.error": "error",
  "sync.copyToken": "Copy token",
  "sync.tokenCopied": "Token copied",
  "sync.error.network": "Network error",
  "sync.error.notFound": "Code not found",
  "sync.error.http": "HTTP {status}",

  // Scheduler & group warnings (returned as translated strings)
  "warn.genderToWomen.one": "Genders unbalanced — {count} man plays as a woman: {names}.",
  "warn.genderToWomen.other": "Genders unbalanced — {count} men play as women: {names}.",
  "warn.genderToMen.one": "Genders unbalanced — {count} woman plays as a man: {names}.",
  "warn.genderToMen.other": "Genders unbalanced — {count} women play as men: {names}.",
  "warn.noCourts": "Too few players for the “{mode}” mode. No court can be filled.",
  "warn.courtsReduced":
    "Only {possible} of {courts} courts can be filled — too few matching players for “{mode}”.",
  "warn.partialFinalRound":
    "Last round only partially filled so every player gets the same number of games.",
  "warn.groupTooSmall":
    "Each group should have at least 2 teams. With {count} participants in {groups} groups, a group will be empty or too small.",

  // Bracket slot/match labels (resolved bracket placeholders)
  "bracket.label.final": "Final",
  "bracket.label.thirdPlace": "Third-place match",
  "bracket.label.match": "Match {m} (round {r})",
  "bracket.label.winnerOf": "Winner of {match}",
  "bracket.label.loserOf": "Loser of {match}",
  "bracket.label.groupWinner": "Group winner {letter}",
  "bracket.label.groupRank": "Group {letter} · {rank}.",
  "bracket.label.bye": "🚶 Bye",

  // Confirm dialog defaults
  "confirm.cancel": "Cancel",
  "confirm.confirm": "Confirm",

  // Toasts (App.tsx)
  "toast.scheduleCreated": "Schedule created",
  "toast.scheduleHints": "{count} hint – see list.",
  "toast.scheduleHintsPlural": "{count} hints – see list.",
  "toast.scheduleFailed": "Schedule could not be created",
  "toast.importFailed": "Import failed",
  "toast.importFailedDesc": "Could not read the file — expected a valid JSON file.",
  "toast.loadConfirm.title": "Load tournament?",
  "toast.loadConfirm.description": 'Load "{name}" — the current tournament will be overwritten.',
  "toast.loadConfirm.button": "Load",
  "toast.loaded": "Tournament loaded",

  // Update prompt
  "update.title": "New version available",
  "update.description": "Reload the app to get the latest version.",
  "update.later": "Later",
  "update.reload": "Reload",

  // Install prompt
  "install.button": "Install",
  "install.title": "Install as an app (right-click to hide)",
  "install.label": "Install app",

  // Offline banner
  "offline.message":
    "Offline — changes are stored locally and will sync when the connection returns.",

  // Privacy dialog
  "privacy.title": "Privacy policy",
  "privacy.intro":
    "The Tennis Tournament Planner is a pure web/PWA app. We process as little data as possible and store, by default, exclusively on your device.",
  "privacy.h.local": "1. Local browser storage",
  "privacy.p.local":
    "Tournament data (players, schedule, results, settings) and your theme choice are stored in your browser localStorage. This data does not leave your device unless you enable live-sync. You can clear it any time via your browser settings.",
  "privacy.h.sync": "2. Optional live-sync (opt-in)",
  "privacy.p.sync":
    "When you enable live-sync, the current tournament is uploaded to a Cloudflare KV store and made available under a 6-character share code. Other devices can read or mirror the tournament with this code.",
  "privacy.li.sync1": "Only tournament data is transmitted – no personal account or contact data.",
  "privacy.li.sync2":
    "Player names you enter are part of the tournament data and are transmitted with it.",
  "privacy.li.sync3":
    "The data is auto-deleted 7 days after the last change (KV TTL). When the owner leaves a sync session, the entry is discarded immediately.",
  "privacy.li.sync4": "No sign-up, no tracking, no cookies, no analytics.",
  "privacy.h.hosting": "3. Hosting",
  "privacy.p.hosting":
    "The app is served via Cloudflare Workers. When you visit the site, Cloudflare processes technically necessary connection data (e.g. IP address, user-agent, timestamp) to provide and secure the service. We do not analyze or persistently store this data.",
  "privacy.h.external": "4. External resources",
  "privacy.p.external":
    "The app does not load external fonts, scripts or trackers. Only your device system fonts and the assets shipped with the app are used.",
  "privacy.h.pwa": "5. PWA / service worker",
  "privacy.p.pwa":
    "For offline support the app uses a service worker that stores program code and assets in the browser cache. No personal data is collected in the process.",
  "privacy.h.rights": "6. Your rights",
  "privacy.p.rights":
    "Since we do not store personal data on the server side (other than the tournament data you voluntarily upload via sync, which auto-expires after 7 days), no extended right of access, correction or deletion is usually required. You can remove local data via your browser settings; you can stop active sync sessions inside the app.",
  "privacy.h.contact": "7. Contact",
  "privacy.p.contact": "For questions about privacy, reach out to me at {email}.",

  // Statistics (NEW)
  "statistics.empty.title": "No results for statistics yet",
  "statistics.empty.description":
    "Enter results in the previous tabs — statistics are computed automatically.",
  "statistics.intro": "Detailed player profiles from the recorded results. Updates live.",
  "statistics.col.player": "Player",
  "statistics.col.played": "Matches",
  "statistics.col.wnl": "W/D/L",
  "statistics.col.winRate": "Win rate",
  "statistics.col.gamesFor": "+",
  "statistics.col.gamesAgainst": "–",
  "statistics.col.diff": "Diff",
  "statistics.col.bestPartner": "Best partner",
  "statistics.col.bestOpponent": "Easiest opponent",
  "statistics.partnerSummary": "{name} ({wins}/{played})",
  "statistics.opponentSummary": "{name} ({wins}/{played})",
  "statistics.noPartner": "—",
  "statistics.legendTitle": "Legend",
  "statistics.legend.played": "Matches = completed matches",
  "statistics.legend.wnl": "W = wins, D = draws, L = losses",
  "statistics.legend.winRate": "Win rate = wins ÷ matches",
  "statistics.legend.bestPartner":
    "Best partner = most-frequent winning partner (wins/shared matches)",
  "statistics.legend.bestOpponent":
    "Easiest opponent = most-defeated opponent (wins/matches against)",

  // Error boundary (last-resort crash screen)
  "errorBoundary.title": "Something went wrong",
  "errorBoundary.description":
    "The app hit an unexpected error. Your tournament data is stored locally — reload the page to continue.",
  "errorBoundary.reload": "Reload page",
};

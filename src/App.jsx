import React, { useEffect, useMemo, useRef, useState } from "react";
import WorkoutView from "./WorkoutView";
import CustomizeView from "./CustomizeView";
import HistoryView from "./HistoryView";
import AccountView from "./AccountView";
import { supabase } from "./supabase";

// Centers content and caps the max width without adding extra padding.
// (Important: WorkoutView already has its own side padding.)
function ContentWidth({ children }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "700px" }}>{children}</div>
    </div>
  );
}

export default function App() {
  // Stable device id (local-only identity)
  const getDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    return id;
  };
  const deviceId = useMemo(() => getDeviceId(), []);

  // Local timestamp for templates (per browser install)
  const TEMPLATES_TS_KEY = "templatesUpdatedAt";
  const hasLocalTemplatesTs = () =>
    localStorage.getItem(TEMPLATES_TS_KEY) !== null;

  const getLocalTemplatesTs = () => {
    const raw = localStorage.getItem(TEMPLATES_TS_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  };
  const setLocalTemplatesTs = (ms) => {
    localStorage.setItem(TEMPLATES_TS_KEY, String(ms));
  };

  // New local templates key (v2)
  const LOCAL_TEMPLATES_KEY = "workoutTemplatesV2";

  // Units preference (local-only for now)
  const UNITS_KEY = "ironloop:units:v1"; // "lb" | "kg"
  const readPreferredUnit = () => {
    try {
      const raw = localStorage.getItem(UNITS_KEY);
      if (raw === "kg" || raw === "lb") return raw;
    } catch {
      // ignore
    }
    return "lb";
  };
  const [preferredUnit, setPreferredUnit] = useState(() => readPreferredUnit());

  useEffect(() => {
    try {
      localStorage.setItem(UNITS_KEY, preferredUnit);
    } catch {
      // ignore
    }
  }, [preferredUnit]);

  // Hard clear supabase auth tokens (PWA-safe sign out)
  const clearSupabaseAuthFromStorage = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("sb-") && k.includes("auth-token")) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.error("Failed clearing Supabase auth keys:", e);
    }
  };

  // Auth state
  const [session, setSession] = useState(null);
  const userId = session?.user?.id || null;

  // UI state
  const [activeTab, setActiveTab] = useState("Workout");

  // FAQ view toggle (not a tab)
  const [showFaq, setShowFaq] = useState(false);

  // First-visit modal (per device/browser)
  const FIRST_VISIT_KEY = "ironloop:firstVisitSeen:v1";
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(FIRST_VISIT_KEY) === "true";
      if (!seen) setShowFirstVisitModal(true);
    } catch {
      // If storage is blocked, fail open (do not block the app).
      setShowFirstVisitModal(false);
    }
  }, []);

  const markFirstVisitSeen = () => {
    try {
      localStorage.setItem(FIRST_VISIT_KEY, "true");
    } catch {
      // ignore
    }
  };

  // Customize editor selection is independent from Workout tab selection
  // null means editor is closed (simplified Customize page)
  const [customizeEditingWorkoutId, setCustomizeEditingWorkoutId] =
    useState(null);

  // OTP auth UI state
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authStep, setAuthStep] = useState("email"); // "email" | "code"
  const [authMessage, setAuthMessage] = useState("");

  // Account: email change UI state
  const [emailChangeBusy, setEmailChangeBusy] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState("");

  // ---- Defaults ----
  // We store weights internally in lbs.
  // For a kg-first default experience, we set weights so the UI shows a nice round kg number.
  // 20 kg = 44.092452... lb. We store 44.1 so the kg display rounds to 20.0 cleanly.
  const DEFAULT_KG_WEIGHT_LB = 44.1;

  // Default A/B in lbs (legacy)
  const defaultWorkoutA_LB = [
    {
      name: "Squats",
      weight: 40,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Bench Press",
      weight: 40,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Mid Row",
      weight: 40,
      reps: 15,
      sets: 3,
      setsCompleted: [false, false, false],
    },
    {
      name: "Lat Pulldown",
      weight: 40,
      reps: 15,
      sets: 3,
      setsCompleted: [false, false, false],
    },
  ];

  const defaultWorkoutB_LB = [
    {
      name: "Squats",
      weight: 40,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Shoulder Press",
      weight: 40,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Back Extension",
      weight: 0,
      reps: 12,
      sets: 3,
      setsCompleted: [false, false, false],
    },
    {
      name: "Lat Pulldown",
      weight: 40,
      reps: 15,
      sets: 3,
      setsCompleted: [false, false, false],
    },
  ];

  // Default A/B for kg-first users (still stored in lbs internally)
  const defaultWorkoutA_KG = [
    {
      name: "Squats",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Bench Press",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Mid Row",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 15,
      sets: 3,
      setsCompleted: [false, false, false],
    },
    {
      name: "Lat Pulldown",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 15,
      sets: 3,
      setsCompleted: [false, false, false],
    },
  ];

  const defaultWorkoutB_KG = [
    {
      name: "Squats",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Shoulder Press",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 5,
      sets: 5,
      setsCompleted: [false, false, false, false, false],
    },
    {
      name: "Back Extension",
      weight: 0,
      reps: 12,
      sets: 3,
      setsCompleted: [false, false, false],
    },
    {
      name: "Lat Pulldown",
      weight: DEFAULT_KG_WEIGHT_LB,
      reps: 15,
      sets: 3,
      setsCompleted: [false, false, false],
    },
  ];

  const normalizeExercises = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.map((ex) => {
      const sets = Number(ex?.sets ?? 0) || 0;
      const current = Array.isArray(ex?.setsCompleted) ? ex.setsCompleted : [];
      const setsCompleted =
        sets > 0
          ? Array.from({ length: sets }, (_, i) => Boolean(current[i]))
          : [];

      return {
        name: ex?.name ?? "Exercise",
        reps: Number(ex?.reps ?? 0) || 0,
        sets: sets || 0,
        // stored internally in lbs (even if user displays kg)
        weight: ex?.weight === "" ? "" : Number(ex?.weight ?? 0) || 0,
        setsCompleted,
      };
    });
  };

  const normalizeWorkout = (w) => {
    const rawName = typeof w?.name === "string" ? w.name : "";
    return {
      id: String(w?.id || crypto.randomUUID()),
      name: rawName,
      exercises: normalizeExercises(w?.exercises),
    };
  };

  const normalizeTemplates = (tpl) => {
    const workouts = Array.isArray(tpl?.workouts) ? tpl.workouts : [];
    const normalized = workouts.map(normalizeWorkout);

    // Guarantee at least 1 workout exists
    if (normalized.length === 0) {
      return {
        workouts: [
          {
            id: "w_a",
            name: "Workout A",
            exercises: normalizeExercises(defaultWorkoutA_LB),
          },
          {
            id: "w_b",
            name: "Workout B",
            exercises: normalizeExercises(defaultWorkoutB_LB),
          },
        ],
      };
    }

    return { workouts: normalized };
  };

  const buildDefaultTemplatesForUnit = (unit) => {
    if (unit === "kg") {
      return normalizeTemplates({
        workouts: [
          { id: "w_a", name: "Workout A", exercises: defaultWorkoutA_KG },
          { id: "w_b", name: "Workout B", exercises: defaultWorkoutB_KG },
        ],
      });
    }
    return normalizeTemplates({
      workouts: [
        { id: "w_a", name: "Workout A", exercises: defaultWorkoutA_LB },
        { id: "w_b", name: "Workout B", exercises: defaultWorkoutB_LB },
      ],
    });
  };

  const buildTemplatesFromLegacyLocal = () => {
    const savedA = localStorage.getItem("workoutAExercises");
    const savedB = localStorage.getItem("workoutBExercises");
    const a = savedA ? JSON.parse(savedA) : defaultWorkoutA_LB;
    const b = savedB ? JSON.parse(savedB) : defaultWorkoutB_LB;

    return normalizeTemplates({
      workouts: [
        { id: "w_a", name: "Workout A", exercises: a },
        { id: "w_b", name: "Workout B", exercises: b },
      ],
    });
  };

  const loadLocalTemplates = (unit) => {
    const raw = localStorage.getItem(LOCAL_TEMPLATES_KEY);
    if (raw) {
      try {
        return normalizeTemplates(JSON.parse(raw));
      } catch {
        // fall through
      }
    }

    // If v2 not present, migrate from legacy keys (always lb-based legacy)
    const legacyA = localStorage.getItem("workoutAExercises");
    const legacyB = localStorage.getItem("workoutBExercises");
    if (legacyA || legacyB) return buildTemplatesFromLegacyLocal();

    // Truly new user: choose defaults that match current unit preference
    return buildDefaultTemplatesForUnit(unit);
  };

  const [templates, setTemplates] = useState(() =>
    loadLocalTemplates(preferredUnit)
  );

  // Workout selection (now by workout id)
  const getInitialWorkoutId = () => {
    const last = localStorage.getItem("lastWorkoutId");
    const list = templates?.workouts || [];
    if (last && list.some((w) => w.id === last)) return last;
    return list[0]?.id || "w_a";
  };
  const [currentWorkoutId, setCurrentWorkoutId] = useState(() =>
    getInitialWorkoutId()
  );

  // Local history
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist local templates + history
  useEffect(() => {
    localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  // Keep currentWorkoutId valid if workouts are added/removed
  useEffect(() => {
    const list = templates?.workouts || [];
    if (list.length === 0) return;
    const exists = list.some((w) => w.id === currentWorkoutId);
    if (!exists) setCurrentWorkoutId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);

  // Keep customizeEditingWorkoutId valid (or close editor) if workouts are removed
  useEffect(() => {
    if (!customizeEditingWorkoutId) return;
    const list = templates?.workouts || [];
    const exists = list.some((w) => w.id === customizeEditingWorkoutId);
    if (!exists) setCustomizeEditingWorkoutId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);

  // ---- Default detection + swapping on unit change ----
  const isAllFalse = (arr) =>
    Array.isArray(arr) && arr.every((v) => v === false);

  const exercisesEqual = (a, b) => {
    const A = Array.isArray(a) ? a : [];
    const B = Array.isArray(b) ? b : [];
    if (A.length !== B.length) return false;

    for (let i = 0; i < A.length; i++) {
      const exA = A[i] || {};
      const exB = B[i] || {};

      if ((exA.name || "") !== (exB.name || "")) return false;
      if (Number(exA.reps || 0) !== Number(exB.reps || 0)) return false;
      if (Number(exA.sets || 0) !== Number(exB.sets || 0)) return false;
      if (Number(exA.weight || 0) !== Number(exB.weight || 0)) return false;

      // If they've tapped sets or changed anything, do not overwrite
      if (!isAllFalse(exA.setsCompleted)) return false;
      if (!isAllFalse(exB.setsCompleted)) return false;

      const lenA = Array.isArray(exA.setsCompleted)
        ? exA.setsCompleted.length
        : 0;
      const lenB = Array.isArray(exB.setsCompleted)
        ? exB.setsCompleted.length
        : 0;
      if (lenA !== lenB) return false;
    }

    return true;
  };

  const getWorkoutById = (tpl, id) => {
    const list = Array.isArray(tpl?.workouts) ? tpl.workouts : [];
    return list.find((w) => String(w?.id) === String(id)) || null;
  };

  const isUntouchedDefaultTemplatesForUnit = (tpl, unit) => {
    const wA = getWorkoutById(tpl, "w_a");
    const wB = getWorkoutById(tpl, "w_b");
    if (!wA || !wB) return false;

    // If user renamed workouts, do not overwrite
    if ((wA?.name || "") !== "Workout A") return false;
    if ((wB?.name || "") !== "Workout B") return false;

    const exA = Array.isArray(wA?.exercises) ? wA.exercises : [];
    const exB = Array.isArray(wB?.exercises) ? wB.exercises : [];

    if (unit === "kg") {
      return (
        exercisesEqual(exA, defaultWorkoutA_KG) &&
        exercisesEqual(exB, defaultWorkoutB_KG)
      );
    }

    return (
      exercisesEqual(exA, defaultWorkoutA_LB) &&
      exercisesEqual(exB, defaultWorkoutB_LB)
    );
  };

  // Track previous unit so we can detect direction of toggle
  const prevUnitRef = useRef(preferredUnit);

  useEffect(() => {
    const prev = prevUnitRef.current;
    const next = preferredUnit;
    if (prev === next) return;

    // Only auto-swap for signed-out, brand-new users with zero history.
    if (userId) {
      prevUnitRef.current = next;
      return;
    }
    if ((history || []).length > 0) {
      prevUnitRef.current = next;
      return;
    }

    // lb -> kg: if still on untouched lb defaults, swap to kg defaults
    if (prev === "lb" && next === "kg") {
      if (isUntouchedDefaultTemplatesForUnit(templates, "lb")) {
        const kgTemplates = buildDefaultTemplatesForUnit("kg");
        setTemplates(kgTemplates);
        setCurrentWorkoutId("w_a");
        localStorage.setItem("lastWorkoutId", "w_a");
      }
    }

    // kg -> lb: if still on untouched kg defaults, swap back to lb defaults
    if (prev === "kg" && next === "lb") {
      if (isUntouchedDefaultTemplatesForUnit(templates, "kg")) {
        const lbTemplates = buildDefaultTemplatesForUnit("lb");
        setTemplates(lbTemplates);
        setCurrentWorkoutId("w_a");
        localStorage.setItem("lastWorkoutId", "w_a");
      }
    }

    prevUnitRef.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredUnit]);

  // Derive current workout + helpers to update exercises
  const currentWorkout = useMemo(() => {
    const list = templates?.workouts || [];
    return list.find((w) => w.id === currentWorkoutId) || list[0] || null;
  }, [templates, currentWorkoutId]);

  const exercises = currentWorkout?.exercises || [];

  const setExercises = (newExercises) => {
    setTemplates((prev) => {
      const list = prev?.workouts || [];
      const updated = list.map((w) => {
        if (w.id !== currentWorkoutId) return w;
        return { ...w, exercises: newExercises };
      });
      return { workouts: updated };
    });
  };

  // Ensure local workouts have a stable client_id
  const ensureClientIds = (items) => {
    let changed = false;
    const updated = items.map((w) => {
      if (!w?.client_id) {
        changed = true;
        return { ...w, client_id: crypto.randomUUID() };
      }
      return w;
    });
    return { updated, changed };
  };

  // Merge remote + local with dedupe by client_id (remote wins conflicts)
  const mergeHistories = (localItems, remoteItems) => {
    const map = new Map();
    for (const w of remoteItems) if (w?.client_id) map.set(w.client_id, w);
    for (const w of localItems)
      if (w?.client_id && !map.has(w.client_id)) map.set(w.client_id, w);

    const merged = Array.from(map.values());
    merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return merged;
  };

  // Auth bootstrap + listener
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession || null);
      }
    );

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Fetch remote workouts (history)
  const fetchRemoteHistory = async (uid) => {
    const { data: remoteRows, error } = await supabase
      .from("workouts")
      .select(
        "id, client_id, workout_type, template_id, performed_at, exercises, notes"
      )
      .eq("user_id", uid)
      .order("performed_at", { ascending: false });

    if (error) {
      console.error("Supabase select failed:", error);
      return [];
    }

    return (remoteRows || [])
      .map((row) => ({
        client_id: row.client_id || String(row.id),
        type: row.workout_type || "",
        template_id: row.template_id || null,
        date: row.performed_at,
        exercises: row.exercises || [],
        notes: row.notes || "",
      }))
      .filter((w) => Boolean(w.client_id));
  };

  // Templates: fetch row with best-effort support for both schemas
  const fetchTemplatesRow = async (uid) => {
    const tryNew = await supabase
      .from("workout_templates")
      .select("templates, updated_at, workout_a, workout_b")
      .eq("user_id", uid)
      .maybeSingle();

    if (!tryNew.error) return tryNew.data || null;

    const msg = String(tryNew.error?.message || "");
    const looksLikeMissingColumn =
      msg.toLowerCase().includes("column") &&
      msg.toLowerCase().includes("templates");

    if (!looksLikeMissingColumn) {
      console.error("Templates select failed:", tryNew.error);
      return null;
    }

    const legacy = await supabase
      .from("workout_templates")
      .select("workout_a, workout_b, updated_at")
      .eq("user_id", uid)
      .maybeSingle();

    if (legacy.error) {
      console.error("Templates select failed:", legacy.error);
      return null;
    }
    return legacy.data || null;
  };

  const templatesToLegacyAB = (tpl) => {
    const list = tpl?.workouts || [];
    const a = list[0]?.exercises || normalizeExercises(defaultWorkoutA_LB);
    const b = list[1]?.exercises || normalizeExercises(defaultWorkoutB_LB);
    return { workout_a: a, workout_b: b };
  };

  const upsertTemplates = async (uid, tpl, updatedAtIso) => {
    const normalized = normalizeTemplates(tpl);
    const legacy = templatesToLegacyAB(normalized);

    const payloadNew = {
      user_id: uid,
      templates: normalized,
      workout_a: legacy.workout_a,
      workout_b: legacy.workout_b,
      updated_at: updatedAtIso || new Date().toISOString(),
    };

    const resNew = await supabase
      .from("workout_templates")
      .upsert(payloadNew, { onConflict: "user_id" });
    if (!resNew.error) return;

    const msg = String(resNew.error?.message || "");
    const looksLikeMissingColumn =
      msg.toLowerCase().includes("column") &&
      msg.toLowerCase().includes("templates");

    if (!looksLikeMissingColumn) {
      console.error("Templates upsert failed:", resNew.error);
      return;
    }

    const payloadLegacy = {
      user_id: uid,
      workout_a: legacy.workout_a,
      workout_b: legacy.workout_b,
      updated_at: updatedAtIso || new Date().toISOString(),
    };

    const resLegacy = await supabase
      .from("workout_templates")
      .upsert(payloadLegacy, { onConflict: "user_id" });

    if (resLegacy.error)
      console.error("Templates upsert failed:", resLegacy.error);
  };

  // Control flags so we don't save immediately after loading from cloud
  const templatesReadyRef = useRef(false);
  const skipNextTemplateSaveRef = useRef(false);

  // On login: history sync + template reconcile
  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      try {
        // ---- HISTORY ----
        const { updated: localWithIds, changed } = ensureClientIds(history);
        const localFinal = changed ? localWithIds : history;
        if (changed) setHistory(localWithIds);

        try {
          await supabase.rpc("claim_workouts", { p_device_id: deviceId });
        } catch {
          // ignore if missing
        }

        const uploadFlagKey = `supabaseUploadedHistory:${userId}:${deviceId}`;
        const alreadyUploaded = localStorage.getItem(uploadFlagKey) === "true";

        if (!alreadyUploaded) {
          const payload = (localFinal || [])
            .filter((w) => w && w.client_id)
            .map((w) => ({
              user_id: userId,
              device_id: deviceId,
              client_id: w.client_id,
              workout_type: w.type || "",
              template_id: w.template_id || null,
              performed_at: w.date,
              exercises: w.exercises || [],
              notes: w.notes || "",
            }));

          if (payload.length > 0) {
            const { error: upsertErr } = await supabase
              .from("workouts")
              .upsert(payload, { onConflict: "client_id" });

            if (upsertErr)
              console.error(
                "Supabase local history upload failed:",
                upsertErr
              );
            else localStorage.setItem(uploadFlagKey, "true");
          } else {
            localStorage.setItem(uploadFlagKey, "true");
          }
        }

        const remoteHistory = await fetchRemoteHistory(userId);
        const merged = mergeHistories(localFinal || [], remoteHistory);
        setHistory(merged);

        // ---- TEMPLATES ----
        templatesReadyRef.current = false;

        const row = await fetchTemplatesRow(userId);
        const localHasTs = hasLocalTemplatesTs();
        const localTs = localHasTs ? getLocalTemplatesTs() : 0;

        const localTpl = normalizeTemplates(templates);

        if (!row) {
          const nowIso = new Date().toISOString();
          await upsertTemplates(userId, localTpl, nowIso);
          setLocalTemplatesTs(Date.now());
          templatesReadyRef.current = true;
        } else {
          const cloudMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;

          let cloudTpl = null;

          if (row.templates && typeof row.templates === "object") {
            cloudTpl = normalizeTemplates(row.templates);
          } else if (row.workout_a || row.workout_b) {
            cloudTpl = normalizeTemplates({
              workouts: [
                { id: "w_a", name: "Workout A", exercises: row.workout_a || [] },
                { id: "w_b", name: "Workout B", exercises: row.workout_b || [] },
              ],
            });
          } else {
            cloudTpl = normalizeTemplates(null);
          }

          if (!localHasTs) {
            skipNextTemplateSaveRef.current = true;
            setTemplates(cloudTpl);
            setLocalTemplatesTs(cloudMs || Date.now());
            templatesReadyRef.current = true;
          } else if ((cloudMs || 0) >= (localTs || 0)) {
            skipNextTemplateSaveRef.current = true;
            setTemplates(cloudTpl);
            setLocalTemplatesTs(cloudMs || Date.now());
            templatesReadyRef.current = true;
          } else {
            const nowIso = new Date().toISOString();
            await upsertTemplates(userId, localTpl, nowIso);
            setLocalTemplatesTs(Date.now());
            templatesReadyRef.current = true;
          }
        }

        setAuthMessage("");
        setAuthStep("email");
        setAuthCode("");
      } catch (err) {
        console.error("Login sync failed:", err);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced template save to Supabase (only after initial reconcile)
  const templateSaveTimerRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    if (!templatesReadyRef.current) return;

    if (skipNextTemplateSaveRef.current) {
      skipNextTemplateSaveRef.current = false;
      return;
    }

    if (templateSaveTimerRef.current) clearTimeout(templateSaveTimerRef.current);

    setLocalTemplatesTs(Date.now());

    templateSaveTimerRef.current = setTimeout(() => {
      const tpl = normalizeTemplates(templates);
      upsertTemplates(userId, tpl, new Date().toISOString());
    }, 700);

    return () => {
      if (templateSaveTimerRef.current)
        clearTimeout(templateSaveTimerRef.current);
    };
  }, [userId, templates]);

  // Send OTP code
  const sendCode = async () => {
    setAuthMessage("");
    const email = authEmail.trim();
    if (!email) {
      setAuthMessage("Enter an email address.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthStep("code");
    setAuthMessage("Enter the code sent to your email.");
  };

  // Verify OTP code
  const verifyCode = async () => {
    setAuthMessage("");
    const email = authEmail.trim();
    const token = authCode.trim();

    if (!email) {
      setAuthMessage("Enter an email address.");
      return;
    }
    if (!token) {
      setAuthMessage("Enter the code from your email.");
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }
  };

  // Bulletproof sign out for PWAs (clears local tokens + reload)
  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.error("signOut error:", e);
    }

    clearSupabaseAuthFromStorage();

    setSession(null);
    setAuthMessage("");
    setAuthStep("email");
    setAuthCode("");
    templatesReadyRef.current = false;
    skipNextTemplateSaveRef.current = false;

    window.location.reload();
  };

  // Masks email for screenshots: ex*****@em***.com
  const maskEmail = (email) => {
    if (!email || typeof email !== "string") return "";

    const atIndex = email.indexOf("@");
    if (atIndex === -1) return "*****";

    const local = email.slice(0, atIndex);
    const domainFull = email.slice(atIndex + 1);
    const dotIndex = domainFull.lastIndexOf(".");

    const domain = dotIndex === -1 ? domainFull : domainFull.slice(0, dotIndex);
    const tld = dotIndex === -1 ? "" : domainFull.slice(dotIndex);

    const maskPart = (str, keepStart, keepEnd, maskChar = "*") => {
      if (!str) return "";
      if (str.length <= keepStart + keepEnd)
        return maskChar.repeat(Math.max(1, str.length));
      const start = str.slice(0, keepStart);
      const end = keepEnd > 0 ? str.slice(-keepEnd) : "";
      const middleLen = Math.max(1, str.length - keepStart - keepEnd);
      return start + maskChar.repeat(middleLen) + end;
    };

    const maskedLocal = maskPart(local, 2, 0);
    const maskedDomain = maskPart(domain, 2, 0);

    return `${maskedLocal}@${maskedDomain}${tld}`;
  };

  const primaryButtonStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    backgroundColor: "#8b5cf6",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    borderRadius: "8px",
    boxSizing: "border-box",
  };

  const rotateToNextWorkout = () => {
    const list = templates?.workouts || [];
    if (list.length === 0) return;
    const idx = list.findIndex((w) => w.id === currentWorkoutId);
    const next = list[(idx + 1) % list.length];
    if (next?.id) setCurrentWorkoutId(next.id);
  };

  // Finish workout
  const finishWorkout = async (exercisesSnapshot) => {
    const workoutId = currentWorkout?.id || currentWorkoutId;
    const workoutName = currentWorkout?.name || "";

    const newWorkout = {
      client_id: crypto.randomUUID(),
      type: workoutName,
      template_id: workoutId,
      date: new Date(),
      exercises: (exercisesSnapshot || []).map((ex) => ({ ...ex })),
      notes: "",
    };

    setHistory((prev) => [newWorkout, ...(prev || [])]);
    localStorage.setItem("lastWorkoutId", workoutId);

    if (userId) {
      try {
        const { error } = await supabase.from("workouts").insert({
          user_id: userId,
          device_id: deviceId,
          client_id: newWorkout.client_id,
          workout_type: workoutName || "",
          template_id: workoutId,
          performed_at: newWorkout.date,
          exercises: newWorkout.exercises,
          notes: "",
        });

        if (error) console.error("Supabase insert failed:", error);
      } catch (err) {
        console.error("Supabase insert failed:", err);
      }
    }

    const resetExercises = (exercisesSnapshot || []).map((ex) => ({
      ...ex,
      setsCompleted: Array(
        ex.sets || (ex.setsCompleted ? ex.setsCompleted.length : 0)
      ).fill(false),
    }));
    setExercises(resetExercises);

    rotateToNextWorkout();
  };

  // Update notes
  const updateWorkoutNotes = async (index, value) => {
    setHistory((prev) => {
      const copy = [...(prev || [])];
      if (!copy[index]) return prev;
      copy[index] = { ...copy[index], notes: value };
      return copy;
    });

    if (!userId) return;

    try {
      const workout = history[index];
      const clientId = workout?.client_id;
      if (!clientId) return;

      const { error } = await supabase
        .from("workouts")
        .update({ notes: value })
        .eq("user_id", userId)
        .eq("client_id", clientId);

      if (error) console.error("Supabase notes update failed:", error);
    } catch (err) {
      console.error("Supabase notes update failed:", err);
    }
  };

  // Delete workout
  const deleteWorkout = async (index) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workout?"
    );
    if (!confirmed) return;

    const workoutToDelete = history[index];
    setHistory((prev) => (prev || []).filter((_, i) => i !== index));

    if (!userId) return;

    try {
      const clientId = workoutToDelete?.client_id;
      if (!clientId) return;

      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("user_id", userId)
        .eq("client_id", clientId);

      if (error) console.error("Supabase delete failed:", error);
    } catch (err) {
      console.error("Supabase delete failed:", err);
    }
  };

  // Account: refresh session (useful after confirming email change)
  const refreshAuthStatus = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
      setEmailChangeMessage("");
    } catch {
      // ignore
    }
  };

  // Account: request email change (sends code to new email)
  const requestEmailChange = async (nextEmailRaw) => {
    const nextEmail = String(nextEmailRaw || "").trim();
    setEmailChangeMessage("");

    if (!userId) {
      setEmailChangeMessage("Sign in first.");
      return;
    }
    if (!nextEmail) {
      setEmailChangeMessage("Enter a new email address.");
      return;
    }
    if (nextEmail.includes(" ")) {
      setEmailChangeMessage("Email addresses cannot contain spaces.");
      return;
    }

    const currentEmail = String(session?.user?.email || "").trim();
    if (currentEmail && currentEmail.toLowerCase() === nextEmail.toLowerCase()) {
      setEmailChangeMessage("That is already your current email.");
      return;
    }

    setEmailChangeBusy(true);
    try {
      // No redirect flow: template should send {{ .Token }} and user confirms in-app.
      const { error } = await supabase.auth.updateUser({ email: nextEmail });

      if (error) {
        setEmailChangeMessage(error.message || "Email update failed.");
      } else {
        setEmailChangeMessage("Enter the code sent to your new email.");
      }
    } catch (e) {
      console.error("Email update failed:", e);
      setEmailChangeMessage("Email update failed.");
    } finally {
      setEmailChangeBusy(false);
    }
  };

  // Account: verify email change code (token-based, PWA-friendly)
  const verifyEmailChangeCode = async (nextEmailRaw, codeRaw) => {
    const nextEmail = String(nextEmailRaw || "").trim();
    const token = String(codeRaw || "").trim();

    setEmailChangeMessage("");

    if (!userId) {
      setEmailChangeMessage("Sign in first.");
      return;
    }
    if (!nextEmail) {
      setEmailChangeMessage("Enter a new email address.");
      return;
    }
    if (!token) {
      setEmailChangeMessage("Enter the code from your email.");
      return;
    }

    setEmailChangeBusy(true);
    try {
      // Supabase uses a dedicated OTP type for email change confirmation.
      // This keeps the user inside the PWA and avoids link redirects.
      const { error } = await supabase.auth.verifyOtp({
        email: nextEmail,
        token,
        type: "email_change",
      });

      if (error) {
        setEmailChangeMessage(error.message || "Code verification failed.");
      } else {
        setEmailChangeMessage("Email updated.");
        await refreshAuthStatus();
      }
    } catch (e) {
      console.error("Email change code verify failed:", e);
      setEmailChangeMessage("Code verification failed.");
    } finally {
      setEmailChangeBusy(false);
    }
  };

  const FooterFaqLink = () => (
    <ContentWidth>
      <div
        style={{
          width: "100%",
          padding: "1.25rem 1rem 2rem",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setShowFaq(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "0.25rem 0.5rem",
          }}
        >
          FAQ
        </button>
      </div>
    </ContentWidth>
  );

  const FaqView = () => {
    const itemStyle = { margin: "0 0 1.5rem 0" };
    const titleStyle = { margin: "0 0 0.5rem 0" };
    const paragraphStyle = { margin: "0.5rem 0" };

    return (
      <div
        style={{
          width: "100%",
          padding: "0 1rem 2rem",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "700px", textAlign: "left" }}>
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setShowFaq(false)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: "#fff",
                borderRadius: "8px",
                padding: "0.5rem 0.9rem",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>

          <h2 style={{ textAlign: "center", margin: "1rem 0" }}>FAQ</h2>

          <div style={{ color: "#fff", lineHeight: 1.6 }}>
            <div style={itemStyle}>
              <h3 style={titleStyle}>
                How do I add IronLoop to my iPhone's home screen?
              </h3>
              <p style={paragraphStyle}>
                You can add IronLoop to your home screen using Safari.
              </p>
              <ol style={{ margin: "0.5rem 0 0.5rem 1.25rem" }}>
                <li>Open Safari on your iPhone</li>
                <li>Go to the IronLoop website</li>
                <li>
                  Tap the button with 3 dots in the bottom right, then the Share
                  button (the square with the upward arrow)
                </li>
                <li>Tap More, then Add to Home Screen</li>
                <li>Tap Add to confirm</li>
              </ol>
              <p style={paragraphStyle}>
                IronLoop will now appear like a regular app on your home screen
                and can be launched by tapping the icon.
              </p>
            </div>

            <div style={itemStyle}>
              <h3 style={titleStyle}>Does it work on other browsers or devices?</h3>
              <p style={paragraphStyle}>
                IronLoop works in modern browsers on mobile and desktop, but
                looks best on a phone screen.
              </p>
            </div>

            <div style={itemStyle}>
              <h3 style={titleStyle}>Do I need an account to use IronLoop?</h3>
              <p style={paragraphStyle}>
                No. You can use IronLoop without signing in.
              </p>
            </div>

            <div style={itemStyle}>
              <h3 style={titleStyle}>What happens if I don’t sign in?</h3>
              <p style={paragraphStyle}>If you stay signed out:</p>
              <ul style={{ margin: "0.5rem 0 0.5rem 1.25rem" }}>
                <li>
                  Your workout templates and history are stored locally in your
                  browser
                </li>
                <li>Everything works offline</li>
                <li>Your data stays on that device only</li>
              </ul>
              <p style={paragraphStyle}>
                If your browser storage is cleared or you switch devices, that
                local data may be lost.
              </p>
            </div>

            <div style={itemStyle}>
              <h3 style={titleStyle}>What happens when I sign in?</h3>
              <p style={paragraphStyle}>When you sign in with email:</p>
              <ul style={{ margin: "0.5rem 0 0.5rem 1.25rem" }}>
                <li>Your workouts and templates are saved to the cloud</li>
                <li>Your data syncs across devices</li>
                <li>You can switch phones or browsers without losing history</li>
              </ul>
              <p style={paragraphStyle}>
                Signing in is optional and can be done at any time.
              </p>
            </div>

            <div style={itemStyle}>
              <h3 style={titleStyle}>Is my data private?</h3>
              <p style={paragraphStyle}>
                IronLoop does not sell or share your data.
                <br />
                If you sign in, your data is stored securely and associated only
                with your account. If you do not sign in, your data never leaves
                your device.
              </p>
            </div>

            <div style={itemStyle}>
              <h3 style={titleStyle}>Can IronLoop work offline?</h3>
              <p style={paragraphStyle}>
                Yes.
                <br />
                IronLoop is designed to work offline. You can start workouts,
                complete sets, and log sessions without an internet connection.
                If you are signed in, your data will sync the next time you’re
                online.
              </p>
            </div>

            <div style={{ margin: "0" }}>
              <h3 style={titleStyle}>Still have a question?</h3>
              <p style={paragraphStyle}>DM @stinkeater on discord</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FirstVisitModal = () => {
    if (!showFirstVisitModal) return null;

    const closeNotNow = () => {
      markFirstVisitSeen();
      setShowFirstVisitModal(false);
    };

    const openFaqNow = () => {
      markFirstVisitSeen();
      setShowFirstVisitModal(false);
      setShowFaq(true);
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 9999,
        }}
        onClick={closeNotNow}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "1rem",
            boxSizing: "border-box",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Quick tip</div>

          <div
            style={{
              color: "#aaa",
              marginTop: "0.5rem",
              lineHeight: 1.5,
              textAlign: "center",
              maxWidth: "420px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            If you add IronLoop to your iPhone's home screen, it will launch
            like an app and perform better.
            <br />
            <br />
            Check out the FAQ for instructions.
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "1rem",
              justifyContent: "center",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={closeNotNow}
              style={{
                backgroundColor: "#121212",
                border: "1px solid #333",
                color: "#fff",
                borderRadius: "8px",
                padding: "0.6rem 1rem",
                cursor: "pointer",
              }}
            >
              Not now
            </button>

            <button
              onClick={openFaqNow}
              style={{
                backgroundColor: "#8b5cf6",
                border: "none",
                color: "#fff",
                borderRadius: "8px",
                padding: "0.6rem 1rem",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Open FAQ
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "#121212",
        color: "#fff",
        overflowX: "hidden",
      }}
    >
      <FirstVisitModal />

      <h1
        className="ironloop-title"
        style={{ textAlign: "center", margin: "1rem 0" }}
      >
        IronLoop
      </h1>

      {/* Auth banner (intentionally visible on all pages) */}
      <div
        style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "#1a1a1a",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {userId ? (
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#aaa", overflowWrap: "anywhere" }}>
              Signed in as: {maskEmail(session?.user?.email || "")}
            </div>
            <button onClick={signOut}>Sign out</button>
          </div>
        ) : authStep === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
            style={{
              width: "100%",
              maxWidth: "420px",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <input
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
            <button type="submit" style={primaryButtonStyle}>
              Send code to sign in
            </button>
            {authMessage && (
              <div style={{ color: "#aaa", textAlign: "center" }}>
                {authMessage}
              </div>
            )}
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyCode();
            }}
            style={{
              width: "100%",
              maxWidth: "420px",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <input
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Enter code"
              style={inputStyle}
            />
            <button type="submit" style={primaryButtonStyle}>
              Verify code
            </button>
            {authMessage && (
              <div style={{ color: "#aaa", textAlign: "center" }}>
                {authMessage}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {["Workout", "History", "Customize", "Account"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setShowFaq(false);
              setActiveTab(tab);
              if (tab !== "Customize") setCustomizeEditingWorkoutId(null);
            }}
            style={{
              backgroundColor: activeTab === tab ? "#8b5cf6" : "#1a1a1a",
              color: "#fff",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ width: "100%" }}>
        {showFaq ? (
          <FaqView />
        ) : (
          <>
            <ContentWidth>
              {activeTab === "Workout" && (
                <WorkoutView
                  workouts={templates.workouts}
                  currentWorkoutId={currentWorkoutId}
                  setCurrentWorkoutId={(id) => {
                    setCurrentWorkoutId(id);
                    localStorage.setItem("lastWorkoutId", id);
                  }}
                  currentWorkoutName={currentWorkout?.name || "Workout"}
                  exercises={exercises}
                  setExercises={setExercises}
                  finishWorkout={finishWorkout}
                  preferredUnit={preferredUnit}
                />
              )}

              {activeTab === "History" && (
                <HistoryView
                  history={history}
                  deleteWorkout={deleteWorkout}
                  updateWorkoutNotes={updateWorkoutNotes}
                  preferredUnit={preferredUnit}
                />
              )}

              {activeTab === "Customize" && (
                <CustomizeView
                  workouts={templates.workouts}
                  setWorkouts={(nextWorkouts) =>
                    setTemplates({ workouts: nextWorkouts.map(normalizeWorkout) })
                  }
                  selectedWorkoutId={customizeEditingWorkoutId}
                  setSelectedWorkoutId={setCustomizeEditingWorkoutId}
                  preferredUnit={preferredUnit}
                />
              )}

              {activeTab === "Account" && (
                <AccountView
                  preferredUnit={preferredUnit}
                  setPreferredUnit={setPreferredUnit}
                  isSignedIn={Boolean(userId)}
                  sessionEmailMasked={maskEmail(session?.user?.email || "")}
                  onRequestEmailChange={requestEmailChange}
                  onVerifyEmailChangeCode={verifyEmailChangeCode}
                  emailChangeBusy={emailChangeBusy}
                  emailChangeMessage={emailChangeMessage}
                  onRefreshAuthStatus={refreshAuthStatus}
                />
              )}
            </ContentWidth>

            <FooterFaqLink />
          </>
        )}
      </div>
    </div>
  );
}

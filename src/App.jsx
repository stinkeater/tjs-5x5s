import React, { useEffect, useMemo, useState } from "react";
import WorkoutView from "./WorkoutView";
import CustomizeView from "./CustomizeView";
import HistoryView from "./HistoryView";
import { supabase } from "./supabase";

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

  // Auth state
  const [session, setSession] = useState(null);
  const userId = session?.user?.id || null;

  // UI state
  const [activeTab, setActiveTab] = useState("Workout");
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Workout selection
  const [currentWorkoutType, setCurrentWorkoutType] = useState(
    localStorage.getItem("lastWorkout") === "A" ? "B" : "A"
  );

  const defaultWorkoutA = [
    { name: "Squat", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Bench Press", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Mid Row", weight: 25, reps: 12, sets: 3, setsCompleted: [false, false, false] },
    { name: "Lat Pulldown", weight: 20, reps: 12, sets: 3, setsCompleted: [false, false, false] },
  ];

  const defaultWorkoutB = [
    { name: "Squat", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Overhead Press", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Back Extension", weight: 0, reps: 12, sets: 3, setsCompleted: [false, false, false] },
    { name: "Lat Pulldown", weight: 20, reps: 12, sets: 3, setsCompleted: [false, false, false] },
  ];

  const [workoutAExercises, setWorkoutAExercises] = useState(() => {
    const saved = localStorage.getItem("workoutAExercises");
    return saved ? JSON.parse(saved) : defaultWorkoutA;
  });

  const [workoutBExercises, setWorkoutBExercises] = useState(() => {
    const saved = localStorage.getItem("workoutBExercises");
    return saved ? JSON.parse(saved) : defaultWorkoutB;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  // Set browser tab title
  useEffect(() => {
    document.title = "IronLoop";
  }, []);

  // Persist local data
  useEffect(() => {
    localStorage.setItem("workoutAExercises", JSON.stringify(workoutAExercises));
  }, [workoutAExercises]);

  useEffect(() => {
    localStorage.setItem("workoutBExercises", JSON.stringify(workoutBExercises));
  }, [workoutBExercises]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  // Determine exercises for current workout
  const exercises = currentWorkoutType === "A" ? workoutAExercises : workoutBExercises;
  const setExercises = currentWorkoutType === "A" ? setWorkoutAExercises : setWorkoutBExercises;

  // Ensure local workouts have a stable client_id (for dedupe and mapping)
  const ensureClientIds = (items) => {
    let changed = false;
    const updated = items.map((w) => {
      if (!w.client_id) {
        changed = true;
        return { ...w, client_id: crypto.randomUUID() };
      }
      return w;
    });
    return { updated, changed };
  };

  // Merge remote + local with dedupe by client_id
  const mergeHistories = (localItems, remoteItems) => {
    const map = new Map();

    // remote first (wins conflicts)
    for (const w of remoteItems) {
      if (w.client_id) map.set(w.client_id, w);
    }
    for (const w of localItems) {
      if (w.client_id && !map.has(w.client_id)) {
        map.set(w.client_id, w);
      }
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return merged;
  };

  // Auth bootstrap + listener
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // When logged in: claim device workouts and load remote history
  useEffect(() => {
    if (!userId) return;

    const claimAndLoad = async () => {
      try {
        // Ensure local has client_id values (always good)
        const { updated: localWithIds, changed } = ensureClientIds(history);
        const localFinal = changed ? localWithIds : history;
        if (changed) setHistory(localWithIds);

        // Claim any old rows created pre-login on this device
        await supabase.rpc("claim_workouts", { p_device_id: deviceId });

        // Load remote history for this user
        const { data: remoteRows, error } = await supabase
          .from("workouts")
          .select("id, client_id, workout_type, performed_at, exercises, notes")
          .eq("user_id", userId)
          .order("performed_at", { ascending: false });

        if (error) {
          console.error("Supabase select failed:", error);
          return;
        }

        const remoteHistory = (remoteRows || [])
          .map((row) => ({
            client_id: row.client_id || String(row.id),
            type: row.workout_type,
            date: row.performed_at,
            exercises: row.exercises,
            notes: row.notes || "",
          }))
          .filter((w) => Boolean(w.client_id));

        const merged = mergeHistories(localFinal, remoteHistory);
        setHistory(merged);
      } catch (err) {
        console.error("Claim/load failed:", err);
      }
    };

    claimAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Send magic link
  const sendMagicLink = async () => {
    setAuthMessage("");
    const email = authEmail.trim();
    if (!email) {
      setAuthMessage("Enter an email address.");
      return;
    }

    try {
      // Keep redirects working even on subpaths like /tjs-5x5s/
      const redirectTo = window.location.origin + window.location.pathname;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      setAuthMessage("Check your email for the sign-in link.");
    } catch (err) {
      setAuthMessage("Something went wrong sending the sign-in link.");
      console.error(err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Finish workout
  const finishWorkout = async (exercisesSnapshot) => {
    const newWorkout = {
      client_id: crypto.randomUUID(),
      type: currentWorkoutType,
      date: new Date(),
      exercises: exercisesSnapshot.map((ex) => ({ ...ex })),
      notes: "",
    };

    // Save locally
    setHistory([newWorkout, ...history]);
    localStorage.setItem("lastWorkout", currentWorkoutType);

    // Save to Supabase only if logged in
    if (userId) {
      try {
        const { error } = await supabase.from("workouts").insert({
          user_id: userId,
          device_id: deviceId,
          client_id: newWorkout.client_id,
          workout_type: currentWorkoutType,
          performed_at: newWorkout.date,
          exercises: newWorkout.exercises,
          notes: "",
        });

        if (error) console.error("Supabase insert failed:", error);
      } catch (err) {
        console.error("Supabase insert failed:", err);
      }
    }

    // Reset setsCompleted for next session
    const resetExercises = exercisesSnapshot.map((ex) => ({
      ...ex,
      setsCompleted: Array(ex.sets || ex.setsCompleted.length).fill(false),
    }));

    if (currentWorkoutType === "A") {
      setWorkoutAExercises(resetExercises);
    } else {
      setWorkoutBExercises(resetExercises);
    }

    // Switch workout type
    setCurrentWorkoutType(currentWorkoutType === "A" ? "B" : "A");
  };

  // Update notes (local always, Supabase only if logged in)
  const updateWorkoutNotes = async (index, value) => {
    setHistory((prev) => {
      const copy = [...prev];
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

  // Delete workout (local always, Supabase only if logged in)
  const deleteWorkout = async (index) => {
    const confirmed = window.confirm("Are you sure you want to delete this workout?");
    if (!confirmed) return;

    const workoutToDelete = history[index];

    setHistory((prev) => prev.filter((_, i) => i !== index));

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

  return (
    <div style={{ padding: "1rem", minHeight: "100vh", backgroundColor: "#121212", color: "#fff" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>IronLoop</h1>

      {/* Auth bar */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto 1rem auto",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          padding: "0.75rem",
          boxSizing: "border-box",
          textAlign: "left",
        }}
      >
        {userId ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <div style={{ color: "#aaa", fontSize: "0.9rem" }}>
              Signed in as: {session?.user?.email}
            </div>
            <button
              onClick={signOut}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#121212",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <div style={{ color: "#aaa", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Local-only mode. Sign in to sync across devices.
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  flex: 1,
                  minWidth: "220px",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  backgroundColor: "#121212",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={sendMagicLink}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#8b5cf6",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Send magic link
              </button>
            </div>
            {authMessage ? (
              <div style={{ marginTop: "0.5rem", color: "#aaa", fontSize: "0.9rem" }}>
                {authMessage}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", justifyContent: "center" }}>
        {["Workout", "History", "Customize"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === tab ? "#8b5cf6" : "#1a1a1a",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab */}
      <div>
        {activeTab === "Workout" && (
          <WorkoutView
            currentWorkoutType={currentWorkoutType}
            setCurrentWorkoutType={setCurrentWorkoutType}
            exercises={exercises}
            setExercises={setExercises}
            finishWorkout={finishWorkout}
          />
        )}
        {activeTab === "History" && (
          <HistoryView
            history={history}
            deleteWorkout={deleteWorkout}
            updateWorkoutNotes={updateWorkoutNotes}
          />
        )}
        {activeTab === "Customize" && (
          <CustomizeView
            workoutAExercises={workoutAExercises}
            setWorkoutAExercises={setWorkoutAExercises}
            workoutBExercises={workoutBExercises}
            setWorkoutBExercises={setWorkoutBExercises}
          />
        )}
      </div>
    </div>
  );
}

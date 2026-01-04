import React, { useMemo, useRef, useEffect } from "react";

export default function CustomizeView({
  workouts,
  setWorkouts,
  selectedWorkoutId, // can be null = editor closed
  setSelectedWorkoutId,
  preferredUnit = "lb", // "lb" | "kg"
}) {
  const editorRef = useRef(null);

  const unit = preferredUnit === "kg" ? "kg" : "lb";

  // Conversions (we store lbs internally)
  const lbsToKg = (lbs) => lbs / 2.2046226218;
  const kgToLbs = (kg) => kg * 2.2046226218;

  const formatNumber = (n, maxDecimals = 1) => {
    if (typeof n !== "number" || Number.isNaN(n)) return "";
    const s = n.toFixed(maxDecimals);
    return s.replace(/\.0+$|(\.\d*[1-9])0+$/g, "$1");
  };

  const displayWeightValue = (storedLbs) => {
    if (storedLbs === "" || storedLbs === null || storedLbs === undefined) return "";
    const lbsNum =
      typeof storedLbs === "number" ? storedLbs : Number(storedLbs);
    if (Number.isNaN(lbsNum)) return "";
    if (unit === "lb") return formatNumber(lbsNum, 2);
    return formatNumber(lbsToKg(lbsNum), 2);
  };

  const parseWeightInputToLbs = (raw) => {
    if (raw === "") return "";
    const cleaned = String(raw).replace(",", ".").trim();
    const n = Number(cleaned);
    if (Number.isNaN(n)) return "";

    const lbs = unit === "kg" ? kgToLbs(n) : n;
    return Math.round(lbs * 100) / 100;
  };

  const list = workouts || [];

  const selectedWorkout = useMemo(() => {
    if (!selectedWorkoutId) return null;
    return list.find((w) => w.id === selectedWorkoutId) || null;
  }, [list, selectedWorkoutId]);

  const selectedExercises = selectedWorkout?.exercises || [];

  // Auto-scroll to editor when it opens or when selected changes
  useEffect(() => {
    if (!selectedWorkoutId) return;
    if (editorRef.current) {
      editorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedWorkoutId]);

  const toggleEditWorkout = (id) => {
    setSelectedWorkoutId((prev) => (prev === id ? null : id));
  };

  const updateWorkoutName = (id, name) => {
    const next = list.map((w) => (w.id === id ? { ...w, name } : w));
    setWorkouts(next);
  };

  // Reset setsCompleted to all false while keeping sets count
  const cloneExercisesForTemplate = (exercises) => {
    const exList = Array.isArray(exercises) ? exercises : [];
    return exList.map((ex) => {
      const sets = Number(ex?.sets ?? 0) || 0;
      return {
        name: typeof ex?.name === "string" ? ex.name : "Exercise",
        reps: Number(ex?.reps ?? 0) || 0,
        sets,
        // IMPORTANT: stored internally in lbs
        weight: ex?.weight === "" ? "" : Number(ex?.weight ?? 0) || 0,
        setsCompleted: Array.from({ length: sets }, () => false),
      };
    });
  };

  const updateExercise = (index, field, value) => {
    if (!selectedWorkoutId) return;

    // Pull fresh workout from current list (more robust)
    const freshWorkout = list.find((w) => w.id === selectedWorkoutId);
    if (!freshWorkout) return;

    const exArr = Array.isArray(freshWorkout.exercises)
      ? freshWorkout.exercises
      : [];
    const exList = [...exArr];
    if (!exList[index]) return;

    const ex = { ...exList[index] };

    if (field === "weight") {
      ex.weight = parseWeightInputToLbs(value);

      // Ensure setsCompleted exists
      if (!Array.isArray(ex.setsCompleted)) {
        const len = Number(ex.sets) || 5;
        ex.setsCompleted = Array.from({ length: len }, () => false);
      }

      exList[index] = ex;

      const nextWorkouts = list.map((w) =>
        w.id === selectedWorkoutId ? { ...w, exercises: exList } : w
      );
      setWorkouts(nextWorkouts);
      return;
    }

    if (field === "reps" || field === "sets") {
      let numericValue = Number(value);

      if (field === "sets") {
        if (!Number.isFinite(numericValue) || numericValue <= 0) numericValue = 5;
      }

      // Treat empty reps as empty (optional); keeping your existing behavior
      if (field !== "sets" && value === "") {
        ex[field] = "";
      } else {
        ex[field] = numericValue;
      }

      if (field === "sets") {
        const currentSets = Array.isArray(ex.setsCompleted)
          ? ex.setsCompleted
          : [];
        ex.setsCompleted = Array.from(
          { length: numericValue },
          (_, i) => Boolean(currentSets[i])
        );
      }

      if (!Array.isArray(ex.setsCompleted)) {
        const len = Number(ex.sets) || 5;
        ex.setsCompleted = Array.from({ length: len }, () => false);
      }
    } else {
      ex[field] = value;
    }

    exList[index] = ex;

    const nextWorkouts = list.map((w) =>
      w.id === selectedWorkoutId ? { ...w, exercises: exList } : w
    );
    setWorkouts(nextWorkouts);
  };

  const removeExercise = (index) => {
    if (!selectedWorkoutId) return;

    const freshWorkout = list.find((w) => w.id === selectedWorkoutId);
    if (!freshWorkout) return;

    const confirmed = window.confirm("Delete this exercise?");
    if (!confirmed) return;

    const exArr = Array.isArray(freshWorkout.exercises)
      ? freshWorkout.exercises
      : [];
    const exList = exArr.filter((_, i) => i !== index);

    const nextWorkouts = list.map((w) =>
      w.id === selectedWorkoutId ? { ...w, exercises: exList } : w
    );
    setWorkouts(nextWorkouts);
  };

  const addExercise = () => {
    if (!selectedWorkoutId) return;

    const freshWorkout = list.find((w) => w.id === selectedWorkoutId);
    if (!freshWorkout) return;

    const newExercise = {
      name: "New Exercise",
      reps: 10,
      sets: 5,
      // stored internally in lbs
      weight: 0,
      setsCompleted: Array.from({ length: 5 }, () => false),
    };

    const exArr = Array.isArray(freshWorkout.exercises)
      ? freshWorkout.exercises
      : [];
    const nextExercises = [...exArr, newExercise];

    const nextWorkouts = list.map((w) =>
      w.id === selectedWorkoutId ? { ...w, exercises: nextExercises } : w
    );
    setWorkouts(nextWorkouts);
  };

  // UPDATED: no confirmation; also auto-open editor on the new workout
  const addWorkout = () => {
    const id = crypto.randomUUID();
    const count = list.length + 1;

    const newWorkout = {
      id,
      name: `Workout ${count}`,
      exercises: [],
    };

    const next = [...list, newWorkout];
    setWorkouts(next);

    // Auto-open editor for the newly created workout
    setSelectedWorkoutId(id);
  };

  const duplicateWorkout = (id) => {
    const idx = list.findIndex((w) => w.id === id);
    if (idx === -1) return;

    const original = list[idx];
    const newId = crypto.randomUUID();

    const copyName =
      typeof original?.name === "string" && original.name.trim()
        ? `${original.name} (copy)`
        : "Workout (copy)";

    const duplicated = {
      id: newId,
      name: copyName,
      exercises: cloneExercisesForTemplate(original.exercises || []),
    };

    const next = [...list.slice(0, idx + 1), duplicated, ...list.slice(idx + 1)];
    setWorkouts(next);

    // Open editor on the duplicated workout (nice UX)
    setSelectedWorkoutId(newId);
  };

  const deleteWorkout = (id) => {
    if (list.length <= 1) {
      window.alert("You must keep at least one workout.");
      return;
    }

    const target = list.find((w) => w.id === id);
    const confirmed = window.confirm(
      `Delete "${target?.name || "Workout"}"? This does not delete your workout history.`
    );
    if (!confirmed) return;

    const next = list.filter((w) => w.id !== id);
    setWorkouts(next);

    // If we deleted the one being edited, close editor
    if (selectedWorkoutId === id) {
      setSelectedWorkoutId(null);
    }
  };

  const moveWorkout = (id, direction) => {
    const idx = list.findIndex((w) => w.id === id);
    if (idx === -1) return;

    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= list.length) return;

    const next = [...list];
    const temp = next[idx];
    next[idx] = next[nextIdx];
    next[nextIdx] = temp;

    setWorkouts(next);
  };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#121212",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "0 1rem 2.5rem",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Customize Workouts
        </h2>

        {/* Workout list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {list.map((w, index) => {
            const isSelected = selectedWorkoutId === w.id;
            const canMoveUp = index > 0;
            const canMoveDown = index < list.length - 1;

            return (
              <div
                key={w.id}
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  border: isSelected ? "1px solid #8b5cf6" : "1px solid #333",
                }}
              >
                {/* name field */}
                <div style={{ marginBottom: "0.6rem" }}>
                  <input
                    type="text"
                    value={typeof w.name === "string" ? w.name : ""}
                    onChange={(e) => updateWorkoutName(w.id, e.target.value)}
                    placeholder="Workout"
                    style={{
                      width: "100%",
                      backgroundColor: "#121212",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.5rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => toggleEditWorkout(w.id)}
                    style={{
                      backgroundColor: isSelected ? "#8b5cf6" : "#121212",
                      color: "#fff",
                      borderRadius: "8px",
                      padding: "0.4rem 0.75rem",
                      border: "1px solid #333",
                      cursor: "pointer",
                    }}
                  >
                    {isSelected ? "Close" : "Edit"}
                  </button>

                  <button
                    onClick={() => moveWorkout(w.id, "up")}
                    disabled={!canMoveUp}
                    style={{
                      backgroundColor: "#121212",
                      color: canMoveUp ? "#fff" : "#666",
                      borderRadius: "8px",
                      padding: "0.4rem 0.65rem",
                      border: "1px solid #333",
                      cursor: canMoveUp ? "pointer" : "not-allowed",
                    }}
                    title="Move up"
                  >
                    ↑
                  </button>

                  <button
                    onClick={() => moveWorkout(w.id, "down")}
                    disabled={!canMoveDown}
                    style={{
                      backgroundColor: "#121212",
                      color: canMoveDown ? "#fff" : "#666",
                      borderRadius: "8px",
                      padding: "0.4rem 0.65rem",
                      border: "1px solid #333",
                      cursor: canMoveDown ? "pointer" : "not-allowed",
                    }}
                    title="Move down"
                  >
                    ↓
                  </button>

                  <button
                    onClick={() => duplicateWorkout(w.id)}
                    style={{
                      backgroundColor: "#121212",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "8px",
                      padding: "0.4rem 0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Duplicate
                  </button>

                  <button
                    onClick={() => deleteWorkout(w.id)}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #333",
                      color: "#ff5555",
                      borderRadius: "8px",
                      padding: "0.4rem 0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={addWorkout}
            style={{
              width: "100%",
              padding: "0.6rem",
              backgroundColor: "#1a1a1a",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            + Add Workout
          </button>
        </div>

        {/* Editor (only when a workout is selected) */}
        {selectedWorkout ? (
          <>
            <div ref={editorRef} />

            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                margin: "1.25rem 0 0.5rem",
                fontSize: "0.95rem",
              }}
            >
              Currently editing:{" "}
              <strong style={{ color: "#fff" }}>
                {selectedWorkout.name || "Workout"}
              </strong>
            </div>

            <h2 style={{ textAlign: "center" }}>
              {selectedWorkout.name || "Workout"}
            </h2>

            {selectedExercises.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  backgroundColor: "#1a1a1a",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  marginTop: "0.5rem",
                  position: "relative",
                }}
              >
                <span
                  onClick={() => removeExercise(idx)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "8px",
                    color: "#ff5555",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "1.5rem",
                  }}
                >
                  ×
                </span>

                <input
                  type="text"
                  value={ex.name}
                  onChange={(e) => updateExercise(idx, "name", e.target.value)}
                  style={{
                    width: "calc(100% - 2rem)",
                    backgroundColor: "#121212",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "0.4rem",
                    paddingRight: "1.75rem",
                  }}
                />

                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                    style={{
                      width: "50px",
                      backgroundColor: "#121212",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.4rem",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ color: "#aaa", fontSize: "0.9rem" }}>reps</span>
                </div>

                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                    style={{
                      width: "50px",
                      backgroundColor: "#121212",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.4rem",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ color: "#aaa", fontSize: "0.9rem" }}>sets</span>
                </div>

                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={displayWeightValue(ex.weight === "" || ex.weight === 0 ? "" : ex.weight)}
                    onChange={(e) => updateExercise(idx, "weight", e.target.value)}
                    placeholder="0"
                    style={{
                      width: "70px",
                      backgroundColor: "#121212",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.4rem",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ color: "#aaa", fontSize: "0.9rem" }}>{unit}</span>
                </div>
              </div>
            ))}

            <button
              onClick={addExercise}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                padding: "0.6rem",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              + Add Exercise
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

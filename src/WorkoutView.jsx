import React, { useEffect, useState } from "react";

export default function WorkoutView({
  workouts,
  currentWorkoutId,
  setCurrentWorkoutId,
  currentWorkoutName,
  exercises,
  setExercises,
  finishWorkout,
  preferredUnit = "lb", // "lb" | "kg"
}) {
  const unit = preferredUnit === "kg" ? "kg" : "lb";

  // Conversions (we store lbs internally)
  const lbsToKg = (lbs) => lbs / 2.2046226218;
  const kgToLbs = (kg) => kg * 2.2046226218;

  // Keep display clean without being clever
  const formatNumber = (n, maxDecimals = 1) => {
    if (typeof n !== "number" || Number.isNaN(n)) return "";
    const s = n.toFixed(maxDecimals);
    return s.replace(/\.0+$|(\.\d*[1-9])0+$/g, "$1");
  };

  const displayWeightValue = (storedLbs) => {
    if (storedLbs === "" || storedLbs === null || storedLbs === undefined) return "";
    const lbsNum = typeof storedLbs === "number" ? storedLbs : Number(storedLbs);
    if (Number.isNaN(lbsNum)) return "";
    if (unit === "lb") return formatNumber(lbsNum, 2);
    return formatNumber(lbsToKg(lbsNum), 2);
  };

  const parseWeightInputToLbs = (raw) => {
    if (raw === "") return "";
    const cleaned = String(raw).replace(",", ".").trim();

    // Allow partial typing states
    if (cleaned === "." || cleaned === "-" || cleaned === "-.") return "";

    const n = Number(cleaned);
    if (Number.isNaN(n)) return "";

    const lbs = unit === "kg" ? kgToLbs(n) : n;
    return Math.round(lbs * 100) / 100;
  };

  // Draft text for weight inputs (keyed by index)
  const [weightDrafts, setWeightDrafts] = useState({});
  const [weightEditingIndex, setWeightEditingIndex] = useState(null);

  // Keep drafts in sync whenever exercises change or unit changes,
  // BUT do not overwrite the one the user is actively editing.
  useEffect(() => {
    setWeightDrafts((prev) => {
      const next = { ...prev };
      const list = Array.isArray(exercises) ? exercises : [];

      for (let idx = 0; idx < list.length; idx++) {
        if (idx === weightEditingIndex) continue;
        next[idx] = displayWeightValue(list[idx]?.weight);
      }

      // Clean up drafts for removed exercises
      Object.keys(next).forEach((k) => {
        const i = Number(k);
        if (!Number.isFinite(i) || i < 0 || i >= list.length) delete next[k];
      });

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, currentWorkoutId, exercises, weightEditingIndex]);

  const commitWeightDraft = (idx) => {
    const raw = weightDrafts[idx] ?? "";
    const lbs = parseWeightInputToLbs(raw);

    const newExercises = [...exercises];
    if (!newExercises[idx]) return;

    newExercises[idx].weight = lbs;
    setExercises(newExercises);

    // Normalize draft to formatted display after commit
    setWeightDrafts((prev) => ({
      ...prev,
      [idx]: displayWeightValue(lbs),
    }));
  };

  const toggleExercise = (index) => {
    const newExercises = [...exercises];
    const sets = newExercises[index].setsCompleted || [];

    const firstFalse = sets.indexOf(false);
    if (firstFalse !== -1) {
      sets[firstFalse] = true;
    } else {
      for (let i = 0; i < sets.length; i++) sets[i] = false;
    }

    newExercises[index].setsCompleted = sets;
    setExercises(newExercises);
  };

  const updateField = (index, field, value) => {
    const newExercises = [...exercises];

    if (field === "reps") {
      newExercises[index][field] = value === "" ? "" : Number(value);
      setExercises(newExercises);
      return;
    }

    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const displayName =
    typeof currentWorkoutName === "string" && currentWorkoutName.trim()
      ? currentWorkoutName
      : "Workout";

  const list = Array.isArray(workouts) ? workouts : [];
  const subtleLabelStyle = { color: "#aaa", fontSize: "0.9rem" };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#121212",
        color: "#fff",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "0 1rem",
          boxSizing: "border-box",
        }}
      >
        {/* Current workout selector */}
        <div
          style={{
            marginTop: "1rem",
            width: "100%",
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "0.75rem",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={subtleLabelStyle}>Current workout selected:</div>

          <div style={{ position: "relative", width: "100%" }}>
            <select
              value={currentWorkoutId}
              onChange={(e) => setCurrentWorkoutId(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#121212",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "0.75rem",
                paddingRight: "2.5rem",
                fontSize: "1rem",
                boxSizing: "border-box",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                cursor: "pointer",
              }}
            >
              {list.map((w, idx) => {
                const name =
                  typeof w?.name === "string" && w.name.trim()
                    ? w.name
                    : `Workout ${idx + 1}`;
                return (
                  <option key={w.id} value={w.id}>
                    {name}
                  </option>
                );
              })}
            </select>

            {/* Subtle chevron */}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                opacity: 0.65,
              }}
            >
              <path
                d="M7 10l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "#aaa" }}
              />
            </svg>
          </div>
        </div>

        <h2 style={{ marginTop: "1rem", textAlign: "center" }}>{displayName}</h2>

        <div
          style={{
            ...subtleLabelStyle,
            textAlign: "center",
            marginTop: "0.25rem",
          }}
        >
          Tap to complete a set
        </div>

        {/* Exercises */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            width: "100%",
            marginTop: "1rem",
          }}
        >
          {exercises.map((ex, idx) => (
            <div
              key={`${ex.name}-${idx}`}
              onClick={() => toggleExercise(idx)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                backgroundColor: "#1a1a1a",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  {ex.name}
                </span>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={weightDrafts[idx] ?? displayWeightValue(ex.weight)}
                      onFocus={() => setWeightEditingIndex(idx)}
                      onChange={(e) =>
                        setWeightDrafts((prev) => ({ ...prev, [idx]: e.target.value }))
                      }
                      onBlur={() => {
                        setWeightEditingIndex(null);
                        commitWeightDraft(idx);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      style={{
                        width: "62px",
                        borderRadius: "4px",
                        border: "1px solid #555",
                        backgroundColor: "#1a1a1a",
                        color: "#fff",
                        textAlign: "center",
                        padding: "0.2rem",
                      }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#aaa" }}>{unit}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ex.reps}
                      onChange={(e) => updateField(idx, "reps", e.target.value)}
                      style={{
                        width: "40px",
                        borderRadius: "4px",
                        border: "1px solid #555",
                        backgroundColor: "#1a1a1a",
                        color: "#fff",
                        textAlign: "center",
                        padding: "0.2rem",
                      }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#aaa" }}>reps</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {Array.from({ length: ex.sets || 3 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: ex.setsCompleted?.[i] ? "#8b5cf6" : "#333",
                      border: "1px solid #555",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Finish button */}
        <button
          onClick={() => finishWorkout(exercises)}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#8b5cf6",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";

export default function HistoryView({
  history,
  deleteWorkout,
  updateWorkoutNotes,
  preferredUnit = "lb", // "lb" | "kg"
}) {
  const [editingIndex, setEditingIndex] = useState(null);

  const unit = preferredUnit === "kg" ? "kg" : "lb";

  // Conversions (we store lbs internally)
  const lbsToKg = (lbs) => lbs / 2.2046226218;

  const formatNumber = (n, maxDecimals = 1) => {
    if (typeof n !== "number" || Number.isNaN(n)) return "";
    const s = n.toFixed(maxDecimals);
    return s.replace(/\.0+$|(\.\d*[1-9])0+$/g, "$1");
  };

  const displayWeight = (storedLbs) => {
    if (storedLbs === "" || storedLbs === null || storedLbs === undefined) return "";
    const lbsNum =
      typeof storedLbs === "number" ? storedLbs : Number(storedLbs);
    if (Number.isNaN(lbsNum)) return "";

    if (unit === "lb") return formatNumber(lbsNum, 2);
    return formatNumber(lbsToKg(lbsNum), 2);
  };

  const onNotesChange = (index, value) => {
    updateWorkoutNotes(index, value);
    setEditingIndex(index);
  };

  useEffect(() => {
    if (editingIndex !== null) {
      const timeout = setTimeout(() => setEditingIndex(null), 1000);
      return () => clearTimeout(timeout);
    }
  }, [history, editingIndex]);

  const getTitle = (session) => {
    const label = (session?.type || "").trim();
    if (!label) return "Workout";

    // If older history entries are "A" or "B", show "Workout A/B" like before.
    if (label === "A" || label === "B") return `Workout ${label}`;

    // Otherwise it's a user-friendly name like "Leg Day"
    return label;
  };

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
        <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>
          Workout History
        </h2>

        {history.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>
            No workouts logged yet.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              width: "100%",
            }}
          >
            {history.map((session, index) => (
              <div
                key={session.client_id || index}
                style={{
                  position: "relative",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "left",
                  boxSizing: "border-box",
                  transition: "background-color 0.2s",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222222")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkout(index);
                  }}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "transparent",
                    border: "none",
                    color: "#ff5555",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                    padding: "4px",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ff8888")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#ff5555")}
                >
                  ×
                </button>

                <h3 style={{ margin: "0 0 0.5rem 0" }}>{getTitle(session)}</h3>

                <p
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "0.9rem",
                    color: "#aaa",
                  }}
                >
                  {new Date(session.date).toLocaleString()}
                </p>

                {(session.exercises || []).map((ex, i) => {
                  const totalSets = ex.sets || 0;
                  const completedSets = ex.setsCompleted
                    ? ex.setsCompleted.filter(Boolean).length
                    : 0;

                  const w = displayWeight(ex.weight);

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                        flexWrap: "wrap",
                        gap: "0.25rem",
                      }}
                    >
                      <span>{ex.name}</span>
                      <span
                        style={{
                          color: "#aaa",
                          fontSize: "0.9rem",
                          textAlign: "right",
                        }}
                      >
                        {w} {unit} × {ex.reps} reps | {completedSets}/{totalSets} sets
                      </span>
                    </div>
                  );
                })}

                <textarea
                  placeholder="Add notes..."
                  value={session.notes || ""}
                  onChange={(e) => onNotesChange(index, e.target.value)}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    backgroundColor: "#121212",
                    color: "#fff",
                    resize: "none",
                    minHeight: "50px",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                />

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#aaa",
                    textAlign: "right",
                  }}
                >
                  {editingIndex === index ? "Editing..." : "Saved"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

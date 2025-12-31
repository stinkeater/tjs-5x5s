import React, { useState, useEffect } from "react";

export default function HistoryView({ history, deleteWorkout, updateWorkoutNotes }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const onNotesChange = (index, value) => {
    updateWorkoutNotes(index, value);
    setEditingIndex(index);
  };

  // Reset editing indicator after 1 second
  useEffect(() => {
    if (editingIndex !== null) {
      const timeout = setTimeout(() => setEditingIndex(null), 1000);
      return () => clearTimeout(timeout);
    }
  }, [history, editingIndex]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#121212",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "1rem 0",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#222222")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1a1a1a")
                }
              >
                {/* Delete button */}
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

                <h3 style={{ margin: "0 0 0.5rem 0" }}>
                  {session.type ? `Workout ${session.type}` : `Workout`}
                </h3>
                <p
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "0.9rem",
                    color: "#aaa",
                  }}
                >
                  {new Date(session.date).toLocaleString()}
                </p>

                {session.exercises.map((ex, i) => {
                  const totalSets = ex.sets || 0;
                  const completedSets = ex.setsCompleted
                    ? ex.setsCompleted.filter(Boolean).length
                    : 0;

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
                        {ex.weight} lbs × {ex.reps} reps | {completedSets}/{totalSets} sets
                      </span>
                    </div>
                  );
                })}

                {/* Notes input (auto-expand) */}
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

import React from "react";

export default function HistoryView({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <h1>History</h1>
        <p>No workouts yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>History</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto", // centers container
        }}
      >
        {history.map((workout, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#121212",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #333",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "bold" }}>Workout {workout.type}</span>
              <span style={{ fontSize: "0.9rem", color: "#aaa" }}>
                {new Date(workout.date).toLocaleString()}
              </span>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              {workout.exercises.map((ex, exIdx) => (
                <div
                  key={exIdx}
                  style={{ display: "flex", justifyContent: "space-between", color: "#fff" }}
                >
                  <span>{ex.name}</span>
                  <span>{ex.weight} lb × {ex.reps}</span>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

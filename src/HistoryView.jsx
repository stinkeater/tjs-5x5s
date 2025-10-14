import React from "react";

export default function HistoryView({ history }) {
  if (!history || history.length === 0) {
    return <p style={{ textAlign: "center", marginTop: 20 }}>No workouts yet.</p>;
  }

  return (
    <div>
      {history.map((workout, i) => (
        <div
          key={i}
          style={{
            marginBottom: 20,
            padding: 15,
            border: "1px solid #ccc",
            borderRadius: 12,
            fontSize: "1.1rem",
            backgroundColor: "#f9f9f9"
          }}
        >
          <div style={{ marginBottom: 5 }}>
            <strong>Workout {workout.type}</strong> — {workout.date}
          </div>
          <ul style={{ paddingLeft: 20, marginTop: 5 }}>
            {workout.exercises.map((exercise, idx) => (
              <li key={idx}>
                {exercise.name}: {exercise.weight} lb —{" "}
                {exercise.setsCompleted.filter(Boolean).length}/
                {exercise.setsCompleted.length} sets
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

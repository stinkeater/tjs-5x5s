import React from "react";

export default function CustomizeView({
  workoutAExercises,
  setWorkoutAExercises,
  workoutBExercises,
  setWorkoutBExercises,
}) {
  const updateExercise = (workout, index, field, value) => {
    const newExercises = [...workout];

    if (field === "weight" || field === "reps" || field === "sets") {
      // Allow empty string for weight while typing
      let numericValue = value === "" ? "" : Number(value);

      if (field === "sets" && numericValue <= 0) numericValue = 5;

      newExercises[index][field] = numericValue;

      if (field === "sets") {
        const currentSets = newExercises[index].setsCompleted || [];
        newExercises[index].setsCompleted = Array.from(
          { length: numericValue },
          (_, i) => currentSets[i] || false
        );
      }

      if (!newExercises[index].setsCompleted) {
        newExercises[index].setsCompleted = Array.from({ length: numericValue || 5 }, () => false);
      }
    } else {
      newExercises[index][field] = value;
    }

    return newExercises;
  };

  const renderExercises = (workout, setWorkout) =>
    workout.map((ex, idx) => (
      <div
        key={idx}
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#1a1a1a",
          padding: "0.5rem",
          borderRadius: "8px",
          marginTop: "0.5rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Name Input */}
        <input
          type="text"
          value={ex.name}
          onChange={(e) => setWorkout(updateExercise(workout, idx, "name", e.target.value))}
          style={{
            flex: "1 1 100px",
            minWidth: "80px",
            maxWidth: "180px",
            backgroundColor: "#121212",
            border: "1px solid #333",
            color: "#fff",
            borderRadius: "6px",
            padding: "0.3rem",
            textAlign: "center",
          }}
        />

        {/* Reps Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <input
            type="number"
            value={ex.reps}
            onChange={(e) => setWorkout(updateExercise(workout, idx, "reps", e.target.value))}
            style={{
              width: "40px",
              backgroundColor: "#121212",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.3rem",
              textAlign: "center",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "0.9rem" }}>reps</span>
        </div>

        {/* Sets Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <input
            type="number"
            value={ex.sets}
            onChange={(e) => setWorkout(updateExercise(workout, idx, "sets", e.target.value))}
            style={{
              width: "40px",
              backgroundColor: "#121212",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.3rem",
              textAlign: "center",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "0.9rem" }}>sets</span>
        </div>

        {/* Weight Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <input
            type="text" // changed to text to allow empty value
            value={ex.weight}
            onChange={(e) => setWorkout(updateExercise(workout, idx, "weight", e.target.value))}
            style={{
              width: "50px",
              backgroundColor: "#121212",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.3rem",
              textAlign: "center",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "0.9rem" }}>lbs</span>
        </div>
      </div>
    ));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <h1 style={{ textAlign: "center", width: "100%" }}>Customize Workouts</h1>

      <div style={{ marginTop: "1rem", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ textAlign: "center" }}>Workout A</h2>
        {renderExercises(workoutAExercises, setWorkoutAExercises)}
      </div>

      <div style={{ marginTop: "1.5rem", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ textAlign: "center" }}>Workout B</h2>
        {renderExercises(workoutBExercises, setWorkoutBExercises)}
      </div>
    </div>
  );
}

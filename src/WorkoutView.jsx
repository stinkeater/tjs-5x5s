import React from "react";

export default function WorkoutView({ currentWorkoutType, setCurrentWorkoutType, exercises, setExercises, finishWorkout }) {
  // Incrementally toggle sets
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
    if (field === "weight" || field === "reps") {
      // Allow empty string while typing
      newExercises[index][field] = value === "" ? "" : Number(value);
    } else {
      newExercises[index][field] = value;
    }
    setExercises(newExercises);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
      {/* Workout A/B switcher */}
      <div style={{ display: "flex", gap: "1rem", width: "100%", maxWidth: "400px" }}>
        {["A", "B"].map((type) => (
          <button
            key={type}
            onClick={() => setCurrentWorkoutType(type)}
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: currentWorkoutType === type ? "#8b5cf6" : "#1a1a1a",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Workout {type}
          </button>
        ))}
      </div>

      <h2>Workout {currentWorkoutType}</h2>

      {/* Exercises list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "400px" }}>
        {exercises.map((ex, idx) => (
          <div
            key={ex.name}
            onClick={() => toggleExercise(idx)}
            style={{
              padding: "0.75rem",
              border: "1px solid #444",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor: "#121212",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{ex.name}</span>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                {/* Weight input */}
                <input
                  type="text"
                  value={ex.weight}
                  onChange={(e) => updateField(idx, "weight", e.target.value)}
                  style={{
                    width: "50px",
                    borderRadius: "4px",
                    border: "1px solid #555",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    textAlign: "center",
                  }}
                />
                <span style={{ color: "#aaa", fontSize: "0.9rem" }}>lbs</span>

                {/* Reps input */}
                <input
                  type="text"
                  value={ex.reps}
                  onChange={(e) => updateField(idx, "reps", e.target.value)}
                  style={{
                    width: "40px",
                    borderRadius: "4px",
                    border: "1px solid #555",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    textAlign: "center",
                    marginLeft: "0.5rem",
                  }}
                />
                <span style={{ color: "#aaa", fontSize: "0.9rem" }}>reps</span>
              </div>
            </div>

            {/* Sets display */}
            <div style={{ display: "flex", marginTop: "0.5rem", gap: "0.5rem" }}>
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
        }}
      >
        Finish Workout
      </button>
    </div>
  );
}

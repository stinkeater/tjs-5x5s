import React from "react";

export default function WorkoutView({
  currentWorkoutType,
  setCurrentWorkoutType,
  exercises,
  setExercises,
  finishWorkout,
}) {
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
      newExercises[index][field] = value === "" ? "" : Number(value);
    } else {
      newExercises[index][field] = value;
    }
    setExercises(newExercises);
  };

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
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            width: "100%",
            marginTop: "1rem",
          }}
        >
          {["A", "B"].map((type) => (
            <button
              key={type}
              onClick={() => setCurrentWorkoutType(type)}
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  currentWorkoutType === type ? "#8b5cf6" : "#1a1a1a",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Workout {type}
            </button>
          ))}
        </div>

        <h2 style={{ marginTop: "1rem", textAlign: "center" }}>
          Workout {currentWorkoutType}
        </h2>

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
              key={ex.name}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <input
                      type="text"
                      value={ex.weight}
                      onChange={(e) =>
                        updateField(idx, "weight", e.target.value)
                      }
                      style={{
                        width: "50px",
                        borderRadius: "4px",
                        border: "1px solid #555",
                        backgroundColor: "#1a1a1a",
                        color: "#fff",
                        textAlign: "center",
                        padding: "0.2rem",
                      }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#aaa" }}>
                      lbs
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) =>
                        updateField(idx, "reps", e.target.value)
                      }
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
                    <span style={{ fontSize: "0.9rem", color: "#aaa" }}>
                      reps
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {Array.from({ length: ex.sets || 3 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: ex.setsCompleted?.[i]
                        ? "#8b5cf6"
                        : "#333",
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
            width: "100%", // match exercise box width
          }}
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}

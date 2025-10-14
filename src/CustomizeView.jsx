import React, { useState } from "react";

export default function CustomizeView({
  workoutA,
  setWorkoutA,
  workoutB,
  setWorkoutB,
  saveState
}) {
  const [activeWorkout, setActiveWorkout] = useState("A");

  const currentWorkout =
    activeWorkout === "A" ? workoutA : workoutB;
  const setCurrentWorkout =
    activeWorkout === "A" ? setWorkoutA : setWorkoutB;

  const updateExercise = (index, field, value) => {
    const newWorkout = [...currentWorkout];
    newWorkout[index][field] =
      field === "weight" ? parseInt(value) || 0 : value;
    setCurrentWorkout(newWorkout);
    saveState();
  };

  return (
    <div>
      {/* Switch Workout */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveWorkout("A")}
          style={{
            marginRight: 10,
            backgroundColor: activeWorkout === "A" ? "#6b21a8" : "#ddd",
            color: activeWorkout === "A" ? "#fff" : "#000",
            padding: "10px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Workout A
        </button>
        <button
          onClick={() => setActiveWorkout("B")}
          style={{
            backgroundColor: activeWorkout === "B" ? "#6b21a8" : "#ddd",
            color: activeWorkout === "B" ? "#fff" : "#000",
            padding: "10px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Workout B
        </button>
      </div>

      {/* Edit exercises */}
      {currentWorkout.map((exercise, i) => (
        <div
          key={i}
          style={{
            marginBottom: 20,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 8
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <label>
              Name:{" "}
              <input
                type="text"
                value={exercise.name}
                onChange={(e) =>
                  updateExercise(i, "name", e.target.value)
                }
              />
            </label>
          </div>
          <div>
            <label>
              Default Weight:{" "}
              <input
                type="number"
                value={exercise.weight}
                onChange={(e) =>
                  updateExercise(i, "weight", e.target.value)
                }
                style={{ width: 60 }}
              />{" "}
              lb
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

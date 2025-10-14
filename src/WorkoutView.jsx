import React, { useState } from "react";

export default function WorkoutView({
  workoutA,
  setWorkoutA,
  workoutB,
  setWorkoutB,
  lastWorkout,
  setLastWorkout,
  history,
  setHistory,
  saveState
}) {
  const [currentWorkoutType, setCurrentWorkoutType] = useState(
    lastWorkout === "A" ? "B" : "A"
  );

  const currentWorkout =
    currentWorkoutType === "A" ? workoutA : workoutB;
  const setCurrentWorkout =
    currentWorkoutType === "A" ? setWorkoutA : setWorkoutB;

  const toggleSet = (exerciseIndex) => {
    const newWorkout = [...currentWorkout];
    const sets = newWorkout[exerciseIndex].setsCompleted;

    // Incrementally fill 1 set at a time
    const nextIndex = sets.findIndex((s) => !s);
    if (nextIndex !== -1) {
      sets[nextIndex] = true;
    } else {
      // If all sets completed, reset to empty
      for (let i = 0; i < sets.length; i++) sets[i] = false;
    }

    newWorkout[exerciseIndex].setsCompleted = sets;
    setCurrentWorkout(newWorkout);
    saveState();
  };

  const finishWorkout = () => {
    const workoutRecord = {
      date: new Date().toLocaleString(),
      type: currentWorkoutType,
      exercises: currentWorkout.map((e) => ({
        name: e.name,
        weight: e.weight,
        setsCompleted: e.setsCompleted
      }))
    };

    setHistory([workoutRecord, ...history]);
    setLastWorkout(currentWorkoutType);
    saveState();

    // Switch to the other workout for next time
    const nextWorkout = currentWorkoutType === "A" ? "B" : "A";
    setCurrentWorkoutType(nextWorkout);
  };

  return (
    <div>
      {/* Switch Workout Buttons */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <button
          onClick={() => setCurrentWorkoutType("A")}
          style={{
            marginRight: 10,
            padding: "12px 20px",
            fontSize: "1.1rem",
            backgroundColor: currentWorkoutType === "A" ? "#6b21a8" : "#ddd",
            color: currentWorkoutType === "A" ? "#fff" : "#000",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Workout A
        </button>
        <button
          onClick={() => setCurrentWorkoutType("B")}
          style={{
            padding: "12px 20px",
            fontSize: "1.1rem",
            backgroundColor: currentWorkoutType === "B" ? "#6b21a8" : "#ddd",
            color: currentWorkoutType === "B" ? "#fff" : "#000",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Workout B
        </button>
      </div>

      {/* Exercises */}
      {currentWorkout.map((exercise, i) => (
        <div
          key={i}
          style={{
            marginBottom: 25,
            padding: 20,
            border: "1px solid #ccc",
            borderRadius: 12,
            fontSize: "1.2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{exercise.name}</strong>
            <input
              type="number"
              value={exercise.weight}
              onChange={(e) => {
                const newWorkout = [...currentWorkout];
                newWorkout[i].weight = parseInt(e.target.value) || 0;
                setCurrentWorkout(newWorkout);
                saveState();
              }}
              style={{ width: 70, padding: 5, fontSize: "1rem" }}
            />{" "}
            lb
          </div>

          <div style={{ marginTop: 12 }}>
            {exercise.setsCompleted.map((done, idx) => (
              <span
                key={idx}
                onClick={() => toggleSet(i)}
                style={{
                  display: "inline-block",
                  width: 35,
                  height: 35,
                  lineHeight: "35px",
                  textAlign: "center",
                  marginRight: 5,
                  borderRadius: "50%",
                  border: "1px solid #666",
                  backgroundColor: done ? "#6b21a8" : "#fff",
                  color: done ? "#fff" : "#000",
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: "1.2rem"
                }}
              >
                ✓
              </span>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center" }}>
        <button
          onClick={finishWorkout}
          style={{
            marginTop: 10,
            padding: "15px 30px",
            fontSize: "1.1rem",
            backgroundColor: "#6b21a8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}

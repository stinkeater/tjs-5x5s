import React, { useState, useEffect } from "react";
import WorkoutView from "./WorkoutView";
import CustomizeView from "./CustomizeView";
import HistoryView from "./HistoryView";

export default function App() {
  // State
  const [currentWorkoutType, setCurrentWorkoutType] = useState(
    localStorage.getItem("lastWorkout") === "A" ? "B" : "A"
  );

  const defaultWorkoutA = [
    { name: "Squat", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Bench Press", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Mid Row", weight: 25, reps: 12, sets: 3, setsCompleted: [false, false, false] },
    { name: "Lat Pulldown", weight: 20, reps: 12, sets: 3, setsCompleted: [false, false, false] },
  ];

  const defaultWorkoutB = [
    { name: "Squat", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Overhead Press", weight: 40, reps: 5, sets: 5, setsCompleted: [false, false, false, false, false] },
    { name: "Back Extension", weight: 0, reps: 12, sets: 3, setsCompleted: [false, false, false] },
    { name: "Lat Pulldown", weight: 20, reps: 12, sets: 3, setsCompleted: [false, false, false] },
  ];

  const [workoutAExercises, setWorkoutAExercises] = useState(() => {
    const saved = localStorage.getItem("workoutAExercises");
    const exercises = saved ? JSON.parse(saved) : defaultWorkoutA;
    while (exercises.length < 4) {
      exercises.push({ name: "New Exercise", weight: 0, setsCompleted: [false, false, false, false, false] });
    }
    return exercises;
  });

  const [workoutBExercises, setWorkoutBExercises] = useState(() => {
    const saved = localStorage.getItem("workoutBExercises");
    const exercises = saved ? JSON.parse(saved) : defaultWorkoutB;
    while (exercises.length < 4) {
      exercises.push({ name: "New Exercise", weight: 0, setsCompleted: [false, false, false, false, false] });
    }
    return exercises;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist data
  useEffect(() => {
    localStorage.setItem("workoutAExercises", JSON.stringify(workoutAExercises));
  }, [workoutAExercises]);

  useEffect(() => {
    localStorage.setItem("workoutBExercises", JSON.stringify(workoutBExercises));
  }, [workoutBExercises]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  // Determine exercises for current workout
  const exercises = currentWorkoutType === "A" ? workoutAExercises : workoutBExercises;
  const setExercises = currentWorkoutType === "A" ? setWorkoutAExercises : setWorkoutBExercises;

  // Finish workout
  const finishWorkout = (exercisesSnapshot) => {
    const newWorkout = {
      type: currentWorkoutType,
      date: new Date(),
      exercises: exercisesSnapshot.map((ex) => ({ ...ex })),
    };

    setHistory([newWorkout, ...history]);
    localStorage.setItem("lastWorkout", currentWorkoutType);

    // Switch workout type
    setCurrentWorkoutType(currentWorkoutType === "A" ? "B" : "A");
  };

  // Delete a workout entry
  const deleteWorkout = (index) => {
    const confirmed = window.confirm("Are you sure you want to delete this workout?");
    if (!confirmed) return;
    setHistory((prev) => prev.filter((_, i) => i !== index));
  };

  // Tabs
  const [activeTab, setActiveTab] = useState("Workout");

  return (
    <div style={{ padding: "1rem", minHeight: "100vh", backgroundColor: "#121212", color: "#fff" }}>
      {/* App Title */}
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>TJ's 5x5s</h1>

      {/* Tab Selector */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", justifyContent: "center" }}>
        {["Workout", "History", "Customize"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === tab ? "#8b5cf6" : "#1a1a1a",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab */}
      <div>
        {activeTab === "Workout" && (
          <WorkoutView
            currentWorkoutType={currentWorkoutType}
            setCurrentWorkoutType={setCurrentWorkoutType}
            exercises={exercises}
            setExercises={setExercises}
            finishWorkout={finishWorkout}
          />
        )}
        {activeTab === "History" && (
          <HistoryView history={history} deleteWorkout={deleteWorkout} />
        )}
        {activeTab === "Customize" && (
          <CustomizeView
            workoutAExercises={workoutAExercises}
            setWorkoutAExercises={setWorkoutAExercises}
            workoutBExercises={workoutBExercises}
            setWorkoutBExercises={setWorkoutBExercises}
          />
        )}
      </div>
    </div>
  );
}

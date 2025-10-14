import React, { useState, useEffect } from "react";
import WorkoutView from "./WorkoutView";
import CustomizeView from "./CustomizeView";
import HistoryView from "./HistoryView";

export default function App() {
  const [currentTab, setCurrentTab] = useState("Workout");
  const [workoutA, setWorkoutA] = useState([]);
  const [workoutB, setWorkoutB] = useState([]);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load from localStorage
    const savedA = JSON.parse(localStorage.getItem("workoutA"));
    const savedB = JSON.parse(localStorage.getItem("workoutB"));
    const savedHistory = JSON.parse(localStorage.getItem("history")) || [];
    const savedLast = localStorage.getItem("lastWorkout");

    setWorkoutA(savedA || defaultWorkout("A"));
    setWorkoutB(savedB || defaultWorkout("B"));
    setHistory(savedHistory);
    setLastWorkout(savedLast);
  }, []);

  const defaultWorkout = (type) => {
    if (type === "A") {
      return [
        { name: "Squat", weight: 0, setsCompleted: [false, false, false, false, false] },
        { name: "Bench Press", weight: 0, setsCompleted: [false, false, false, false, false] },
        { name: "Barbell Row", weight: 0, setsCompleted: [false, false, false, false, false] }
      ];
    } else {
      return [
        { name: "Squat", weight: 0, setsCompleted: [false, false, false, false, false] },
        { name: "Overhead Press", weight: 0, setsCompleted: [false, false, false, false, false] },
        { name: "Back Extension", weight: 0, setsCompleted: [false, false, false, false, false] }
      ];
    }
  };

  const saveState = () => {
    localStorage.setItem("workoutA", JSON.stringify(workoutA));
    localStorage.setItem("workoutB", JSON.stringify(workoutB));
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("lastWorkout", lastWorkout);
  };

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",       // full screen
        maxWidth: 500,            // center on larger screens
        margin: "0 auto",
        fontSize: "1.25rem",      // larger text for mobile
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>TJ's 5x5s</h1>

      {/* Tab selector */}
      <div style={{ display: "flex", marginBottom: 20 }}>
        {["Workout", "Customize", "History"].map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            style={{
              flex: 1,
              padding: 15,
              fontSize: "1.1rem",
              backgroundColor: currentTab === tab ? "#6b21a8" : "#ddd",
              color: currentTab === tab ? "#fff" : "#000",
              border: "none",
              cursor: "pointer"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Show last workout */}
      {currentTab === "Workout" && lastWorkout && (
        <p style={{ textAlign: "center", marginBottom: 10 }}>
          Last workout: {lastWorkout}
        </p>
      )}

      {/* Tabs */}
      {currentTab === "Workout" && (
        <WorkoutView
          workoutA={workoutA}
          setWorkoutA={setWorkoutA}
          workoutB={workoutB}
          setWorkoutB={setWorkoutB}
          lastWorkout={lastWorkout}
          setLastWorkout={setLastWorkout}
          history={history}
          setHistory={setHistory}
          saveState={saveState}
        />
      )}
      {currentTab === "Customize" && (
        <CustomizeView
          workoutA={workoutA}
          setWorkoutA={setWorkoutA}
          workoutB={workoutB}
          setWorkoutB={setWorkoutB}
          saveState={saveState}
        />
      )}
      {currentTab === "History" && <HistoryView history={history} />}
    </div>
  );
}

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
      let numericValue = Number(value);
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
        newExercises[index].setsCompleted = Array.from(
          { length: numericValue || 5 },
          () => false
        );
      }
    } else {
      newExercises[index][field] = value;
    }

    return newExercises;
  };

  const removeExercise = (workout, setWorkout, index) => {
    const confirmed = window.confirm("Delete this exercise?");
    if (confirmed) {
      const newExercises = workout.filter((_, i) => i !== index);
      setWorkout(newExercises);
    }
  };

  const addExercise = (workout, setWorkout) => {
    const newExercise = {
      name: "New Exercise",
      reps: 10,
      sets: 5,
      weight: 0,
      setsCompleted: Array.from({ length: 5 }, () => false),
    };
    setWorkout([...workout, newExercise]);
  };

  const renderExercises = (workout, setWorkout) =>
    workout.map((ex, idx) => (
      <div
        key={idx}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          backgroundColor: "#1a1a1a",
          padding: "0.5rem 0.75rem",
          borderRadius: "8px",
          marginTop: "0.5rem",
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Delete button */}
        <span
          onClick={() => removeExercise(workout, setWorkout, idx)}
          style={{
            position: "absolute",
            top: "6px",
            right: "8px",
            color: "#ff5555",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "1.5rem",
            transition: "color 0.2s",
            zIndex: 2,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff8888")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#ff5555")}
        >
          ×
        </span>

        {/* Exercise name */}
        <input
          type="text"
          value={ex.name}
          onChange={(e) =>
            setWorkout(updateExercise(workout, idx, "name", e.target.value))
          }
          style={{
            width: "calc(100% - 2rem)",
            backgroundColor: "#121212",
            border: "1px solid #333",
            color: "#fff",
            borderRadius: "6px",
            padding: "0.4rem",
            marginBottom: "0.3rem",
            paddingRight: "1.75rem", 
            boxSizing: "border-box",
          }}
        />

        {/* Reps input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <input
            type="number"
            value={ex.reps}
            onChange={(e) =>
              setWorkout(updateExercise(workout, idx, "reps", e.target.value))
            }
            style={{
              width: "50px",
              backgroundColor: "#121212",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.4rem",
              textAlign: "center",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "0.9rem" }}>reps</span>
        </div>

        {/* Sets input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <input
            type="number"
            value={ex.sets}
            onChange={(e) =>
              setWorkout(updateExercise(workout, idx, "sets", e.target.value))
            }
            style={{
              width: "50px",
              backgroundColor: "#121212",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.4rem",
              textAlign: "center",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "0.9rem" }}>sets</span>
        </div>

        {/* Weight input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <input
            type="number"
            value={ex.weight === 0 ? "" : ex.weight}
            onChange={(e) =>
              setWorkout(updateExercise(workout, idx, "weight", e.target.value))
            }
            placeholder="0"
            style={{
              width: "70px",
              backgroundColor: "#121212",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.4rem",
              textAlign: "center",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "0.9rem" }}>lbs</span>
        </div>
      </div>
    ));

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#121212",
        padding: "1rem 0",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "hidden",
      }}
    >
      {/* Inner wrapper */}
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "0 1rem",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Customize Workouts
        </h1>

        <h2 style={{ textAlign: "center" }}>Workout A</h2>
        {renderExercises(workoutAExercises, setWorkoutAExercises)}

        {/* Add Exercise Button for Workout A */}
        <button
          onClick={() => addExercise(workoutAExercises, setWorkoutAExercises)}
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.6rem",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#222222")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#1a1a1a")
          }
        >
          + Add Exercise
        </button>

        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ textAlign: "center" }}>Workout B</h2>
          {renderExercises(workoutBExercises, setWorkoutBExercises)}

          {/* Add Exercise Button for Workout B */}
          <button
            onClick={() => addExercise(workoutBExercises, setWorkoutBExercises)}
            style={{
              marginTop: "0.75rem",
              width: "100%",
              padding: "0.6rem",
              backgroundColor: "#1a1a1a",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#222222")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1a1a1a")
            }
          >
            + Add Exercise
          </button>
        </div>
      </div>
    </div>
  );
}

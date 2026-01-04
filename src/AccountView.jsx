import React, { useEffect, useState } from "react";

export default function AccountView({
  preferredUnit,
  setPreferredUnit,
  sessionEmailMasked,
  isSignedIn,
  onRequestEmailChange,
  onVerifyEmailChangeCode, // (newEmail: string, code: string) => Promise<void>
  emailChangeBusy,
  emailChangeMessage,
  onRefreshAuthStatus,
}) {
  const [showEmailEditor, setShowEmailEditor] = useState(false);

  // Email change flow state:
  // step "request": user enters new email and taps "Send code"
  // step "verify": user enters code and taps "Confirm"
  const [emailStep, setEmailStep] = useState("request"); // "request" | "verify"
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");

  // If the user signs out while the editor is open, close it and reset.
  useEffect(() => {
    if (!isSignedIn) {
      setShowEmailEditor(false);
      setEmailStep("request");
      setNewEmail("");
      setCode("");
    }
  }, [isSignedIn]);

  const panelStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "1rem",
  };

  const sectionDividerStyle = {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #333",
  };

  const subtleTextStyle = { color: "#aaa" };

  const buttonBase = {
    backgroundColor: "#121212",
    border: "1px solid #333",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.5rem 0.9rem",
    cursor: "pointer",
  };

  const primaryButton = {
    width: "100%",
    marginTop: "0.6rem",
    padding: "0.75rem 1rem",
    backgroundColor: "#8b5cf6",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const unitsButton = (unit) => ({
    backgroundColor: preferredUnit === unit ? "#8b5cf6" : "#121212",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "0.45rem 0.9rem",
    cursor: "pointer",
    fontWeight: preferredUnit === unit ? "bold" : "normal",
  });

  const disabledStyles = (disabled) => ({
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.7 : 1,
  });

  const canEditEmail =
    isSignedIn &&
    typeof onRequestEmailChange === "function" &&
    typeof onRefreshAuthStatus === "function" &&
    typeof onVerifyEmailChangeCode === "function";

  const resetEmailEditor = () => {
    setShowEmailEditor(false);
    setEmailStep("request");
    setNewEmail("");
    setCode("");
  };

  const submitEmailRequest = async () => {
    const nextEmail = String(newEmail || "").trim();
    if (!nextEmail) return;

    await onRequestEmailChange(nextEmail);
    // If the request succeeded, App should set a helpful message.
    // We move to verify step regardless so the UI guides the user.
    setEmailStep("verify");
  };

  const submitCodeVerify = async () => {
    const nextEmail = String(newEmail || "").trim();
    const token = String(code || "").trim();
    if (!nextEmail || !token) return;

    await onVerifyEmailChangeCode(nextEmail, token);

    // After verification, refresh session so the banner/email updates.
    await onRefreshAuthStatus();

    // Keep it simple: close the editor.
    resetEmailEditor();
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "0.75rem 1rem 1.25rem",
        boxSizing: "border-box",
      }}
    >
      <div style={panelStyle}>
        {/* Units */}
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Units</div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => setPreferredUnit("lb")} style={unitsButton("lb")}>
            lb
          </button>

          <button onClick={() => setPreferredUnit("kg")} style={unitsButton("kg")}>
            kg
          </button>
        </div>

        {/* Email */}
        <div style={sectionDividerStyle}>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Email</div>

          {!canEditEmail ? (
            <div style={subtleTextStyle}>Sign in above to manage your email.</div>
          ) : (
            <>
              <div style={{ ...subtleTextStyle, overflowWrap: "anywhere" }}>
                Current: {sessionEmailMasked || ""}
              </div>

              <div
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    if (showEmailEditor) {
                      resetEmailEditor();
                    } else {
                      setShowEmailEditor(true);
                      setEmailStep("request");
                      setNewEmail("");
                      setCode("");
                    }
                  }}
                  style={buttonBase}
                >
                  {showEmailEditor ? "Cancel" : "Change email"}
                </button>

                <button
                  onClick={onRefreshAuthStatus}
                  disabled={emailChangeBusy}
                  style={{ ...buttonBase, ...disabledStyles(emailChangeBusy) }}
                >
                  Refresh status
                </button>
              </div>

              {showEmailEditor && (
                <div style={{ marginTop: "0.75rem" }}>
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                    }}
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={emailChangeBusy || emailStep === "verify"}
                  />

                  {emailStep === "request" ? (
                    <button
                      onClick={submitEmailRequest}
                      disabled={emailChangeBusy || !String(newEmail || "").trim()}
                      style={{
                        ...primaryButton,
                        ...disabledStyles(
                          emailChangeBusy || !String(newEmail || "").trim()
                        ),
                      }}
                    >
                      Send code
                    </button>
                  ) : (
                    <>
                      <div style={{ marginTop: "0.6rem", ...subtleTextStyle }}>
                        Enter the code sent to your new email.
                      </div>

                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Code"
                        style={{
                          width: "100%",
                          marginTop: "0.6rem",
                          padding: "0.6rem",
                          borderRadius: "8px",
                          boxSizing: "border-box",
                        }}
                        inputMode="numeric"
                        autoCapitalize="none"
                        autoCorrect="off"
                        disabled={emailChangeBusy}
                      />

                      <button
                        onClick={submitCodeVerify}
                        disabled={
                          emailChangeBusy ||
                          !String(code || "").trim() ||
                          !String(newEmail || "").trim()
                        }
                        style={{
                          ...primaryButton,
                          ...disabledStyles(
                            emailChangeBusy ||
                              !String(code || "").trim() ||
                              !String(newEmail || "").trim()
                          ),
                        }}
                      >
                        Confirm email change
                      </button>

                      <button
                        onClick={submitEmailRequest}
                        disabled={emailChangeBusy || !String(newEmail || "").trim()}
                        style={{
                          width: "100%",
                          marginTop: "0.6rem",
                          padding: "0.6rem 1rem",
                          backgroundColor: "#121212",
                          border: "1px solid #333",
                          color: "#fff",
                          borderRadius: "8px",
                          cursor:
                            emailChangeBusy || !String(newEmail || "").trim()
                              ? "default"
                              : "pointer",
                          opacity:
                            emailChangeBusy || !String(newEmail || "").trim()
                              ? 0.7
                              : 1,
                        }}
                      >
                        Resend code
                      </button>

                      <button
                        onClick={() => {
                          setEmailStep("request");
                          setCode("");
                        }}
                        disabled={emailChangeBusy}
                        style={{
                          width: "100%",
                          marginTop: "0.6rem",
                          padding: "0.6rem 1rem",
                          backgroundColor: "#121212",
                          border: "1px solid #333",
                          color: "#fff",
                          borderRadius: "8px",
                          cursor: emailChangeBusy ? "default" : "pointer",
                          opacity: emailChangeBusy ? 0.7 : 1,
                        }}
                      >
                        Change new email
                      </button>
                    </>
                  )}
                </div>
              )}

              {emailChangeMessage ? (
                <div style={{ marginTop: "0.75rem", color: "#aaa" }}>
                  {emailChangeMessage}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

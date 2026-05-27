"use client";

import { useState } from "react";

export default function Home() {
  const [unlockDate, setUnlockDate] = useState("");
  const [preview, setPreview] = useState(null);
  const [opened, setOpened] = useState(false);

  function handleImage(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  }

  function openCapsule() {
    if (!unlockDate) {
      alert("Select unlock date first");
      return;
    }

    setOpened(true);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right,#12001f,#000)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "#111",
          borderRadius: "28px",
          padding: "40px",
          border: "1px solid #222",
        }}
      >
        <h1 style={{ fontSize: "64px", marginBottom: "10px" }}>
          MonVault
        </h1>

        <p style={{ color: "#aaa", marginBottom: "24px" }}>
          NFT Time Capsules on Monad Testnet
        </p>

        <div style={{ marginTop: "24px" }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            style={{
              color: "white",
            }}
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        {preview && (
          <div style={{ marginTop: "30px", textAlign: "center" }}>
            <img
              src={preview}
              alt="preview"
              style={{
                width: "100%",
                borderRadius: "24px",
                transition: "1s",
                transform: opened
                  ? "scale(1.04) rotate(2deg)"
                  : "scale(1)",
                boxShadow: opened
                  ? "0px 0px 50px #9333ea"
                  : "0px 0px 0px transparent",
              }}
            />

            {unlockDate && (
              <button
                onClick={openCapsule}
                style={{
                  marginTop: "20px",
                  padding: "14px 24px",
                  borderRadius: "14px",
                  background: "#6d28d9",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Open Capsule Animation
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

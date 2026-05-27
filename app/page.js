"use client";

import { useState } from "react";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [preview, setPreview] = useState(null);
  const [minted, setMinted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  }

  function handleImage(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  }

  async function mintCapsule() {
    if (!wallet) {
      alert("Connect wallet first");
      return;
    }

    if (!preview) {
      alert("Upload image first");
      return;
    }

    if (!unlockDate) {
      alert("Select unlock date");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setMinted(true);
      alert("Time Capsule Minted!");
    }, 2000);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #2d0b52 0%, #12001f 35%, #000 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "820px",
          background: "rgba(17,17,17,0.9)",
          borderRadius: "32px",
          padding: "40px",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0px 0px 80px rgba(147,51,234,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "68px",
                margin: 0,
                background:
                  "linear-gradient(to right,#c084fc,#9333ea,#7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "900",
              }}
            >
              MonVault
            </h1>

            <p
              style={{
                color: "#b3b3b3",
                marginTop: "10px",
                fontSize: "18px",
              }}
            >
              NFT Time Capsules on Monad Testnet
            </p>
          </div>

          <button
            onClick={connectWallet}
            style={{
              padding: "14px 22px",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: wallet
                ? "linear-gradient(to right,#16a34a,#22c55e)"
                : "linear-gradient(to right,#7c3aed,#9333ea)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "15px",
              boxShadow: "0px 0px 30px rgba(147,51,234,0.35)",
            }}
          >
            {wallet
              ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>

        <div
          style={{
            border: "2px dashed rgba(255,255,255,0.12)",
            borderRadius: "24px",
            padding: "30px",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            style={{
              color: "white",
              fontSize: "16px",
            }}
          />

          <p
            style={{
              color: "#9f9f9f",
              marginTop: "14px",
              fontSize: "14px",
            }}
          >
            Upload memories, letters, art, screenshots or moments for your future self.
          </p>
        </div>

        <div style={{ marginTop: "26px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              color: "#d4d4d4",
              fontWeight: "600",
            }}
          >
            Unlock Date & Time
          </label>

          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0f0f0f",
              color: "white",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={mintCapsule}
          disabled={loading}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "20px",
            borderRadius: "22px",
            border: "none",
            background:
              "linear-gradient(to right,#7c3aed,#9333ea,#c084fc)",
            color: "white",
            fontWeight: "800",
            fontSize: "18px",
            cursor: "pointer",
            transition: "0.3s",
            boxShadow: "0px 0px 40px rgba(147,51,234,0.45)",
          }}
        >
          {loading ? "Minting Capsule..." : "Mint Time Capsule"}
        </button>

        {preview && (
          <div
            style={{
              marginTop: "34px",
              position: "relative",
            }}
          >
            <img
              src={preview}
              alt="preview"
              style={{
                width: "100%",
                borderRadius: "28px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: minted
                  ? "0px 0px 60px rgba(192,132,252,0.6)"
                  : "0px 0px 20px rgba(0,0,0,0.4)",
                transform: minted
                  ? "scale(1.02)"
                  : "scale(1)",
                transition: "1s",
              }}
            />

            {minted && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background:
                    "linear-gradient(to right,#16a34a,#22c55e)",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  boxShadow: "0px 0px 20px rgba(34,197,94,0.5)",
                }}
              >
                Capsule Minted ✨
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

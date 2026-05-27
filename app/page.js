"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xa131AD247055FD2e2aA8b156A11bdEc81b9eAD95";

const ABI = [
  "function mintCapsule(string memory metadataURI,uint256 unlockDate) public",
  "function nextTokenId() view returns(uint256)",
  "function ownerOf(uint256 tokenId) view returns(address)",
  "function getCapsule(uint256 tokenId) view returns(string memory,uint256,uint256,bool)"
];

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [preview, setPreview] = useState(null);
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setWallet(accounts[0]);
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

    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const unlockTimestamp = Math.floor(
        new Date(unlockDate).getTime() / 1000
      );

      const tx = await contract.mintCapsule(
        preview,
        unlockTimestamp
      );

      await tx.wait();

      alert("Capsule Minted!");

      loadNFTs();
    } catch (err) {
      console.log(err);
      alert("Mint failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadNFTs() {
    if (!wallet) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        provider
      );

      const total = await contract.nextTokenId();

      const items = [];

      for (let i = 1; i <= Number(total); i++) {
        try {
          const owner = await contract.ownerOf(i);

          if (owner.toLowerCase() === wallet.toLowerCase()) {
            const capsule = await contract.getCapsule(i);

            items.push({
              tokenId: i,
              image: capsule[0],
              unlockDate: new Date(
                Number(capsule[1]) * 1000
              ).toLocaleString(),
              opened: capsule[3],
            });
          }
        } catch {}
      }

      setMintedNFTs(items.reverse());
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (wallet) {
      loadNFTs();
    }
  }, [wallet]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top,#34115c 0%,#12001f 35%,#000 100%)",
        color: "white",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "72px",
                margin: 0,
                fontWeight: "900",
                background:
                  "linear-gradient(to right,#c084fc,#9333ea,#7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MonVault
            </h1>

            <p
              style={{
                color: "#a3a3a3",
                marginTop: "10px",
              }}
            >
              NFT Time Capsules on Monad Testnet
            </p>
          </div>

          <button
            onClick={connectWallet}
            style={{
              padding: "14px 24px",
              borderRadius: "18px",
              border: "none",
              background:
                "linear-gradient(to right,#7c3aed,#9333ea)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0px 0px 30px rgba(147,51,234,0.4)",
            }}
          >
            {wallet
              ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "30px",
            padding: "30px",
            backdropFilter: "blur(20px)",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            style={{
              color: "white",
            }}
          />

          <div style={{ marginTop: "24px" }}>
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
                background: "#111",
                color: "white",
              }}
            />
          </div>

          <button
            onClick={mintCapsule}
            disabled={loading}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "18px",
              borderRadius: "20px",
              border: "none",
              background:
                "linear-gradient(to right,#7c3aed,#9333ea,#c084fc)",
              color: "white",
              fontWeight: "800",
              fontSize: "18px",
              cursor: "pointer",
              boxShadow: "0px 0px 40px rgba(147,51,234,0.4)",
            }}
          >
            {loading ? "Minting..." : "Mint Time Capsule"}
          </button>

          {preview && (
            <img
              src={preview}
              alt="preview"
              style={{
                width: "100%",
                marginTop: "24px",
                borderRadius: "24px",
              }}
            />
          )}
        </div>

        <div style={{ marginTop: "50px" }}>
          <h2
            style={{
              fontSize: "42px",
              marginBottom: "24px",
            }}
          >
            My Capsules
          </h2>

          {mintedNFTs.length === 0 ? (
            <div
              style={{
                padding: "30px",
                borderRadius: "24px",
                background: "rgba(255,255,255,0.04)",
                color: "#a3a3a3",
              }}
            >
              No capsules minted yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(280px,1fr))",
                gap: "24px",
              }}
            >
              {mintedNFTs.map((nft) => (
                <div
                  key={nft.tokenId}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "26px",
                    overflow: "hidden",
                    boxShadow:
                      "0px 0px 30px rgba(147,51,234,0.2)",
                  }}
                >
                  <img
                    src={nft.image}
                    alt="nft"
                    style={{
                      width: "100%",
                      height: "260px",
                      objectFit: "cover",
                    }}
                  />

                  <div style={{ padding: "20px" }}>
                    <h3>Capsule #{nft.tokenId}</h3>

                    <p
                      style={{
                        color: "#b3b3b3",
                        fontSize: "14px",
                      }}
                    >
                      Unlocks: {nft.unlockDate}
                    </p>

                    <div
                      style={{
                        marginTop: "14px",
                        padding: "10px 14px",
                        borderRadius: "999px",
                        display: "inline-block",
                        background: nft.opened
                          ? "#16a34a"
                          : "#7c3aed",
                        fontWeight: "bold",
                      }}
                    >
                      {nft.opened
                        ? "Opened"
                        : "Locked"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

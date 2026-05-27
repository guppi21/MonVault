"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const CONTRACT_ADDRESS = "PASTE_YOUR_CONTRACT_ADDRESS";

const ABI = [
  "function mintCapsule(string memory metadataURI,uint256 unlockDate) public",
  "function nextTokenId() view returns(uint256)",
  "function ownerOf(uint256 tokenId) view returns(address)",
  "function getCapsule(uint256 tokenId) view returns(string memory,uint256,uint256,bool)"
];

export default function Home() {

  const [wallet, setWallet] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [capsules, setCapsules] = useState([]);

  async function connectWallet() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setWallet(accounts[0]);
  }

  function handleImage(e) {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  }

  async function uploadToIPFS() {

    const formData = new FormData();

    formData.append(
      "file",
      selectedFile,
      selectedFile.name
    );

    const imageUpload = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    const imageHash = imageUpload.data.IpfsHash;

    const metadata = {
      name: "MonVault Capsule",
      description: "NFT Time Capsule",
      image: `ipfs://${imageHash}`,
    };

    const metadataUpload = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    return `ipfs://${metadataUpload.data.IpfsHash}`;
  }

  async function mintCapsule() {

    try {

      if (!wallet) {
        alert("Connect wallet first");
        return;
      }

      if (!selectedFile) {
        alert("Upload image");
        return;
      }

      setLoading(true);

      const metadataURI = await uploadToIPFS();

      const provider = new ethers.BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const unlockTimestamp = Math.floor(
        Date.parse(unlockDate) / 1000
      );

      const tx = await contract.mintCapsule(
        metadataURI,
        unlockTimestamp
      );

      await tx.wait();

      alert("Capsule Minted!");

      loadCapsules(wallet);

    } catch (err) {

      console.log(err);

      alert(
        err.reason ||
        err.message ||
        "Mint failed"
      );

    } finally {

      setLoading(false);

    }
  }

  function getRemainingTime(unlockDate) {

    const now = Math.floor(Date.now() / 1000);

    const diff = unlockDate - now;

    if (diff <= 0) {
      return "Unlocked";
    }

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins = Math.floor((diff % 3600) / 60);

    return `${days}d ${hours}h ${mins}m`;
  }

  async function loadCapsules(currentWallet) {

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

          if (
            owner.toLowerCase() === currentWallet.toLowerCase()
          ) {

            const capsule = await contract.getCapsule(i);

            let metadataURL = capsule[0];

            if (metadataURL.startsWith("ipfs://")) {
              metadataURL = metadataURL.replace(
                "ipfs://",
                "https://gateway.pinata.cloud/ipfs/"
              );
            }

            const metadata = await fetch(metadataURL)
              .then((res) => res.json());

            let imageURL = metadata.image;

            if (imageURL.startsWith("ipfs://")) {
              imageURL = imageURL.replace(
                "ipfs://",
                "https://gateway.pinata.cloud/ipfs/"
              );
            }

            items.push({
              tokenId: i,
              image: imageURL,
              unlockDate: Number(capsule[1]),
            });

          }

        } catch (err) {
          console.log(err);
        }
      }

      setCapsules(items.reverse());

    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (wallet) {
      loadCapsules(wallet);
    }
  }, [wallet]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px",
        background:
          "linear-gradient(135deg,#ff00c8 0%,#7c3aed 50%,#00d4ff 100%)",
        fontFamily: "cursive",
        color: "white",
      }}
    >

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >

        <h1
          style={{
            fontSize: "84px",
            marginBottom: "10px",
          }}
        >
          MonVault ✨
        </h1>

        <p
          style={{
            color: "white",
            opacity: 0.8,
            marginBottom: "30px",
          }}
        >
          Hide memories for your future self.
        </p>

        <button
          onClick={connectWallet}
          style={{
            padding: "16px 24px",
            borderRadius: "20px",
            border: "none",
            background: "#fff",
            color: "#7c3aed",
            fontWeight: "900",
            cursor: "pointer",
            marginBottom: "30px",
          }}
        >
          {wallet
            ? `${wallet.slice(0,6)}...${wallet.slice(-4)}`
            : "Connect Wallet"}
        </button>

        <div
          style={{
            background: "rgba(255,255,255,0.18)",
            padding: "30px",
            borderRadius: "28px",
            backdropFilter: "blur(16px)",
            border: "3px dashed rgba(255,255,255,0.35)",
          }}
        >

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
          />

          <div style={{ marginTop: "20px" }}>
            <input
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "18px",
                border: "none",
                background: "#fff",
                color: "#000",
                fontWeight: "bold",
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
              borderRadius: "22px",
              border: "none",
              background:
                "linear-gradient(to right,#ff00c8,#7c3aed,#00d4ff)",
              color: "white",
              fontWeight: "900",
              fontSize: "20px",
              cursor: "pointer",
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

        <div style={{ marginTop: "60px" }}>

          <h2
            style={{
              fontSize: "54px",
              marginBottom: "24px",
            }}
          >
            My Capsules 🔒
          </h2>

          {capsules.length === 0 ? (

            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                padding: "30px",
                borderRadius: "24px",
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

              {capsules.map((capsule) => {

                const unlocked =
                  Math.floor(Date.now() / 1000) >=
                  capsule.unlockDate;

                return (

                  <div
                    key={capsule.tokenId}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: "28px",
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(16px)",
                      border: "3px dashed rgba(255,255,255,0.35)",
                    }}
                  >

                    <img
                      src={capsule.image}
                      alt="capsule"
                      style={{
                        width: "100%",
                        height: "280px",
                        objectFit: "cover",
                        filter: unlocked
                          ? "blur(0px)"
                          : "blur(18px)",
                        transition: "0.5s",
                      }}
                    />

                    {!unlocked && (

                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform:
                            "translate(-50%,-50%)",
                          background:
                            "rgba(0,0,0,0.55)",
                          padding: "18px 24px",
                          borderRadius: "20px",
                          textAlign: "center",
                          backdropFilter: "blur(8px)",
                        }}
                      >

                        <div
                          style={{
                            fontSize: "34px",
                          }}
                        >
                          ⏳
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            fontWeight: "900",
                            fontSize: "20px",
                          }}
                        >
                          {getRemainingTime(
                            capsule.unlockDate
                          )}
                        </div>

                      </div>

                    )}

                    <div style={{ padding: "20px" }}>

                      <h3
                        style={{
                          fontSize: "34px",
                        }}
                      >
                        Capsule #{capsule.tokenId}
                      </h3>

                      <p>
                        {new Date(
                          capsule.unlockDate * 1000
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}

"use client";

import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const CONTRACT_ADDRESS = "0x652c9ACcC53e765e1d96e2455E618dAaB79bA595";

const ABI = [
  "function mintCapsule(string memory metadataURI,uint256 unlockDate) public"
];

export default function Home() {

  const [wallet, setWallet] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

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
        maxBodyLength: Infinity,

        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    const imageHash = imageUpload.data.IpfsHash;

    const imageURL = `ipfs://${imageHash}`;

    const metadata = {
      name: "MonVault Capsule",
      description: "NFT Time Capsule on Monad",
      image: imageURL,
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
        alert("Upload image first");
        return;
      }

      if (!unlockDate) {
        alert("Select unlock date");
        return;
      }

      setLoading(true);

      const metadataURI = await uploadToIPFS();

      // ENS FIX
      const provider = new ethers.BrowserProvider(
        window.ethereum,
        {
          name: "monad",
          chainId: 10143,
          ensAddress: null,
        }
      );

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

      alert("Capsule Minted Successfully!");

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
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "900",
          }}
        >
          MonVault
        </h1>

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
          }}
        >
          {wallet
            ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
            : "Connect Wallet"}
        </button>

        <div
          style={{
            marginTop: "30px",
            background: "rgba(255,255,255,0.04)",
            padding: "30px",
            borderRadius: "24px",
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

          <div style={{ marginTop: "20px" }}>
            <input
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "18px",
                background: "#111",
                color: "white",
                border: "1px solid #333",
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
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

const ABI = [
  "function mintCapsule(string memory metadataURI,uint256 unlockDate) public",
  "function getCapsule(uint256 tokenId) public view returns(string memory,uint256,uint256)",
  "function canOpenCapsule(uint256 tokenId) public view returns(bool)"
];

const MONAD_TESTNET = {
  chainId: "0x279F",
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [unlockDate, setUnlockDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [opened, setOpened] = useState(false);

  async function connectWallet() {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [MONAD_TESTNET],
      });

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
    setSelectedFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  }

  async function uploadToIPFS() {
    const formData = new FormData();

    formData.append("file", selectedFile);

    const fileUpload = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    const imageHash = fileUpload.data.IpfsHash;

    const imageURL = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

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

    return `https://gateway.pinata.cloud/ipfs/${metadataUpload.data.IpfsHash}`;
  }

  async function mintNFT() {
    try {
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
        new Date(unlockDate).getTime() / 1000
      );

      const tx = await contract.mintCapsule(
        metadataURI,
        unlockTimestamp
      );

      await tx.wait();

      alert("Capsule Minted Successfully!");
    } catch (err) {
      console.log(err);
      alert("Mint Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!unlockDate) return;

    const interval = setInterval(() => {
      const distance = new Date(unlockDate) - new Date();

      if (distance < 0) {
        setCountdown("Capsule unlocked!");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / 1000 / 60) % 60);

      setCountdown(`${days}d ${hours}h ${minutes}m remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockDate]);

  function openCapsule() {
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
          boxShadow: "0px 0px 60px rgba(147,51,234,0.3)",
        }}
      >
        <h1 style={{ fontSize: "64px", marginBottom: "10px" }}>
          MonVault
        </h1>

        <p style={{ color: "#aaa", marginBottom: "24px" }}>
          NFT Time Capsules on Monad Testnet
        </p>

        <button
          onClick={connectWallet}
          style={{
            padding: "14px 24px",
            borderRadius: "16px",
            background: "#7c3aed",
            border: "none",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {wallet ? "Wallet Connected" : "Connect Wallet"}
        </button>

        <div style={{ marginTop: "24px" }}>
          <input type="file" accept="image/*" onChange={handleImage} />
        </div>

        <div style={{ marginTop: "20px" }}>
          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid #333",
              background: "#000",
              color: "white",
            }}
          />
        </div>

        {countdown && (
          <div
            style={{
              marginTop: "18px",
              color: "#a855f7",
              fontWeight: "bold",
            }}
          >
            {countdown}
          </div>
        )}

        <button
          onClick={mintNFT}
          disabled={loading}
          style={{
            marginTop: "24px",
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: "#9333ea",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Minting..." : "Mint Capsule"}
        </button>

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
              }}
            >
              Open Capsule Animation
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

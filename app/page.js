"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const CONTRACT_ADDRESS = "0x652c9ACcC53e765e1d96e2455E618dAaB79bA595";

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
              unlockDate: new Date(
                Number(capsule[1]) * 1000
              ).toLocaleString(),
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

      alert("Capsule Minted Successfully!");

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

  useEffect(() => {

    if (wallet) {
      loadCapsules(wallet);
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
                fontWeight: "900",
                margin: 0,
              }}
            >
              MonVault
            </h1>

            <p style={{ color: "#aaa" }}>
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
            }}
          >
            {wallet
              ? `${wallet.slice(0,6)}...${wallet.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            padding: "30px",
            borderRadius: "24px",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            style={{ color: "white" }}
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

        <div style={{ marginTop: "60px" }}>

          <h2
            style={{
              fontSize: "42px",
              marginBottom: "24px",
            }}
          >
            My Capsules
          </h2>

          {capsules.length === 0 ? (

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: "30px",
                borderRadius: "24px",
                color: "#aaa",
              }}
            >
              No capsules found yet.
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
              {capsules.map((capsule) => (

                <div
                  key={capsule.tokenId}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={capsule.image}
                    alt="capsule"
                    style={{
                      width: "100%",
                      height: "260px",
                      objectFit: "cover",
                    }}
                  />

                  <div style={{ padding: "20px" }}>

                    <h3>Capsule #{capsule.tokenId}</h3>

                    <p style={{ color: "#aaa" }}>
                      Unlocks:
                    </p>

                    <p>
                      {capsule.unlockDate}
                    </p>

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

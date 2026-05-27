"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function connectWallet() {

    try {

      if (!window.ethereum) {
        alert("Install MetaMask");
        return;
      }

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

    const imageUpload = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    const imageHash = imageUpload.data.IpfsHash;

    // PROPER IPFS FORMAT
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

    // PROPER IPFS FORMAT
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

      await loadNFTs(wallet);

    } catch (err) {

      console.log(err);

      if (err.reason) {
        alert(err.reason);
      } else {
        alert("Mint failed");
      }

    } finally {
      setLoading(false);
    }
  }

  async function loadNFTs(currentWallet) {

    try {

      const provider = new ethers.BrowserProvider(window.ethereum);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        provider
      );

      const total = await contract.nextTokenId();

      const allNFTs = [];

      for (let i = 1; i <= Number(total); i++) {

        try {

          const owner = await contract.ownerOf(i);

          if (
            owner.toLowerCase() === currentWallet.toLowerCase()
          ) {

            const capsule = await contract.getCapsule(i);

            let metadataURL = capsule[0];

            // FIX METADATA URL
            if (metadataURL.startsWith("ipfs://")) {
              metadataURL = metadataURL.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              );
            }

            const response = await fetch(metadataURL);

            const metadata = await response.json();

            let imageURL = metadata.image;

            // FIX IMAGE URL
            if (imageURL.startsWith("ipfs://")) {
              imageURL = imageURL.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              );
            }

            allNFTs.push({
              tokenId: i,
              image: imageURL,
              unlockDate: new Date(
                Number(capsule[1]) * 1000
              ).toLocaleString(),
              opened: capsule[3],
            });

          }

        } catch (err) {
          console.log("NFT LOAD ERROR:", err);
        }
      }

      console.log("NFTS:", allNFTs);

      setMintedNFTs(allNFTs.reverse());

    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {

    if (wallet) {
      loadNFTs(wallet);
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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

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

            <p style={{ color: "#a3a3a3", marginTop: "10px" }}>
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
              {mintedNFTs.map((nft) => (

                <div
                  key={nft.tokenId}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "26px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={nft.image}
                    alt="capsule"
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
                      {nft.opened ? "Opened" : "Locked"}
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

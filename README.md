<br/>
<p align="center">
  <img src="https://i.imgur.com/PbwyosA.png" alt="Logo" width="350">
</p>

<h3 align="center">DataTrace DApp</h3>

<p align="center">
  A Decentralized Data Science Platform to publish, verify, version, and monetize datasets.
  <br/>
</p>

---

## 📋 Table of Contents
- [About the Project](#-about-the-project)
- [Features](#-features)
- [Built With](#-built-with)
- [Getting Started](#-getting-started)
  - [Installation](#installation)
- [Usage / Demo Flow](#-usage--demo-flow)
- [Architecture](#-architecture)

---

##  About the Project

In Data Science, a machine learning model is only as valid as the data it was trained on. Reproducibility, provenance tracking, and fair monetization are some of the biggest challenges researchers and data scientists face today. 

**DataTrace DApp** is a complete Web3 solution that guarantees the integrity and provenance of datasets while enabling creators to securely monetize their work.

### The Problem
- Lack of verifiable data provenance.
- Difficulty in monetizing raw datasets or Jupyter Notebooks securely.
- No immutable version control for scientific data.

### Our Solution
A decentralized marketplace where datasets are tokenized, versioned immutably on the blockchain, and securely stored on IPFS.

##  Features

- **Publish & Monetize:** Upload datasets and Jupyter Notebooks. Set a price in custom tokens (DSET) for users to unlock access.
- **Immutable Versioning:** Maintain a verifiable history. Creators can publish new versions (`v1`, `v2`, etc.) of a dataset seamlessly.
- **Decentralized Access Control:** Access rights are managed securely by Smart Contracts, eliminating the need for a centralized server.
- **Data Integrity Validation:** IPFS storage and SHA-256 hashing guarantee that downloaded files are authentic and tamper-proof.

##  Built With

- **Frontend:** React.js, Vite, Tailwind CSS, Ethers.js
- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin
- **Decentralized Storage:** IPFS via Pinata
- **Wallet Integration:** MetaMask

##  Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) Extension

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/votre-pseudo/project-blockchain.git
   cd project-blockchain
   ```

2. **Install backend dependencies**
   ```sh
   npm install
   ```

3. **Start the local Hardhat blockchain** (Terminal 1)
   ```sh
   npx hardhat node
   ```

4. **Deploy the Smart Contracts** (Terminal 2)
   ```sh
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. **Start the Frontend Application** (Terminal 2)
   ```sh
   cd frontend
   npm install
   npm run dev
   ```

##  Usage / Demo Flow

1. **Connect Wallet:** Open the app and connect your MetaMask wallet (use local Hardhat accounts).
2. **Publish Dataset (Account A):** Navigate to the Publish page. Upload your `.csv` and `.ipynb` files, and set an unlock price (e.g., 50 DSET).
3. **Update Version:** Publish a new version of your dataset linking it to the previous ID.
4. **Purchase Access (Account B):** Switch to Account B in MetaMask. Browse to the dataset, approve the token spend, and purchase access.
5. **Download Securely:** Once unlocked, Account B can securely download the dataset and verify its integrity via IPFS.

##  Architecture
- **`Token.sol`**: ERC20 token (`DSET`) used as the medium of exchange.
- **`DatasetRegistry.sol`**: Manages dataset ownership, versions, pricing, and access rights.
- **IPFS (Pinata)**: Hosts the secure files off-chain while returning a CID stored on-chain.

---
*Built for the DDiB 2026 Hackathon

import axios from 'axios';


export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";


export const uploadToPinata = async (file) => {
  
  
  const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "VOTRE_PINATA_API_KEY_ICI";
  const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || "VOTRE_PINATA_SECRET_KEY_ICI";

  if (PINATA_API_KEY === "VOTRE_PINATA_API_KEY_ICI") {
    console.warn("⚠️ Clés Pinata manquantes, simulation de l'upload IPFS pour la démo.");
    return new Promise(resolve => {
      setTimeout(() => resolve(`QmSimulatedCIDForDemo${Date.now()}`), 1500);
    });
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: "Infinity",
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      }
    });
    return res.data.IpfsHash;
  } catch (error) {
    console.error("Erreur Pinata:", error);
    throw error;
  }
};

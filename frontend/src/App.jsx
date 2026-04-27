import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import { DatabaseZap, ShieldCheck, ArrowRight, Award } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from './components/Navbar';
import PublishDataset from './components/PublishDataset';
import DatasetList from './components/DatasetList';
import ParticleNetwork from './components/ParticleNetwork';
import DataTokenArtifact from './contracts/DataToken.json';
import addresses from './contracts/addresses.json';

function App() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await _provider.send("eth_requestAccounts", []);
        const _signer = await _provider.getSigner();
        
        setProvider(_provider);
        setSigner(_signer);
        setAccount(accounts[0]);
        
        updateBalance(_provider, accounts[0]);
        toast.success("Portefeuille connecté avec succès !");
      } catch (error) {
        toast.error("Erreur de connexion à MetaMask.");
        console.error("Erreur de connexion:", error);
      }
    } else {
      toast.error("Veuillez installer MetaMask !");
    }
  };

  const updateBalance = async (_provider, _account) => {
    try {
      const tokenContract = new ethers.Contract(addresses.DataToken, DataTokenArtifact.abi, _provider);
      const bal = await tokenContract.balanceOf(_account);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error("Erreur solde:", error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (provider) updateBalance(provider, accounts[0]);
          toast.success("Changement de compte détecté.");
        } else {
          setAccount('');
          setBalance('0');
          toast.error("Portefeuille déconnecté.");
        }
      });
    }
  }, [provider]);

  return (
    <Router>
      <ParticleNetwork />
      <Toaster position="bottom-right" toastOptions={{ 
        style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(139, 92, 246, 0.3)' }
      }} />
      <div className="app-container">
        <Navbar 
          account={account} 
          balance={balance} 
          connectWallet={connectWallet} 
        />
        
        <Routes>
          <Route path="/" element={
            <div style={{ textAlign: 'center', padding: '6rem 2rem', position: 'relative' }}>
              
              <div className="animate-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.5rem 1rem', borderRadius: '30px', color: '#c4b5fd', marginBottom: '2rem', fontWeight: '500', boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' }}>
                <ShieldCheck size={18} />
                La Référence Nationale en Data Science Web3
              </div>

              <h1 className="page-title" style={{ fontSize: '5rem', marginBottom: '1.5rem', maxWidth: '1000px', margin: '0 auto', textShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}>
                Donnez de la valeur à vos <span style={{ color: '#8b5cf6' }}>Données</span>.
              </h1>
              
              <p className="page-subtitle" style={{ fontSize: '1.3rem', maxWidth: '750px', margin: '2rem auto 3rem', lineHeight: '1.6' }}>
                Plateforme de recherche certifiée. Partagez, versionnez et monétisez vos datasets scientifiques de manière totalement décentralisée.
              </p>
              
              {!account ? (
                <button className="btn" onClick={connectWallet} style={{ fontSize: '1.2rem', padding: '1.2rem 2.5rem', borderRadius: '50px', transform: 'scale(1.05)' }}>
                  <DatabaseZap size={24} />
                  Connecter Wallet pour Commencer
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                  <a href="/publish" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2rem', borderRadius: '50px' }}>
                    <Award size={20} /> Publier mes Recherches
                  </a>
                  <a href="/datasets" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem', borderRadius: '50px' }}>
                    Explorer le Marché <ArrowRight size={20} />
                  </a>
                </div>
              )}
            </div>
          } />
          <Route path="/publish" element={
            <PublishDataset account={account} signer={signer} onSuccess={() => updateBalance(provider, account)} />
          } />
          <Route path="/datasets" element={
            <DatasetList provider={provider} account={account} />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

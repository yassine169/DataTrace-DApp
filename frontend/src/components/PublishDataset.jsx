import { useState } from 'react';
import { ethers } from 'ethers';
import { Upload, FileText, Plus, Database, Sparkles, Hash, Lock, Globe, FileCheck2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadToPinata } from '../utils/pinata';
import DatasetRegistryArtifact from '../contracts/DatasetRegistry.json';
import addresses from '../contracts/addresses.json';

const PublishDataset = ({ account, signer, onSuccess }) => {
  const [mode, setMode] = useState('new');
  const [datasetId, setDatasetId] = useState(''); 
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [file, setFile] = useState(null);
  const [notebookFile, setNotebookFile] = useState(null);
  
  const [step, setStep] = useState(0); 

  const calculateHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !signer) { toast.error('Connectez MetaMask.'); return; }
    if (!file) { toast.error('Le fichier dataset est obligatoire.'); return; }

    try {
      setStep(1);
      toast.loading("Calcul de l'empreinte cryptographique...", { id: "tx" });
      const dataHash = await calculateHash(file);

      setStep(2);
      toast.loading("Envoi sécurisé vers IPFS...", { id: "tx" });
      const cid = await uploadToPinata(file);
      let notebookCid = '';
      if (notebookFile) {
        notebookCid = await uploadToPinata(notebookFile);
      }

      setStep(3);
      toast.loading("Veuillez signer la transaction MetaMask...", { id: "tx" });
      const registryContract = new ethers.Contract(addresses.DatasetRegistry, DatasetRegistryArtifact.abi, signer);

      let tx;
      if (mode === 'new') {
        const priceWei = ethers.parseEther(price || '0');
        tx = await registryContract.createDataset(title, description, priceWei, cid, dataHash, notebookCid);
      } else {
        tx = await registryContract.publishNewVersion(datasetId, cid, dataHash, notebookCid);
      }
      
      toast.loading("Ancrage en cours sur la blockchain...", { id: "tx" });
      await tx.wait();
      
      setStep(4);
      toast.success("Succès ! Données certifiées sur Ethereum.", { id: "tx" });
      setFile(null); setNotebookFile(null); setTitle(''); setDescription(''); setPrice('0');
      if (onSuccess) onSuccess();

      setTimeout(() => setStep(0), 5000); 

    } catch (err) {
      console.error(err);
      toast.error('Transaction échouée ou annulée.', { id: "tx" });
      setStep(0);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '700px', margin: '0 auto', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(30px)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary), #ec4899)', padding: '1rem', borderRadius: '16px', display: 'flex', boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)' }}>
          <Upload size={28} color="white" />
        </div>
        <div>
          <h2 className="page-title" style={{ fontSize: '2.2rem', marginBottom: '0.2rem' }}>Studio de Publication</h2>
          <p className="page-subtitle" style={{ marginBottom: '0', fontSize: '1rem', color: '#cbd5e1' }}>Hébergez vos données de recherche de façon immuable.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', margin: '2rem 0', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '16px' }}>
        <button className={`btn ${mode === 'new' ? '' : 'btn-outline'}`} style={{ flex: 1, padding: '1rem', border: 'none' }} onClick={() => setMode('new')}>
          <Database size={18} /> Créer un Dataset
        </button>
        <button className={`btn ${mode === 'version' ? '' : 'btn-outline'}`} style={{ flex: 1, padding: '1rem', border: 'none' }} onClick={() => setMode('version')}>
          <Plus size={18} /> Ajouter une Version
        </button>
      </div>

      {step > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h4 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {step === 4 ? <CheckCircle2 color="#10b981"/> : <Loader2 className="animate-spin" color="#8b5cf6"/>}
            {step === 1 && "Étape 1 : Calcul de l'empreinte cryptographique locale..."}
            {step === 2 && "Étape 2 : Chiffrement et envoi vers le réseau IPFS..."}
            {step === 3 && "Étape 3 : Demande de signature Ethereum MetaMask..."}
            {step === 4 && "Succès ! Vos données sont ancrées dans la blockchain."}
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ height: '6px', flex: 1, background: step >= 1 ? '#8b5cf6' : 'rgba(255,255,255,0.1)', borderRadius: '10px', transition: 'all 0.5s' }} />
            <div style={{ height: '6px', flex: 1, background: step >= 2 ? '#8b5cf6' : 'rgba(255,255,255,0.1)', borderRadius: '10px', transition: 'all 0.5s' }} />
            <div style={{ height: '6px', flex: 1, background: step >= 3 ? '#8b5cf6' : 'rgba(255,255,255,0.1)', borderRadius: '10px', transition: 'all 0.5s' }} />
            <div style={{ height: '6px', flex: 1, background: step >= 4 ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '10px', transition: 'all 0.5s' }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ opacity: step > 0 && step < 4 ? 0.5 : 1, pointerEvents: step > 0 && step < 4 ? 'none' : 'auto' }}>
        {mode === 'version' && (
          <div className="form-group">
            <label><Hash size={16} color="#8b5cf6"/> ID du Dataset original</label>
            <input type="number" className="form-control" value={datasetId} onChange={(e) => setDatasetId(e.target.value)} required placeholder="Ex: 1" />
          </div>
        )}

        {mode === 'new' && (
          <>
            <div className="form-group">
              <label><FileText size={16} color="#8b5cf6"/> Titre du projet de recherche</label>
              <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Modèle IA pour la détection de fraudes" />
            </div>
            <div className="form-group">
              <label><Globe size={16} color="#8b5cf6"/> Description détaillée</label>
              <textarea className="form-control" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Décrivez le contenu, la structure et le but de ce dataset..."></textarea>
            </div>
            <div className="form-group">
              <label><Lock size={16} color="#8b5cf6"/> Prix d'accès (Tokens DSET) - Optionnel</label>
              <input type="number" min="0" step="1" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0 pour rendre public" />
            </div>
          </>
        )}

        <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px dashed rgba(139, 92, 246, 0.4)', marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>
              <Database size={20} color="#ec4899"/> Fichier Source (Obligatoire)
            </label>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Formats acceptés: CSV, JSON, ZIP, TAR.GZ</p>
            <input type="file" className="form-control" style={{ background: 'rgba(0,0,0,0.5)' }} onChange={(e) => setFile(e.target.files[0])} required />
          </div>

          <div className="form-group" style={{ marginBottom: '0' }}>
            <label style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>
              <FileCheck2 size={20} color="#ec4899"/> Jupyter Notebook (Optionnel)
            </label>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Associez un rapport d'analyse ou un notebook Python.</p>
            <input type="file" className="form-control" style={{ background: 'rgba(0,0,0,0.5)' }} onChange={(e) => setNotebookFile(e.target.files[0])} />
          </div>
        </div>

        <button type="submit" className="btn" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)' }}>
          <Sparkles size={20} /> Exécuter le Smart Contract
        </button>
      </form>
    </div>
  );
};

export default PublishDataset;

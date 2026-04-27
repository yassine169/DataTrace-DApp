import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Search, Database, Fingerprint, LockKeyhole, Unlock, DownloadCloud, FileCode2, Clock, CheckCircle2, Star, MessageSquare, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IPFS_GATEWAY } from '../utils/pinata';
import DatasetRegistryArtifact from '../contracts/DatasetRegistry.json';
import DataTokenArtifact from '../contracts/DataToken.json';
import addresses from '../contracts/addresses.json';

const DatasetList = ({ provider, account }) => {
  const [datasets, setDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [versionsMap, setVersionsMap] = useState({});
  const [accessMap, setAccessMap] = useState({});
  const [reviewsMap, setReviewsMap] = useState({});
  
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [tipAmount, setTipAmount] = useState('');

  useEffect(() => {
    fetchDatasets();
  }, [provider, account]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredDatasets(datasets);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = datasets.filter(ds => 
        ds.title.toLowerCase().includes(term) || 
        ds.description.toLowerCase().includes(term) ||
        ds.owner.toLowerCase().includes(term) ||
        (ds.price === 0 && "gratuit".includes(term))
      );
      setFilteredDatasets(filtered);
    }
  }, [searchTerm, datasets]);

  const fetchDatasets = async () => {
    if (!provider) { setLoading(false); return; }
    try {
      const registryContract = new ethers.Contract(addresses.DatasetRegistry, DatasetRegistryArtifact.abi, provider);
      const data = await registryContract.getDatasets();
      
      let formattedData = [];
      let newVersionsMap = {};
      let newAccessMap = {};
      let newReviewsMap = {};

      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const id = Number(d.id);
        const price = Number(ethers.formatEther(d.price));
        const tips = Number(ethers.formatEther(d.totalTips));
        
        formattedData.push({
          id: id,
          owner: d.owner,
          title: d.title,
          description: d.description,
          price: price,
          versionCount: Number(d.versionCount),
          totalTips: tips
        });

        const versions = await registryContract.getVersions(id);
        newVersionsMap[id] = versions.map(v => ({
          cid: v.cid,
          dataHash: v.dataHash,
          notebookCid: v.notebookCid,
          timestamp: new Date(Number(v.timestamp) * 1000).toLocaleString()
        }));

        const reviews = await registryContract.getReviews(id);
        newReviewsMap[id] = reviews.map(r => ({
          reviewer: r.reviewer,
          rating: Number(r.rating),
          comment: r.comment,
          timestamp: new Date(Number(r.timestamp) * 1000).toLocaleString()
        }));

        if (account) {
          const hasAcc = await registryContract.checkAccess(id, account);
          newAccessMap[id] = hasAcc;
        } else {
          newAccessMap[id] = price === 0;
        }
      }
      
      setDatasets(formattedData.reverse());
      setVersionsMap(newVersionsMap);
      setAccessMap(newAccessMap);
      setReviewsMap(newReviewsMap);
    } catch (err) {
      console.error("Erreur récupération:", err);
    } finally {
      setLoading(false);
    }
  };

  const buyAccess = async (id, priceWei) => {
    if (!provider || !account) return toast.error("Connectez votre wallet.");
    try {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(addresses.DataToken, DataTokenArtifact.abi, signer);
      const registryContract = new ethers.Contract(addresses.DatasetRegistry, DatasetRegistryArtifact.abi, signer);

      toast.loading("1/2: Approbation de la transaction...", { id: "buy" });
      const approveTx = await tokenContract.approve(addresses.DatasetRegistry, priceWei);
      await approveTx.wait();

      toast.loading("2/2: Achat en cours sur la blockchain...", { id: "buy" });
      const buyTx = await registryContract.buyAccess(id);
      await buyTx.wait();

      toast.success("Achat validé ! Fichiers débloqués.", { id: "buy" });
      fetchDatasets();
    } catch (err) {
      console.error(err);
      toast.error("Achat annulé ou échoué.", { id: "buy" });
    }
  };

  const submitReview = async (id) => {
    if (!provider || !account) return;
    try {
      const signer = await provider.getSigner();
      const registryContract = new ethers.Contract(addresses.DatasetRegistry, DatasetRegistryArtifact.abi, signer);
      
      toast.loading("Publication de l'avis...", { id: "rev" });
      const tx = await registryContract.addReview(id, reviewRating, reviewText);
      await tx.wait();
      
      toast.success("Avis publié avec succès !", { id: "rev" });
      setReviewText('');
      fetchDatasets();
    } catch (err) {
      console.error(err);
      toast.error("Erreur (Vous avez peut-être déjà noté).", { id: "rev" });
    }
  };

  const tipOwner = async (id, amountStr) => {
    if (!provider || !account) return;
    try {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(addresses.DataToken, DataTokenArtifact.abi, signer);
      const registryContract = new ethers.Contract(addresses.DatasetRegistry, DatasetRegistryArtifact.abi, signer);

      const amountWei = ethers.parseEther(amountStr);

      toast.loading("Autorisation du pourboire...", { id: "tip" });
      const approveTx = await tokenContract.approve(addresses.DatasetRegistry, amountWei);
      await approveTx.wait();

      toast.loading("Envoi des fonds...", { id: "tip" });
      const tipTx = await registryContract.tipOwner(id, amountWei);
      await tipTx.wait();

      toast.success("💖 Pourboire envoyé au chercheur !", { id: "tip" });
      setTipAmount('');
      fetchDatasets();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi du pourboire.", { id: "tip" });
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} size={14} color={i < rating ? "#f59e0b" : "#334155"} fill={i < rating ? "#f59e0b" : "none"} />
    ));
  };

  if (!provider) return (
    <div className="card" style={{textAlign: 'center', padding: '4rem', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(30px)'}}>
      <LockKeyhole size={48} color="#94a3b8" style={{marginBottom: '1rem'}} />
      <h2>Connexion Requise</h2>
      <p style={{color: '#cbd5e1'}}>Veuillez connecter votre portefeuille Web3.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Marché des Modèles & Données</h2>
          <p className="page-subtitle" style={{ marginBottom: '0' }}>Données décentralisées de Data Science certifiées par smart contracts.</p>
        </div>
      </div>

      <div style={{ marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15px', left: '15px', color: '#94a3b8' }}>
          <Search size={20} />
        </div>
        <input type="text" className="form-control" style={{ paddingLeft: '3rem', height: '50px', fontSize: '1.1rem', borderRadius: '16px', background: 'rgba(3, 7, 18, 0.7)' }} 
               placeholder="Rechercher des travaux..." 
               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '4rem', color: '#8b5cf6'}}>
          <Database size={40} className="animate-pulse" style={{marginBottom: '1rem'}} />
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="card" style={{textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)'}}>Aucun résultat trouvé sur la blockchain.</div>
      ) : (
        <div className="dataset-grid">
          {filteredDatasets.map((ds) => (
            <div key={ds.id} className="dataset-card" style={{ overflow: 'visible', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)' }}>
              
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                <div className="badge" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}}>
                  DATASET #{ds.id}
                </div>
                <div className={`badge ${ds.price === 0 ? 'badge-success' : 'badge-warning'}`} style={{boxShadow: ds.price > 0 ? '0 0 15px rgba(245, 158, 11, 0.2)' : '0 0 15px rgba(16, 185, 129, 0.2)'}}>
                  {ds.price === 0 ? 'Gratuit' : `${ds.price} DSET`}
                </div>
              </div>
              
              <div className="dataset-title">{ds.title}</div>
              <div className="dataset-desc" style={{ minHeight: '60px' }}>{ds.description}</div>
              
              <div className="dataset-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="meta-item" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '8px' }}>
                  <span style={{color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase'}}><Fingerprint size={12}/> Auteur</span>
                  <span style={{fontFamily:'monospace', color:'white'}}>{ds.owner.substring(0,5)}...{ds.owner.substring(39)}</span>
                </div>
                <div className="meta-item" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '8px' }}>
                  <span style={{color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase'}}><Database size={12}/> Versions</span>
                  <span style={{color:'white', fontWeight:'bold'}}>{ds.versionCount} ancrages</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <Heart size={16} fill={ds.totalTips > 0 ? "#ec4899" : "none"} className={ds.totalTips > 0 ? 'animate-pulse' : ''} /> {ds.totalTips} DSET reçus
                </div>
                {ds.owner.toLowerCase() !== account?.toLowerCase() && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" placeholder="Dons" className="form-control" style={{ width: '70px', padding: '0.3rem', height: '30px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)' }}
                           onChange={(e) => setTipAmount(e.target.value)} />
                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', height: '30px', fontSize: '0.8rem', color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)' }}
                            onClick={() => tipOwner(ds.id, tipAmount || '0')}>
                      Tipper
                    </button>
                  </div>
                )}
              </div>

              {accessMap[ds.id] ? (
                <div className="version-list" style={{ marginTop: 'auto', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.4)' }}>
                  <div style={{fontSize: '0.9rem', marginBottom: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'}}>
                    <Unlock size={16} /> Fichiers Débloqués
                  </div>
                  <div style={{maxHeight: '120px', overflowY: 'auto', paddingRight: '0.5rem'}}>
                    {versionsMap[ds.id] && versionsMap[ds.id].map((v, i) => (
                      <div key={i} className="version-item">
                        <div style={{fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{color:'white'}}>v{i+1} • {v.timestamp.split(' ')[0]}</span>
                          <span title={v.dataHash}><CheckCircle2 size={12} color="#10b981"/> Validé</span>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                          <a href={v.cid.startsWith('Qm') ? `${IPFS_GATEWAY}${v.cid}` : '#'} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{fontSize: '0.75rem', padding: '0.4rem', flex: 1}}>
                            <DownloadCloud size={14}/> Dataset
                          </a>
                          {v.notebookCid && (
                            <a href={v.notebookCid.startsWith('Qm') ? `${IPFS_GATEWAY}${v.notebookCid}` : '#'} target="_blank" rel="noreferrer" className="btn btn-outline" style={{fontSize: '0.75rem', padding: '0.4rem', flex: 1}}>
                              <FileCode2 size={14}/> Notebook
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{fontSize: '1rem', color: '#f59e0b', textAlign: 'center', fontWeight: '600', textShadow: '0 0 10px rgba(245, 158, 11, 0.3)'}}>
                    <LockKeyhole size={18} /> Données Premium
                  </div>
                  <button className="btn" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', width: '100%', boxShadow: '0 5px 15px rgba(245, 158, 11, 0.4)'}} 
                          onClick={() => buyAccess(ds.id, ethers.parseEther(ds.price.toString()))}>
                    Débloquer l'accès ({ds.price} DSET)
                  </button>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem' }}>
                  <MessageSquare size={16} color="#8b5cf6" /> Avis des Chercheurs ({reviewsMap[ds.id]?.length || 0})
                </div>
                
                {reviewsMap[ds.id] && reviewsMap[ds.id].length > 0 ? (
                  <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {reviewsMap[ds.id].map((r, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ color: '#94a3b8' }}>{r.reviewer.substring(0,5)}...</span>
                          <span style={{ display: 'flex' }}>{renderStars(r.rating)}</span>
                        </div>
                        <div style={{ color: 'white', fontStyle: 'italic' }}>"{r.comment}"</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '1rem' }}>Aucun avis pour le moment.</div>
                )}

                {accessMap[ds.id] && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select className="form-control" style={{ width: '80px', padding: '0.4rem', height: '35px', background: 'rgba(0,0,0,0.5)' }} 
                              value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                        <option value="5">5 ⭐</option>
                        <option value="4">4 ⭐</option>
                        <option value="3">3 ⭐</option>
                        <option value="2">2 ⭐</option>
                        <option value="1">1 ⭐</option>
                      </select>
                      <input type="text" className="form-control" placeholder="Votre avis..." style={{ padding: '0.4rem', height: '35px', background: 'rgba(0,0,0,0.5)' }} 
                             value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    </div>
                    <button className="btn btn-secondary" style={{ width: '100%', padding: '0.4rem', height: '35px', fontSize: '0.85rem' }} 
                            onClick={() => submitReview(ds.id)}>
                      Publier l'avis sur Blockchain
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetList;

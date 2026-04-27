import { Link, useLocation } from 'react-router-dom';
import { Database, UploadCloud, Compass, Wallet, Hexagon } from 'lucide-react';

const Navbar = ({ account, balance, connectWallet }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="logo">
          <Hexagon size={28} color="#8b5cf6" fill="rgba(139, 92, 246, 0.2)" />
          DataChain
        </div>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <Database size={18} /> Accueil
        </Link>
        <Link to="/publish" className={`nav-link ${location.pathname === '/publish' ? 'active' : ''}`}>
          <UploadCloud size={18} /> Publier
        </Link>
        <Link to="/datasets" className={`nav-link ${location.pathname === '/datasets' ? 'active' : ''}`}>
          <Compass size={18} /> Explorer
        </Link>
      </div>

      <div className="wallet-section">
        {account ? (
          <>
            <div className="token-balance">
              <span style={{ fontSize: '1.2rem' }}>💎</span> {Number(balance).toFixed(2)} DSET
            </div>
            <div className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
              <Wallet size={16} />
              {account.substring(0, 6)}...{account.substring(38)}
            </div>
          </>
        ) : (
          <button className="btn" onClick={connectWallet}>
            <Wallet size={18} />
            Connecter MetaMask
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

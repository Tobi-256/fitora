import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import './Home.css';

export const Home = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="home-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">Try Before You Buy</h1>
          <p className="home-hero-subtitle">
            Experience your perfect fit in 3D before purchasing
          </p>
          <Link to={currentUser ? "/try-on" : "/register"}>
            <button className="home-hero-button">
              Start Virtual Try-On
            </button>
          </Link>
          <ul className="home-features-list">
            <li>Personalized Fit</li>
            <li>3D View</li>
            <li>Easy Shopping</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

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
          <h1 className="home-hero-title">Thử trước khi mua</h1>
          <p className="home-hero-subtitle">
           Trải nghiệm vừa vặn hoàn hảo của bạn trong 3D trước khi mua
          </p>
          <Link to={currentUser ? "/try-on" : "/register"}>
            <button className="home-hero-button">
              Bắt đầu Thử Ảo
            </button>
          </Link>
          <ul className="home-features-list">
            <li>Vừa vặn cá nhân</li>
            <li>Chế độ xem 3D</li>
            <li>Mua sắm dễ dàng</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

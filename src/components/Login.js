import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginPage.css';
import LogoContainer from './LogoContainer'; // Import the LogoContainer component

// Importing images for Carousel
import logo_icon from './logo.png';
import img from './img1.jpg';
import group from '../images/group.jpg'
import login from '../images/login.jpeg'

const Login = ({ isLoggedIn, setIsLoggedIn }) => {
  // Carousel logic
  const [currentPage, setCurrentPage] = useState(0);
  const pages = [
    {
      content: (
        <>
        
          <LogoContainer logo={logo_icon} />
         
          <div className="project_description-container">
            <div >
              <img style={{ width: '55em', height: 'auto' }} src={login} alt="Group" />
            </div>
          </div>
        </>
      ),
      // backgroundColor: '#E2F9FD',
    },
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage === pages.length - 1 ? 0 : prevPage + 1));
    }, 3000); // Change page every 3 seconds

    return () => clearInterval(intervalId); // Cleanup the interval
  }, [pages.length]);

  // Login Form logic (with hardcoded values)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if credentials are correct
    if (email === 'admin@ust.com' && password === 'adminust') {
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      window.location.href = '/db4'; // Redirect to home page
    } else {
      setError('Wrong credentials. Please try again.'); // Set error message
    }
  };

  const handleForgotPasswordOpen = () => {
    setShowForgotPasswordModal(true);
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPasswordModal(false);
  };

  return (
    <div className="App">
      <div className="container-fluid">
        <div className="row">
          {/* Carousel Section */}
          <div className="col-md-6 carousel-container">
            <div className="carousel-container" style={{ backgroundColor: pages[currentPage].backgroundColor, height: '100%' }}>
              <div className="left-side">
                {pages[currentPage].content}
              </div>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="col-md-6 login-container">
            <div className="login-form">
              <h5 className="mb-5">Login to your account</h5>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="username">Username (Email ID)</label>
                  <input
                    type="text"
                    id="username"
                    className="form-control"
                    placeholder="Enter your corporate email-ID..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your password..."
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div style={{ textAlign: 'end' }}>
                  <button
                    type="button"
                    className="forgotPassword btn btn-link mt-2"
                    onClick={handleForgotPasswordOpen}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div>
                  <button
                    style={{ width: '-webkit-fill-available', backgroundColor: '#0097ab' }}
                    type="submit"
                    className="btn btn-primary mt-2"
                  >
                    Login
                  </button>
                  {error && <div className="alert alert-danger mt-2">{error}</div>}
                </div>
              </form>
              {/* Forgot Password Modal */}
              {showForgotPasswordModal && (
                <div className="forgot-password-modal">
                  <div className="modal-content">
                    <h5>Forgot Password</h5>
                    <p>If you forgot your password, please contact support.</p>
                    <button className="btn btn-secondary" onClick={handleForgotPasswordClose}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

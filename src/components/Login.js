import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginPage.css';
import LogoContainer from './LogoContainer'; // Import the LogoContainer component
import BASE_URL from '../ApiConfig/apiConfig';
import axios from 'axios';


import logo_icon from './logo.png';
import img from './img1.jpg';
import group from '../images/group.jpg'
import login from '../images/login.jpeg'

const Login = ({ isLoggedIn, setIsLoggedIn }) => {
  
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
    },
  ];

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!username || !password) {
      setError('Both username and password are required.');
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        username,
        password,
      });

      const { access_token } = response.data;

      sessionStorage.setItem('accessToken', access_token);
      sessionStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMsg);
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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

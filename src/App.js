import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Container from './components/Container';

const AppWrapper = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedLoggedInStatus = sessionStorage.getItem('isLoggedIn');
    if (storedLoggedInStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('isLoggedIn', 'true');
    navigate('/db4'); // Force redirect after login
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    navigate('/'); // Optionally redirect to login page
  };

  return (
    <div>
      {isLoggedIn ? (
        <Container handleLogout={handleLogout} />
      ) : (
        <Login setIsLoggedIn={handleLogin} />
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router
import Login from './components/Login';
import Container from './components/Container';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  useEffect(() => {
    // Check if user is already logged in from sessionStorage
    const storedLoggedInStatus = sessionStorage.getItem('isLoggedIn');
    if (storedLoggedInStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // When user logs in, update sessionStorage and the login state
  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('isLoggedIn', 'true');
  };

  // When user logs out, clear sessionStorage and the login state
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
  };

  return (
    <Router> {/* Wrap your entire application in the Router */}
      <div>
        {isLoggedIn ? (
          <Container handleLogout={handleLogout} />
        ) : (
          <Login setIsLoggedIn={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;

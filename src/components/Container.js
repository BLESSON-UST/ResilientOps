import React, { useState, createContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// Importing components

import Login from "./Login";

import DashboardContent from "./dashboard4";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer"; // Import Footer here
import BreadcrumbsComponent from "./BreadcrumbsComponent";
import NewProcessPage from "./NewProcessPage";
import { ProcessProvider } from "./ProcessContext";
import SettingsPage from "./Settings";
import ProcessDetails from "./ProcessDetails";
import { Navigate } from "react-router-dom";
import DragAndDrop from "./Temp";
import Home from "./Home";
import ServiceDetail from "./ProcessDetails";
import Logs from "./Logs";


// Importing Divider from MUI
import Divider from "@mui/material/Divider";

const SidebarContext = createContext();

const Container = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/home";
  const isDashboardPage = location.pathname === "/db4";

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <ProcessProvider>
      <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh", // Full height
            overflow: "hidden", // Prevent global scrolling
          }}
        >
          {/* Fixed Header */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              height: "64px", // Adjust according to actual header height
            }}
          >
            <Header collapsed={collapsed} handleCollapse={handleCollapse} />
          </div>

          {/* Main Layout */}
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              marginTop: "64px", // Push below fixed header
              marginBottom: "50px", // Prevent overlap with footer
              overflow: "hidden", // Prevent scrolling outside content area
            }}
          >
            {/* Sidebar */}
            <Sidebar collapsed={collapsed} />

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                marginLeft: "0px",
                marginRight: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.12)",
              }}
            />

            {/* Scrollable Content Area */}
            <div
              style={{
                flexGrow: 1,
                overflowY: "auto", // Enable scrolling here
                height: "calc(100vh - 114px)", // Adjust height for header and footer
                padding: isHomePage ? "0" : "20px",
              }}
            >
               {!isHomePage && !isDashboardPage && (
                <div style={{ padding: "10px" }}>
                  <BreadcrumbsComponent />
                </div>
              )}

              <Routes>
                <Route
                  path="/"
                  element={<Login isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}
                />
                <Route path="/home" element={<Home/>}/>
                <Route path="/db4" element={<DashboardContent />} />
                <Route path="/new" element={<NewProcessPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/service/:id/view" element={<ProcessDetails />} />
                <Route path="/logs" element={<Logs/>}/>
                
                <Route path="temp" element={<DragAndDrop />} />
              </Routes>
            </div>
          </div>

          {/* Fixed Footer */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              height: "50px", // Adjust according to actual footer height
            }}
          >
            <Footer />
          </div>
        </div>
      </SidebarContext.Provider>
    </ProcessProvider>
  );
};


export default Container;
export { SidebarContext };

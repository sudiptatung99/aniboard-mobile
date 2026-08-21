import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import ImageList from "./components/ImageList";
import DataList from "./components/DataList";
import Login from "./components/Login";
import { UserAuth } from "./context/AuthContext";
import TvList from "./components/TvList";

function RequireAuth({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Layout({ children, user, activeTab, onSignOut, onTabChange }) {
  console.log(activeTab);
  
  return (
    <div className="bg-[#f5f3ff] max-w-[1024px] mx-auto relative overflow-hidden font-['DM_Sans']">
      <Header user={user} onSignOut={onSignOut} />
      <Navbar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="content_wrapper">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("image");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isLoading } = UserAuth();
  useEffect(() => {
    if (location.pathname.startsWith("/imagelist")) {
      setActiveTab("image");
    } else if (location.pathname.startsWith("/datalist")) {
      setActiveTab("data");
    }else if (location.pathname.startsWith("/tv-list")) {
      setActiveTab("tv-list");
    }
  }, [location.pathname]);

  // const handleLogin = (userInfo) => {
  //   setUser(userInfo);
  //   setIsAuthenticated(true);
  //   navigate("/imagelist", { replace: true });
  // };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab("image");
    navigate("/login", { replace: true });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "image") {
      navigate("/imagelist");
    } else if (tabId === "data") {
      navigate("/datalist");
    } else if (tabId === "tv-list") {
      navigate("/tv-list");
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/imagelist" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/imagelist"
        element={
          <RequireAuth isAuthenticated={isLoggedIn}>
            <Layout
              user={user}
              activeTab={activeTab}
              onSignOut={handleSignOut}
              onTabChange={handleTabChange}
            >
              <div className="image_wrapper">
                <ImageList />
              </div>
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/datalist"
        element={
          <RequireAuth isAuthenticated={isLoggedIn}>
            <Layout
              user={user}
              activeTab={activeTab}
              onSignOut={handleSignOut}
              onTabChange={handleTabChange}
            >
              <div className="data_wrapper">
                <DataList />
              </div>
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/tv-list"
        element={
          <RequireAuth isAuthenticated={isLoggedIn}>
            <Layout
              user={user}
              activeTab={activeTab}
              onSignOut={handleSignOut}
              onTabChange={handleTabChange}
            >
              <div className="data_wrapper">
                <TvList />
              </div>
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/imagelist" : "/login"}
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/imagelist" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}


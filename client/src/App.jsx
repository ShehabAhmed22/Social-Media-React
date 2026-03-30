import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Auth from "./module/auth/Auth.jsx";
import SuggestedUser from "./module/suggested-user/pages/SuggestedUser.jsx";
import Navbar from "./components/navbar/Navbar.jsx";
import Home from "./module/home/pages/Home.jsx";
import Profile from "./module/profile/pages/Profile.jsx";

function App() {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/auth";

  // ✅ نقرأ التوكن من localStorage أول ما التطبيق يفتح
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // ✅ لما اللوجن ينجح
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  return (
    <>
      {/* Navbar يظهر بس لو مش في صفحة auth */}
      {!isAuthPage && token && <Navbar />}

      <main
        style={{
          minHeight: isAuthPage ? "100vh" : "calc(100vh - 60px)",
        }}
      >
        <Routes>
          {/* Auth */}
          <Route
            path="/auth"
            element={
              token ? (
                <Navigate to="/" />
              ) : (
                <Auth onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          {/* Home */}
          <Route
            path="/"
            element={token ? <Home /> : <Navigate to="/auth" />}
          />

          <Route
            path="/profile/:userId"
            element={token ? <Profile /> : <Navigate to="/auth" />}
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to={token ? "/" : "/auth"} />} />
        </Routes>
      </main>
    </>
  );
}

export default App;

import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Hardware from "./pages/Hardware";
import Nexus from "./pages/Nexus";
import Team from "./pages/Team";
import News from "./pages/News";
import VipcGrantWinner from "./pages/VipcGrantWinner";
import { useEffect } from "react";

// Component to handle scrolling to top on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

const App: React.FC = () => {
    return (
        <Router>
            <ScrollToTop />
            <div className="font-sans text-potomac-cream flex flex-col min-h-screen bg-potomac-secondary">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/hardware" element={<Hardware />} />
                    <Route
                        path="/source"
                        element={<Navigate to="/hardware" replace />}
                    />
                    <Route path="/nexus" element={<Nexus />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/news" element={<News />} />
                    <Route
                        path="/news/vipc-grant-winner"
                        element={<VipcGrantWinner />}
                    />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
};

export default App;

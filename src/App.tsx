import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Source from "./pages/Source";
import Nexus from "./pages/Nexus";
import Team from "./pages/Team";
import News from "./pages/News";
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
                    <Route path="/source" element={<Source />} />
                    <Route path="/nexus" element={<Nexus />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/news" element={<News />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
};

export default App;

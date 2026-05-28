import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
    const location = useLocation();

    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;
        return `text-sm font-semibold tracking-widest transition uppercase ${
            isActive
                ? "text-potomac-gold border-b border-potomac-gold"
                : "text-gray-400 hover:text-potomac-gold"
        }`;
    };

    return (
        <nav className="fixed top-0 left-0 w-full h-20 bg-potomac-primary border-b border-potomac-gold/30 z-50 flex items-center justify-between px-8 shadow-xl">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 cursor-pointer">
                <div className="bg-potomac-primary p-1 rounded-full">
                    {/* Ensure 'Potomac Logo.png' is in your public folder */}
                    <img
                        src="/Potomac Logo.png"
                        alt="Potomac Swan"
                        className="h-12 w-auto"
                    />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-xl font-serif text-white tracking-[0.2em] leading-none">
                        POTOMAC{" "}
                        <span className="text-potomac-gold">
                            {location.pathname === "/source"
                                ? "SOURCE"
                                : location.pathname === "/nexus"
                                ? "NEXUS"
                                : location.pathname === "/team"
                                ? "TEAM"
                                : location.pathname === "/news"
                                ? "NEWS"
                                : ""}
                        </span>
                    </h1>
                </div>
            </Link>

            {/* Menu Links */}
            <div className="flex items-center gap-8">
                <Link to="/nexus" className={getLinkClass("/nexus")}>
                    Nexus
                </Link>
                <Link to="/source" className={getLinkClass("/source")}>
                    Source
                </Link>
                <Link to="/team" className={getLinkClass("/team")}>
                    Team
                </Link>
                <Link to="/news" className={getLinkClass("/news")}>
                    News
                </Link>

                {/* Auth Button */}
                <div className="h-8 w-px bg-white/10 mx-2"></div>
                <a
                    href="https://www.potomacdb.com/"
                    className="px-5 py-2 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded hover:bg-potomac-gold hover:text-potomac-primary transition duration-300"
                >
                    Sign in / Sign Up
                </a>
            </div>
        </nav>
    );
};

export default Navbar;

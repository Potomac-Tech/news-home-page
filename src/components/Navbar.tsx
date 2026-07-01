import React from "react";
import { Link, useLocation } from "react-router-dom";
import MobileNavBar from "./mobile/MobileNavBar";

const Navbar: React.FC = () => {
    const location = useLocation();
    const isHardware =
        location.pathname === "/hardware" || location.pathname === "/source";
    const isNews = location.pathname.startsWith("/news");
    const isEvents = location.pathname.startsWith("/events");

    const getLinkClass = (isActive: boolean) => {
        return `text-sm font-semibold tracking-widest transition uppercase ${
            isActive
                ? "text-potomac-gold border-b border-potomac-gold"
                : "text-gray-400 hover:text-potomac-gold"
        }`;
    };

    return (
        <nav className="fixed top-0 left-0 w-full h-20 bg-potomac-primary border-b border-potomac-gold/30 z-50 flex items-center justify-between px-4 md:px-8 shadow-xl">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 cursor-pointer">
                <div className="bg-potomac-primary p-1 rounded-full">
                    <img
                        src="/Potomac Logo.png"
                        alt="Potomac Swan"
                        className="h-12 w-auto"
                    />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-base md:text-xl font-serif text-white tracking-widest md:tracking-[0.2em] leading-none whitespace-nowrap">
                        POTOMAC{" "}
                        <span className="text-potomac-gold">
                            {isHardware
                                ? "HARDWARE"
                                : location.pathname === "/nexus"
                                ? "NEXUS"
                                : location.pathname === "/team"
                                ? "TEAM"
                                : isNews
                                ? "NEWS"
                                : isEvents
                                ? "EVENTS"
                                : ""}
                        </span>
                    </h1>
                </div>
            </Link>

            {/* Desktop Menu Links */}
            <div className="hidden md:flex items-center gap-4">
                <Link
                    to="/nexus"
                    className={getLinkClass(location.pathname === "/nexus")}
                >
                    Nexus
                </Link>
                <Link to="/hardware" className={getLinkClass(isHardware)}>
                    Hardware
                </Link>
                <Link
                    to="/team"
                    className={getLinkClass(location.pathname === "/team")}
                >
                    Team
                </Link>
                <Link to="/news" className={getLinkClass(isNews)}>
                    News
                </Link>
                <Link to="/events" className={getLinkClass(isEvents)}>
                    Events
                </Link>

                {/* Auth Button */}
                <div className="h-8 w-px bg-white/10 mx-2"></div>
                <a
                    href="https://nexus-explore.potomacdb.com/0auth"
                    className="px-5 py-2 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded hover:bg-potomac-gold hover:text-potomac-primary transition duration-300"
                >
                    Sign in / Sign Up
                </a>
            </div>

            <MobileNavBar />
        </nav>
    );
};

export default Navbar;

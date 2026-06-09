import React, { useState, useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: "default" | "source_interest" | "nexus_beta";
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, context }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [formStatus, setFormStatus] = useState<string>("");
    const [btnText, setBtnText] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Content based on context
    let title = "ACCESS REQUEST";
    let subtitle = "Join the Potomac Nexus Network";
    let subject = "New Access Request - Potomac Nexus";
    let buttonLabel = "Initiate Sequence";

    if (context === "source_interest") {
        title = "HARDWARE INTEREST";
        subtitle = "Register for Lunar Surface Data";
        subject = "New Hardware Interest - Potomac Hardware";
        buttonLabel = "Confirm Interest";
    } else if (context === "nexus_beta") {
        title = "BETA ACCESS";
        subtitle = "Request Early Access to Nexus Platform";
        subject = "New Beta Access Request - Nexus";
        buttonLabel = "Request Access";
    }

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsAnimating(true), 10);
            setBtnText(buttonLabel);
        } else {
            setIsAnimating(false);
            setFormStatus("");
        }
    }, [isOpen, buttonLabel]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setBtnText("Transmitting...");
        setFormStatus("Encrypting and sending data...");

        const form = e.currentTarget;
        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        // @ts-ignore
        if (!object.newsletter) object.newsletter = "No";

        const json = JSON.stringify(object);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: json,
            });

            const jsonResponse = await response.json();

            if (response.status === 200) {
                setFormStatus("Success. Request logged.");
                setBtnText("Complete");
                setTimeout(() => {
                    onClose();
                    setIsSubmitting(false);
                }, 2000);
            } else {
                setFormStatus(jsonResponse.message);
                setBtnText("Retry");
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            setFormStatus("Transmission Failed.");
            setBtnText("Retry");
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300">
            <div
                className={`glass-card w-full max-w-md p-6 md:p-10 rounded-lg relative transform transition-transform duration-300 ${
                    isAnimating ? "scale-100" : "scale-95"
                }`}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-1 right-1 p-3 text-gray-500 hover:text-white"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif text-white tracking-widest mb-2">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="hidden"
                        name="access_key"
                        value="7a198f93-9b7d-460a-a159-9917a3e10213"
                    />
                    <input type="hidden" name="subject" value={subject} />
                    <input
                        type="hidden"
                        name="redirect"
                        value="https://web3forms.com/success"
                    />

                    <div>
                        <label className="block text-xs text-potomac-gold uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="name@organization.com"
                            className="w-full bg-black/40 border border-white/20 rounded p-3 text-base text-white placeholder-gray-600 focus:border-potomac-gold focus:outline-none transition"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="newsletter"
                            value="Yes"
                            id="newsletter"
                            className="accent-potomac-gold h-4 w-4 bg-gray-800 border-gray-600 rounded"
                        />
                        <label
                            htmlFor="newsletter"
                            className="text-xs text-gray-400"
                        >
                            Receive mission briefings and system updates.
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-potomac-gold/10 border border-potomac-gold text-potomac-gold font-bold uppercase tracking-widest hover:bg-potomac-gold hover:text-potomac-primary transition duration-300 disabled:opacity-50"
                    >
                        {btnText}
                    </button>
                    <div className="text-center text-xs text-potomac-gold mt-2">
                        {formStatus}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Modal;

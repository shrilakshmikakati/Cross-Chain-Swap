import React, { useEffect, useRef, useState, useCallback } from 'react';

function App() {
    const headerRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const heroCanvasRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sticky header effect
    useEffect(() => {
        const handleScroll = () => {
            if (headerRef.current) {
                if (window.scrollY > 50) {
                    headerRef.current.classList.add('bg-white/80', 'backdrop-blur-sm', 'shadow-md');
                } else {
                    headerRef.current.classList.remove('bg-white/80', 'backdrop-blur-sm', 'shadow-md');
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mobile menu toggle
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    // Smooth scroll for navigation links
    const handleNavLinkClick = useCallback((e, targetId) => {
        if (targetId && document.getElementById(targetId)) {
            e.preventDefault();
            document.getElementById(targetId).scrollIntoView({
                behavior: 'smooth'
            });
            setIsMobileMenuOpen(false);
        }
    }, []);

    // Accordion functionality
    useEffect(() => {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            const handleClick = () => {
                const item = header.closest('.accordion-item');
                const currentlyOpen = document.querySelector('.accordion-item.open');

                if (currentlyOpen && currentlyOpen !== item) {
                    currentlyOpen.classList.remove('open');
                }
                item.classList.toggle('open');
            };
            header.addEventListener('click', handleClick);
        });

        return () => {
            accordionHeaders.forEach(header => {
                header.removeEventListener('click', () => {});
            });
        };
    }, []);

    // Intersection Observer for animate-in effect
    useEffect(() => {
        const animatedElements = document.querySelectorAll('.animate-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            observer.observe(el);
        });

        return () => animatedElements.forEach(el => observer.unobserve(el));
    }, []);

    // Hero canvas animation
    useEffect(() => {
        const canvas = heroCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.radius = Math.random() * 1.5 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(129, 140, 248, 0.4)';
                ctx.fill();
            }
        }

        function createParticles() {
            particles = [];
            const particleCount = Math.floor(width * height / 15000);
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        let animationFrameId;
        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(129, 140, 248, ${1 - dist / 120})`;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        const handleResize = () => {
            resize();
            createParticles();
        };

        window.addEventListener('resize', handleResize);
        resize();
        createParticles();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const faqItems = [
        { 
            question: 'What are HTLCs?', 
            answer: 'HTLC stands for Hashed Time-Locked Contract. It\'s a type of smart contract that ensures atomicity in swaps. It uses a cryptographic secret (hashlock) and a refund window (timelock) to guarantee that a swap either completes fully on both sides or fails safely, returning funds to their original owners.' 
        },
        { 
            question: 'How do you ensure my funds are safe?', 
            answer: 'Security is our top priority. By using ICP\'s Chain-Key technology, we interact directly with other blockchains without vulnerable, centralized bridges. The HTLC mechanism ensures that you never have to trust the other party; the cryptographic rules of the smart contract enforce the swap. Your private keys never leave your wallet.' 
        },
        { 
            question: 'What happens if a swap fails?', 
            answer: 'Thanks to the "timelock" part of the HTLC, if the other party fails to complete their side of the swap within a specified time, the contract allows you to reclaim your original funds. No assets are ever lost or permanently stuck.' 
        },
        { 
            question: 'What are your fees?', 
            answer: 'InterSwap charges a small, transparent protocol fee on each successful swap to maintain the service. This fee is significantly lower than traditional bridges due to the efficiency of the Internet Computer. You will also pay the standard network fees on the respective blockchains (e.g., Bitcoin miner fees and Ethereum gas).' 
        }
    ];

    return (
        <div className="antialiased">
            <style>{`
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #f8fafc;
                    color: #1e293b;
                }
                .glassmorphism {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .hero-gradient-text {
                    background: linear-gradient(90deg, #4f46e5, #c026d3);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .feature-icon {
                    font-size: 2.5rem;
                    line-height: 1;
                }
                .accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out, padding 0.3s ease-out;
                }
                .accordion-item.open .accordion-content {
                    max-height: 500px;
                    padding-top: 1rem;
                    padding-bottom: 1rem;
                }
                .accordion-item.open .accordion-arrow {
                    transform: rotate(180deg);
                }
                .how-it-works-arrow {
                    position: absolute;
                    width: 100%;
                    height: 2px;
                    background: #94a3b8;
                    top: 50%;
                    left: 50%;
                    transform: translateY(-50%);
                }
                .how-it-works-arrow::after {
                    content: '▶';
                    position: absolute;
                    right: -10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .animate-in {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
                }
                .animate-in.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>

            <header ref={headerRef} id="header" className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <a href="#" className="text-2xl font-bold text-slate-800">InterSwap</a>
                    <div className="hidden md:flex items-center space-x-6">
                        <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} className="text-slate-600 hover:text-indigo-600 transition">Features</a>
                        <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} className="text-slate-600 hover:text-indigo-600 transition">How It Works</a>
                        <a href="#whyus" onClick={(e) => handleNavLinkClick(e, 'whyus')} className="text-slate-600 hover:text-indigo-600 transition">Why Us</a>
                        <a href="#faq" onClick={(e) => handleNavLinkClick(e, 'faq')} className="text-slate-600 hover:text-indigo-600 transition">FAQ</a>
                    </div>
                    <a href="#" className="hidden md:block bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md">
                        Launch DApp
                    </a>
                    <button id="mobile-menu-button" onClick={toggleMobileMenu} className="md:hidden text-slate-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                </nav>
                <div ref={mobileMenuRef} id="mobile-menu" className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white/80 backdrop-blur-sm`}>
                    <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} className="block py-2 px-6 text-slate-600 hover:bg-slate-100">Features</a>
                    <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} className="block py-2 px-6 text-slate-600 hover:bg-slate-100">How It Works</a>
                    <a href="#whyus" onClick={(e) => handleNavLinkClick(e, 'whyus')} className="block py-2 px-6 text-slate-600 hover:bg-slate-100">Why Us</a>
                    <a href="#faq" onClick={(e) => handleNavLinkClick(e, 'faq')} className="block py-2 px-6 text-slate-600 hover:bg-slate-100">FAQ</a>
                    <div className="p-4">
                        <a href="#" className="block text-center bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md">Launch DApp</a>
                    </div>
                </div>
            </header>

            <main>
                <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                    <canvas ref={heroCanvasRef} id="hero-canvas" className="absolute top-0 left-0 w-full h-full z-0"></canvas>
                    <div className="relative z-10 text-center px-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
                            Seamless Cross-Chain Swaps
                        </h1>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black hero-gradient-text leading-tight mt-2">on the Internet Computer</h2>
                        <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-600">
                            Swap native Bitcoin, Ethereum, and other digital assets directly and securely. No bridges, no wrapped tokens, just pure interoperable finance powered by ICP.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition shadow-lg transform hover:scale-105">
                                Launch DApp
                            </a>
                            <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-100 transition shadow-lg border border-slate-200 transform hover:scale-105">
                                Learn More
                            </a>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20 lg:py-32">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">The Future of Interoperable Finance</h2>
                            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Discover the powerful features that make InterSwap the most secure and efficient way to swap assets across blockchains.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            
                            <div className="feature-card animate-in bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="feature-icon text-indigo-500">🛡</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Truly Trustless & Secure</h3>
                                <p className="text-slate-600">Leverages HTLCs and ICP's Chain-Key Cryptography. Your funds are locked and released atomically, without any third-party risk.</p>
                            </div>

                            <div className="feature-card animate-in bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="feature-icon text-indigo-500">🔄</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Seamless, Direct Swaps</h3>
                                <p className="text-slate-600">Swap native BTC for native ETH. Say goodbye to wrapped tokens and complex, multi-step bridging processes.</p>
                            </div>

                            <div className="feature-card animate-in bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="feature-icon text-indigo-500">⚡</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Blazing Fast & Cost-Efficient</h3>
                                <p className="text-slate-600">Built on ICP's high-performance network for near-instant transaction finality with incredibly low fees.</p>
                            </div>

                            <div className="feature-card animate-in bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="feature-icon text-indigo-500">🎨</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Intuitive User Experience</h3>
                                <p className="text-slate-600">A clean, easy-to-navigate interface with clear step-by-step guidance, designed for everyone.</p>
                            </div>
                            
                            <div className="feature-card animate-in bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="feature-icon text-indigo-500">🌐</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Powered by Internet Computer</h3>
                                <p className="text-slate-600">Runs 100% on-chain, guaranteeing censorship resistance, unstoppable operation, and full transparency.</p>
                            </div>
                            
                            <div className="feature-card animate-in bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="feature-icon text-indigo-500">🧩</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Wide Asset Support</h3>
                                <p className="text-slate-600">Starts with direct BTC and ETH swaps, with plans to integrate more major cryptocurrencies and tokens.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="howitworks" className="py-20 lg:py-32 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold">How It Works in 3 Simple Steps</h2>
                            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">We've abstracted the complexity of cross-chain swaps into a simple, user-friendly process.</p>
                        </div>
                        <div className="relative grid md:grid-cols-3 gap-8 md:gap-16 items-start">
                            <div className="absolute hidden md:block how-it-works-arrow" style={{ width: 'calc(66.66% - 4rem)', left: '16.66%', margin: '0 2rem' }}></div>

                            <div className="text-center animate-in">
                                <div className="flex items-center justify-center bg-indigo-100 text-indigo-600 w-20 h-20 mx-auto rounded-full text-2xl font-bold border-4 border-white shadow-lg">1</div>
                                <h3 className="text-xl font-bold mt-6 mb-2">Connect Your Wallet</h3>
                                <p className="text-slate-600">Securely connect your ICP wallet (like Internet Identity) and your native Bitcoin & Ethereum wallets to begin.</p>
                            </div>

                            <div className="text-center animate-in" style={{ transitionDelay: '0.2s' }}>
                                <div className="flex items-center justify-center bg-indigo-100 text-indigo-600 w-20 h-20 mx-auto rounded-full text-2xl font-bold border-4 border-white shadow-lg">2</div>
                                <h3 className="text-xl font-bold mt-6 mb-2">Choose Your Swap</h3>
                                <p className="text-slate-600">Select the assets you want to exchange and the amounts. Our DApp calculates the best available rate for you.</p>
                            </div>

                            <div className="text-center animate-in" style={{ transitionDelay: '0.4s' }}>
                                <div className="flex items-center justify-center bg-indigo-100 text-indigo-600 w-20 h-20 mx-auto rounded-full text-2xl font-bold border-4 border-white shadow-lg">3</div>
                                <h3 className="text-xl font-bold mt-6 mb-2">Confirm & Receive</h3>
                                <p className="text-slate-600">Review the swap details, confirm the transaction, and our smart contracts handle the rest atomically.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="whyus" className="py-20 lg:py-32">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Why Choose InterSwap?</h2>
                            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Go beyond traditional DEXs and bridges with a truly decentralized solution.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-slate-50 p-8 rounded-2xl flex items-start gap-4 animate-in">
                                <span className="text-2xl text-green-500">✓</span>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Ultimate Decentralization</h3>
                                    <p className="text-slate-600">No single point of failure. Your swap is controlled by immutable code, not a centralized company.</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-2xl flex items-start gap-4 animate-in">
                                <span className="text-2xl text-green-500">✓</span>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Enhanced Security</h3>
                                    <p className="text-slate-600">Direct chain integrations minimize the vulnerabilities common in traditional bridge solutions.</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-2xl flex items-start gap-4 animate-in">
                                <span className="text-2xl text-green-500">✓</span>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Full User Control</h3>
                                    <p className="text-slate-600">You retain full custody of your private keys and assets throughout the entire swap process.</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-2xl flex items-start gap-4 animate-in">
                                <span className="text-2xl text-green-500">✓</span>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Lower Fees</h3>
                                    <p className="text-slate-600">Our efficient on-chain operations significantly reduce the costs associated with cross-chain transfers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="faq" className="py-20 lg:py-32 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
                            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Have questions? We have answers.</p>
                        </div>
                        <div className="max-w-3xl mx-auto space-y-4">
                            {faqItems.map((faq, index) => (
                                <div key={index} className="accordion-item bg-white rounded-xl border border-slate-200 animate-in">
                                    <button className="accordion-header w-full text-left p-6 flex justify-between items-center">
                                        <span className="text-lg font-semibold">{faq.question}</span>
                                        <span className="accordion-arrow text-indigo-500 text-2xl transition-transform duration-300">▾</span>
                                    </button>
                                    <div className="accordion-content px-6">
                                        <p className="text-slate-600">{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="cta" className="py-20 lg:py-32">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900">Ready to Swap?</h2>
                        <p className="mt-4 max-w-xl mx-auto text-lg text-slate-600">
                            Step into the future of decentralized finance. Launch the InterSwap DApp and experience truly seamless cross-chain interoperability today.
                        </p>
                        <div className="mt-8">
                            <a href="#" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition shadow-lg transform hover:scale-105">
                                Launch DApp
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-100 border-t border-slate-200">
                <div className="container mx-auto px-6 py-8 text-center text-slate-500">
                    <p>&copy; 2025 InterSwap. All rights reserved.</p>
                    <div className="mt-4 flex justify-center items-center space-x-6">
                        <a href="#" className="hover:text-indigo-600 transition">GitHub</a>
                        <a href="#" className="hover:text-indigo-600 transition">Twitter</a>
                        <a href="#" className="hover:text-indigo-600 transition">Discord</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
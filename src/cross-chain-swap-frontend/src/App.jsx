import React, { useEffect, useRef, useState, useCallback } from 'react';

function App() {
    const headerRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const heroCanvasRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Mouse tracking for interactive effects
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Sticky header effect
    useEffect(() => {
        const handleScroll = () => {
            if (headerRef.current) {
                if (window.scrollY > 50) {
                    headerRef.current.classList.add('bg-black/10', 'backdrop-blur-xl', 'shadow-2xl', 'border-b', 'border-purple-500/20');
                } else {
                    headerRef.current.classList.remove('bg-black/10', 'backdrop-blur-xl', 'shadow-2xl', 'border-b', 'border-purple-500/20');
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

    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    // Accordion functionality
    const toggleFaq = (index) => {
        setOpenFaqIndex(prevIndex => (prevIndex === index ? null : index));
    };

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

    // Advanced hero canvas animation
    useEffect(() => {
        const canvas = heroCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let waves = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.pulse = Math.random() * 0.02 + 0.01;
                this.pulseDirection = 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Pulsing effect
                this.opacity += this.pulse * this.pulseDirection;
                if (this.opacity > 0.7 || this.opacity < 0.1) {
                    this.pulseDirection *= -1;
                }
            }

            draw() {
                // Gradient particle
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
                gradient.addColorStop(0, `rgba(147, 51, 234, ${this.opacity})`);
                gradient.addColorStop(0.5, `rgba(79, 70, 229, ${this.opacity * 0.5})`);
                gradient.addColorStop(1, `rgba(147, 51, 234, 0)`);
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }

        class Wave {
            constructor(y, color, speed) {
                this.y = y;
                this.color = color;
                this.speed = speed;
                this.amplitude = 30;
                this.frequency = 0.01;
                this.phase = 0;
            }

            update() {
                this.phase += this.speed;
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(0, this.y);
                
                for (let x = 0; x <= width; x++) {
                    const y = this.y + Math.sin(x * this.frequency + this.phase) * this.amplitude;
                    ctx.lineTo(x, y);
                }
                
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                
                const gradient = ctx.createLinearGradient(0, this.y - 50, 0, height);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }

        function createParticles() {
            particles = [];
            const particleCount = Math.floor(width * height / 12000);
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function createWaves() {
            waves = [
                new Wave(height * 0.7, 'rgba(147, 51, 234, 0.1)', 0.02),
                new Wave(height * 0.8, 'rgba(79, 70, 229, 0.05)', 0.015),
                new Wave(height * 0.9, 'rgba(147, 51, 234, 0.03)', 0.01)
            ];
        }

        let animationFrameId;
        function animate() {
            ctx.clearRect(0, 0, width, height);

            // Draw waves
            waves.forEach(wave => {
                wave.update();
                wave.draw();
            });

            // Draw particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Connect nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        const opacity = (1 - dist / 100) * 0.3;
                        ctx.strokeStyle = `rgba(147, 51, 234, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        const handleResize = () => {
            resize();
            createParticles();
            createWaves();
        };

        window.addEventListener('resize', handleResize);
        resize();
        createParticles();
        createWaves();
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
        <div className="antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen text-white overflow-x-hidden">
            

            {/* Cyber Grid Background */}
            <div className="cyber-grid fixed inset-0 opacity-30"></div>

            <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
                <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
                    <a href="#" className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        InterSwap
                    </a>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} 
                           className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105">
                            Features
                        </a>
                        <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} 
                           className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105">
                            How It Works
                        </a>
                        <a href="#whyus" onClick={(e) => handleNavLinkClick(e, 'whyus')} 
                           className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105">
                            Why Us
                        </a>
                        <a href="#faq" onClick={(e) => handleNavLinkClick(e, 'faq')} 
                           className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105">
                            FAQ
                        </a>
                    </div>
                    <a href="#" className="hidden md:block btn-primary text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 neon-glow">
                        Launch DApp
                    </a>
                    <button onClick={toggleMobileMenu} className="md:hidden text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                </nav>
                <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden glassmorphism mx-4 rounded-2xl overflow-hidden`}>
                    <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} className="block py-4 px-6 text-gray-300 hover:text-white hover:bg-white/10">Features</a>
                    <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} className="block py-4 px-6 text-gray-300 hover:text-white hover:bg-white/10">How It Works</a>
                    <a href="#whyus" onClick={(e) => handleNavLinkClick(e, 'whyus')} className="block py-4 px-6 text-gray-300 hover:text-white hover:bg-white/10">Why Us</a>
                    <a href="#faq" onClick={(e) => handleNavLinkClick(e, 'faq')} className="block py-4 px-6 text-gray-300 hover:text-white hover:bg-white/10">FAQ</a>
                    <div className="p-4">
                        <a href="#" className="block text-center btn-primary text-white px-6 py-3 rounded-xl font-bold">Launch DApp</a>
                    </div>
                </div>
            </header>

            <main>
                <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                    <canvas ref={heroCanvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>
                    
                    {/* Floating Elements */}
                    <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl floating-element"></div>
                    <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl floating-element" style={{animationDelay: '2s'}}></div>
                    <div className="absolute bottom-20 left-20 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl floating-element" style={{animationDelay: '4s'}}></div>
                    
                    <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl pulse-ring"></div>
                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-4 text-shadow-glow">
                                Seamless Cross-Chain
                            </h1>
                            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black hero-gradient-text leading-tight mb-8">
                                DeFi Revolution
                            </h2>
                        </div>
                        
                        <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
                            Experience the <span className="text-purple-400 font-bold">future of interoperable finance</span> with native Bitcoin, Ethereum, and multi-chain swaps. 
                            <br className="hidden md:block"/>
                            No bridges. No wrapped tokens. Just pure <span className="text-blue-400 font-bold">decentralized magic</span>.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                            <a href="#" className="group relative btn-primary text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl magnetic-hover">
                            🚀 Launch DApp
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur"></div>
                            </a>
                            <a href="#howitworks" onClick={(e) => handleNavLinkClick(e, 'howitworks')} 
                               className="group glassmorphism text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all duration-300 magnetic-hover">
                                 🎯 Learn More
                            </a>
                        </div>

                         {/* Stats */}
                         <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                            <div className="glassmorphism p-6 rounded-2xl text-center animate-in">
                                <div className="text-3xl font-black text-purple-400 mb-2">$0</div>
                                <div className="text-gray-300">Bridge Fees</div>
                            </div>
                            <div className="glassmorphism p-6 rounded-2xl text-center animate-in" style={{animationDelay: '0.2s'}}>
                                <div className="text-3xl font-black text-blue-400 mb-2">100%</div>
                                <div className="text-gray-300">Decentralized</div>
                            </div>
                            <div className="glassmorphism p-6 rounded-2xl text-center animate-in" style={{animationDelay: '0.4s'}}>
                                <div className="text-3xl font-black text-cyan-400 mb-2">∞</div>
                                <div className="text-gray-300">Possibilities</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-32 relative">
                    <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Revolutionary Features
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                Discover the cutting-edge technology that makes InterSwap the most advanced cross-chain protocol in DeFi
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                            <div className="feature-card p-8 rounded-3xl animate-in">
                                <div className="text-6xl mb-6">🛡️</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Quantum-Safe Security</h3>
                                <p className="text-gray-300 leading-relaxed">Revolutionary HTLC contracts combined with ICP's Chain-Key Cryptography create an impenetrable fortress for your assets.</p>
                            </div>

                            <div className="feature-card p-8 rounded-3xl animate-in" style={{animationDelay: '0.1s'}}>
                                <div className="text-6xl mb-6">⚡</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Lightning Speed</h3>
                                <p className="text-gray-300 leading-relaxed">Sub-second finality with near-zero fees. Experience the fastest cross-chain swaps in the multiverse.</p>
                            </div>

                            <div className="feature-card p-8 rounded-3xl animate-in" style={{animationDelay: '0.2s'}}>
                                <div className="text-6xl mb-6">🔄</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Native Asset Swaps</h3>
                                <p className="text-gray-300 leading-relaxed">True native-to-native swaps. No synthetic tokens, no wrapped assets - just pure, unadulterated cross-chain magic.</p>
                            </div>

                            <div className="feature-card p-8 rounded-3xl animate-in" style={{animationDelay: '0.3s'}}>
                                <div className="text-6xl mb-6">🎨</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Intuitive Interface</h3>
                                <p className="text-gray-300 leading-relaxed">A sleek, futuristic interface that makes complex cross-chain operations feel effortless and enjoyable.</p>
                            </div>
                            
                            <div className="feature-card p-8 rounded-3xl animate-in" style={{animationDelay: '0.4s'}}>
                                <div className="text-6xl mb-6">🌐</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Internet Computer Powered</h3>
                                <p className="text-gray-300 leading-relaxed">Built on the world's most advanced blockchain computer, ensuring censorship resistance and unstoppable operation.</p>
                            </div>
                            
                            <div className="feature-card p-8 rounded-3xl animate-in" style={{animationDelay: '0.5s'}}>
                                <div className="text-6xl mb-6">🧩</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Universal Compatibility</h3>
                                <p className="text-gray-300 leading-relaxed">Support for all major blockchains and tokens. The ultimate hub for cross-chain interoperability.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="howitworks" className="py-32 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                How The Magic Works
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                Three simple steps to cross-chain freedom. We've distilled complex blockchain interactions into pure simplicity.
                            </p>
                        </div>
             
                        <div className="grid grid-cols-1 gap-12 max-w-6xl mx-auto">
                            <div className="text-center animate-in relative">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-50 pulse-ring"></div>
                                    <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                                        1
                                    </div>
                                </div>
                                <div className="hidden md:block step-connector"></div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Connect & Authenticate</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Seamlessly connect your wallets using cutting-edge Internet Identity and multi-chain authentication protocols.
                                </p>
                            </div>

                            <div className="text-center animate-in relative" style={{animationDelay: '0.2s'}}>
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg opacity-50 pulse-ring"></div>
                                    <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                                        2
                                    </div>
                                </div>
                                <div className="hidden md:block step-connector"></div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Configure Your Swap</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Select your assets and amounts. Our AI-powered engine finds the optimal rates across all liquidity sources.
                                </p>
                            </div>

                            <div className="text-center animate-in" style={{animationDelay: '0.4s'}}>
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-lg opacity-50 pulse-ring"></div>
                                    <div className="relative bg-gradient-to-r from-cyan-500 to-purple-500 w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                                        3
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Execute & Enjoy</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Confirm and watch as our quantum-secured smart contracts execute your swap atomically across chains.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="whyus" className="py-32 relative">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Why InterSwap Dominates
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                Step beyond traditional DEXs and vulnerable bridges into the future of truly decentralized finance.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-12 max-w-6xl mx-auto">
                            <div className="glassmorphism p-10 rounded-3xl animate-in hover:scale-105 transition-all duration-500">
                                <div className="flex items-start gap-6">
                                    <div className="text-4xl">⚡</div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-white">Unmatched Performance</h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            Lightning-fast transactions with sub-second finality. Experience the speed of light in blockchain form.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glassmorphism p-10 rounded-3xl animate-in hover:scale-105 transition-all duration-500" style={{animationDelay: '0.1s'}}>
                                <div className="flex items-start gap-6">
                                    <div className="text-4xl">🔒</div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-white">Fort Knox Security</h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            Military-grade cryptographic protocols ensure your assets are safer than traditional banking systems.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glassmorphism p-10 rounded-3xl animate-in hover:scale-105 transition-all duration-500" style={{animationDelay: '0.2s'}}>
                                <div className="flex items-start gap-6">
                                    <div className="text-4xl">🎯</div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-white">Zero Counterparty Risk</h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            Pure trustless architecture. No intermediaries, no custody risks, no single points of failure.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glassmorphism p-10 rounded-3xl animate-in hover:scale-105 transition-all duration-500" style={{animationDelay: '0.3s'}}>
                                <div className="flex items-start gap-6">
                                    <div className="text-4xl">💰</div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-white">Minimal Fees</h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            Revolutionary efficiency translates to the lowest fees in DeFi. Keep more of your money where it belongs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="faq" className="py-32 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-purple-900/50"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                Questions & Answers
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                Everything you need to know about the future of cross-chain DeFi.
                            </p>
                        </div>
                        
                        <div className="max-w-4xl mx-auto space-y-6">
                            {faqItems.map((faq, index) => (
                                <div key={index} className={`accordion-item rounded-2xl overflow-hidden ${openFaqIndex === index ? 'open' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
                                    <button 
                                        className="accordion-header w-full text-left p-8 flex justify-between items-center hover:bg-white/5 transition-all duration-300"
                                        onClick={() => toggleFaq(index)}
                                    >
                                        <span className="text-xl font-bold text-white">{faq.question}</span>
                                        <span className="accordion-arrow text-purple-400 text-3xl transition-transform duration-300">▾</span>
                                    </button>
                                    <div className="accordion-content px-8">
                                        <p className="text-gray-300 leading-relaxed text-lg">{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="cta" className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20"></div>
                    <div className="container mx-auto px-6 text-center relative z-10">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 text-shadow-glow">
                                Ready to Revolutionize
                                <span className="block hero-gradient-text">Your DeFi Experience?</span>
                            </h2>
                            <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                                Join thousands of traders who've discovered the power of truly decentralized cross-chain swaps. 
                                The future of finance is here.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                                <a href="#" className="group btn-primary text-white px-12 py-6 rounded-2xl font-bold text-2xl shadow-2xl neon-glow magnetic-hover">
                                🚀 Launch DApp Now
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"></div>
                                </a>
                                <a href="#features" onClick={(e) => handleNavLinkClick(e, 'features')} 
                                   className="glassmorphism text-white px-12 py-6 rounded-2xl font-bold text-2xl hover:bg-white/20 transition-all duration-300 magnetic-hover">
                                     🔍 Explore Features
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative border-t border-purple-500/20 bg-gradient-to-r from-slate-900 to-purple-900">
                <div className="container mx-auto px-6 py-12">
                    <div className="text-center">
                        <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
                            InterSwap
                        </div>
                        <p className="text-gray-400 mb-8">© 2025 InterSwap. Revolutionizing DeFi, one swap at a time.</p>
                        <div className="flex justify-center items-center space-x-8">
                            <a href="#" className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:scale-110 text-lg font-medium">
                                 GitHub
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-all duration-300 hover:scale-110 text-lg font-medium">
                                 Twitter
                            </a>
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-all duration-300 hover:scale-110 text-lg font-medium">
                                 Discord
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, Clock, Smartphone, User, LogIn, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-charging-station.jpg";

const HeroSection = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleFindStations = () => {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ perspective: "1200px" }}>
      {/* Top Header with Logo and Auth Buttons */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b py-1 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">EVCharger</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/admin-auth')}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Building2 className="h-4 w-4" />
                  Station Owner
                </Button>
                <Button 
                  variant="electric" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-secondary/60" />
      
      {/* Hero image with 3D parallax effect - more visible */}
      <div 
        className="absolute inset-0 opacity-40 animate-[slowShake_15s_ease-in-out_infinite] transition-transform duration-1000 ease-out"
        style={{
          transform: `scale(1.08) translate3d(${mousePos.x * -5}px, ${mousePos.y * -5}px, 0)`,
        }}
      >
        <img 
          src={heroImage} 
          alt="EV Charging Station" 
          className="w-full h-full object-cover"
        />
      </div>
      {/* Gradient overlay on top of image */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-electric-blue to-electric-green bg-clip-text text-transparent">
              Charge
            </span>
            <br />
            <span className="text-foreground">Your Journey</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find nearby EV charging stations, check real-time availability, and book your charging slot in advance. 
            Never wait in line again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            variant="electric" 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={handleFindStations}
          >
            <Zap className="mr-2 h-5 w-5" />
            Find Stations
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={handleGetStarted}
          >
            {user ? (
              <>
                <User className="mr-2 h-5 w-5" />
                Go to Dashboard
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Get Started
              </>
            )}
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div 
            className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 cursor-pointer hover:bg-card/70 transition-all hover:scale-105"
            onClick={() => {
              const mapSection = document.querySelector('#booking-section')?.previousElementSibling;
              mapSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-electric-blue flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Nearby</h3>
            <p className="text-muted-foreground text-center">
              Locate charging stations within your area using our interactive map
            </p>
          </div>

          <div 
            className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 cursor-pointer hover:bg-card/70 transition-all hover:scale-105"
            onClick={() => {
              document.getElementById('live-charging-dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-green to-electric-amber flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Status</h3>
            <p className="text-muted-foreground text-center">
              Check live availability and charging speeds before you arrive
            </p>
          </div>

          <div 
            className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 cursor-pointer hover:bg-card/70 transition-all hover:scale-105"
            onClick={() => {
              document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-blue to-primary flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Book in Advance</h3>
            <p className="text-muted-foreground text-center">
              Reserve your charging slot and pay securely through the app
            </p>
          </div>
        </div>
      </div>

      {/* Animated 3D background orbs */}
      <div 
        className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]"
        style={{ transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 50px)` }}
      />
      <div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-electric-blue/15 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{ transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 30px)` }}
      />
      <div 
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-electric-green/10 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]"
        style={{ transform: `translate3d(${mousePos.x * 15}px, ${mousePos.y * -15}px, 40px)` }}
      />
    </section>
  );
};

export default HeroSection;
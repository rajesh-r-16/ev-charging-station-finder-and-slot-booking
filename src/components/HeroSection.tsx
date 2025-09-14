import { Button } from "@/components/ui/button";
import { MapPin, Zap, Clock, Smartphone } from "lucide-react";
import heroImage from "@/assets/hero-charging-station.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-secondary/80" />
      
      {/* Hero image with overlay */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src={heroImage} 
          alt="EV Charging Station" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

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
          <Button variant="electric" size="lg" className="text-lg px-8 py-6">
            <Zap className="mr-2 h-5 w-5" />
            Find Stations
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6">
            <Smartphone className="mr-2 h-5 w-5" />
            Download App
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-electric-blue flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Nearby</h3>
            <p className="text-muted-foreground text-center">
              Locate charging stations within your area using our interactive map
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-green to-electric-amber flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Status</h3>
            <p className="text-muted-foreground text-center">
              Check live availability and charging speeds before you arrive
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
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

      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </section>
  );
};

export default HeroSection;
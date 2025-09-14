import HeroSection from "@/components/HeroSection";
import ChargingStationMap from "@/components/ChargingStationMap";
import BookingInterface from "@/components/BookingInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ChargingStationMap />
      <BookingInterface />
    </div>
  );
};

export default Index;

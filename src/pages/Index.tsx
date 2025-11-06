import HeroSection from "@/components/HeroSection";
import LiveChargingDashboard from "@/components/LiveChargingDashboard";
import EnhancedChargingStationMap from "@/components/EnhancedChargingStationMap";
import EnhancedBookingInterface from "@/components/EnhancedBookingInterface";
import ReviewsAndRatings from "@/components/ReviewsAndRatings";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <LiveChargingDashboard />
      <EnhancedChargingStationMap />
      <div id="booking-section">
        <EnhancedBookingInterface />
      </div>
      <ReviewsAndRatings />
    </div>
  );
};

export default Index;

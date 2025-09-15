import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ThumbsUp, MessageCircle, Filter, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  station_name: string;
  user_name: string;
  helpful_count: number;
}

const ReviewsAndRatings = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userStations, setUserStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) {
      fetchUserStations();
    }
  }, [user, filterRating, sortBy]);

  const fetchReviews = async () => {
    try {
      // Since we don't have a reviews table in the current schema,
      // we'll create mock reviews for demonstration
      const mockReviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Excellent charging station! Fast charging and very clean facilities. The location is perfect with great amenities nearby.',
          created_at: '2024-01-15T10:30:00Z',
          station_name: 'Tesla Supercharger - City Center',
          user_name: 'John D.',
          helpful_count: 12
        },
        {
          id: '2',
          rating: 4,
          comment: 'Good charging speed and reliable. The parking spaces could be a bit larger, but overall a solid choice.',
          created_at: '2024-01-14T14:20:00Z',
          station_name: 'ChargePoint Station - Mall Plaza',
          user_name: 'Sarah M.',
          helpful_count: 8
        },
        {
          id: '3',
          rating: 5,
          comment: 'Ultra-fast charging here! Got from 20% to 80% in just 15 minutes. Premium pricing but worth it for the speed.',
          created_at: '2024-01-13T16:45:00Z',
          station_name: 'EVgo Charging Hub - Airport',
          user_name: 'Mike R.',
          helpful_count: 15
        },
        {
          id: '4',
          rating: 3,
          comment: 'Decent station but often busy. The app integration works well for reservations though.',
          created_at: '2024-01-12T09:15:00Z',
          station_name: 'Electrify America - Highway Rest',
          user_name: 'Emma L.',
          helpful_count: 5
        }
      ];

      let filteredReviews = mockReviews;

      // Apply rating filter
      if (filterRating !== "all") {
        const targetRating = parseInt(filterRating);
        filteredReviews = filteredReviews.filter(review => review.rating === targetRating);
      }

      // Apply sorting
      filteredReviews.sort((a, b) => {
        switch (sortBy) {
          case "helpful":
            return b.helpful_count - a.helpful_count;
          case "rating-high":
            return b.rating - a.rating;
          case "rating-low":
            return a.rating - b.rating;
          default: // recent
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      setReviews(filteredReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchUserStations = async () => {
    if (!user) return;

    try {
      // Get stations where user has made bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          station_id,
          charging_stations (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Remove duplicates and format
      const uniqueStations = bookings?.reduce((acc: any[], booking) => {
        const station = booking.charging_stations;
        if (station && !acc.find(s => s.id === station.id)) {
          acc.push(station);
        }
        return acc;
      }, []) || [];

      setUserStations(uniqueStations);
    } catch (error) {
      console.error('Error fetching user stations:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStation || rating === 0 || !comment.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a station, rating, and write a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, this would submit to a reviews table
      // For now, we'll simulate success
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. It helps other users make informed decisions.",
      });

      // Reset form
      setSelectedStation("");
      setRating(0);
      setComment("");

      // Refresh reviews
      setTimeout(() => {
        fetchReviews();
      }, 1000);

    } catch (error: any) {
      console.error('Review submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, size = 'sm') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} ${
              star <= rating 
                ? 'fill-electric-amber text-electric-amber' 
                : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:text-electric-amber' : ''}`}
            onClick={interactive ? () => setRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Reviews & <span className="bg-gradient-to-r from-primary to-electric-blue bg-clip-text text-transparent">Ratings</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real feedback from our charging community to help you choose the best stations
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Write Review Form */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50 h-fit">
            <h3 className="text-xl font-semibold mb-6">Write a Review</h3>
            
            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Station</label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a station you've visited" />
                    </SelectTrigger>
                    <SelectContent>
                      {userStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userStations.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete a charging session to review stations
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  {renderStars(rating, true, 'lg')}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Your Review</label>
                  <Textarea
                    placeholder="Share your experience with this charging station..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-electric-blue hover:from-primary/80 hover:to-electric-blue/80"
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !selectedStation || rating === 0 || !comment.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Sign in to write reviews</p>
                <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                  Sign In
                </Button>
              </div>
            )}
          </Card>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {getAverageRating().toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(Math.round(getAverageRating()))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {reviews.length} reviews
                  </p>
                </div>

                <div className="space-y-2">
                  {Object.entries(getRatingDistribution()).reverse().map(([rating, count]) => (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{rating}★</span>
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-electric-blue h-2 rounded-full"
                          style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="justify-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    98% Positive
                  </Badge>
                  <Badge variant="outline" className="justify-center">
                    <Star className="h-3 w-3 mr-1" />
                    Top Rated Network
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter:</span>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="helpful">Most Helpful</SelectItem>
                      <SelectItem value="rating-high">Highest Rated</SelectItem>
                      <SelectItem value="rating-low">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Reviews */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {review.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStars(review.rating)}
                      <p className="text-sm text-muted-foreground mt-1">
                        {review.station_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {review.comment}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful ({review.helpful_count})
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {reviews.length === 0 && (
              <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border border-border/50">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No reviews found</p>
                <p className="text-sm text-muted-foreground">
                  {filterRating !== "all" ? "Try adjusting your filters" : "Be the first to write a review!"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsAndRatings;
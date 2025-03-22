import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryFilter from "@/components/marketplace/CategoryFilter";
import Transition from "@/components/animations/Transition";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Star,
  ArrowRight,
  Filter,
  ArrowDownAZ,
  TrendingUp,
  Zap,
  Shield,
  Star as StarIcon,
  Tag,
  Clock,
  Search,
} from "lucide-react";
import {
  Agent,
  categories,
} from "@/lib/marketPlaceData";
import { useAuthUser } from "@/context/AuthUserContext";

// Available categories for filtering

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] =
    useState<Agent[]>([]);
  const [marketPlaceItems, setMarketPlaceItems] = useState<Agent[]>([]);

  const [sortOption, setSortOption] = useState<
    "popular" | "newest" | "priceAsc" | "priceDesc"
  >("popular");
  const navigate = useNavigate();
  const { usersAgent, setUsersAgent, cartAgent, setCartAgent } = useAuthUser();


  useEffect(()=> {
      const fetchMarketplaceItems = async () => {
        try{
        const response = await fetch(`${import.meta.env.VITE_FAST_API_BACKEND_URL}/api/marketplace/agents`);
        const data = await response.json();
        console.log('data', data);
        
        setMarketPlaceItems(data);
        setFilteredItems(data);
    }
    catch(err){
      console.log(err);
    }
  }
    fetchMarketplaceItems();
  }, [])
  // Function to check if an item is already in the cart
  const isInCart = (itemId: number) => {
    return cartAgent.some((item: Agent) => item.id === itemId);
  };

  // Filter and sort items based on search query, category, and sort option

  useEffect(() => {
    let filtered = marketPlaceItems.filter(
      (item) =>
        !usersAgent?.some(
          (agentItem: Agent) => agentItem.id === item.id
        )
    );
    // console.log('filtered', filtered);

    console.log("searchQuery", searchQuery);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Apply sorting
    switch (sortOption) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // In a real app, you would sort by date
        filtered = [...filtered].sort(
          (a, b) => (a.featured ? -1 : 1) - (b.featured ? -1 : 1)
        );
        break;
      case "priceAsc":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSortOption("popular");
  };
  const handleAddToCart = (item: Agent) => {
    setCartAgent([...cartAgent, item]);
  };

  console.log("cartAgent", cartAgent);
  console.log("usersAgent", usersAgent);
  return (
    <main className="flex-grow pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="px-3 py-1 mb-4 bg-background">
                <Zap className="w-3.5 h-3.5 mr-1.5 text-primary" />
                AI Marketplace
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover and Deploy
                <br />
                Powerful AI Solutions
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Browse our curated marketplace of pre-built AI agents, tools,
                and integrations to supercharge your workflow.
              </p>
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search for AI tools and agents..."
                    className="pr-10 h-12 text-base"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Featured Solutions</h2>
                <p className="text-muted-foreground">
                  Top-rated AI tools selected by our team
                </p>
              </div>
              <Button
                variant="outline"
                className="hidden md:flex items-center gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Transition>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketPlaceItems
              .filter((item) => item.featured)
              .slice(0, 3)
              .map((item, index) => (
                <Transition key={item.id} delay={index * 200}>
                  <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="font-medium">
                          Featured
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <div className="flex items-center text-amber-500">
                          <Star className="fill-amber-500 h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            {item.rating}
                          </span>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 h-10">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="bg-secondary/30 hover:bg-secondary/40"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {item.seller.verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          )}
                          {item.seller.name}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{item.category}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-2">
                      <div className="font-medium text-lg">${item.price}</div>
                      {isInCart(item.id) ? (
                        <Button variant="secondary" disabled>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Added to Cart
                        </Button>
                      ) : (
                        <Button onClick={() => handleAddToCart(item)}>
                          Add to Cart
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </Transition>
              ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Browse by Category</h2>
            </div>
          </Transition>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Transition key={category} delay={index * 50}>
                <Card
                  className={cn(
                    "cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all",
                    selectedCategory === category
                      ? "border-primary border-2"
                      : ""
                  )}
                  onClick={() =>
                    setSelectedCategory(
                      category === selectedCategory ? null : category
                    )
                  }
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      {getCategoryIcon(category)}
                    </div>
                    <h3 className="font-medium">{category}</h3>
                    <p className="text-xs text-muted-foreground">
                      {
                        marketPlaceItems.filter(
                          (item) => item.category === category
                        ).length
                      }{" "}
                      items
                    </p>
                  </CardContent>
                </Card>
              </Transition>
            ))}
          </div>
        </div>
      </section>

      {/* Main Marketplace Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">All AI Solutions</h2>
                <p className="text-muted-foreground">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1 ? "item" : "items"} available
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => setSortOption("popular")}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Popular</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 ml-2"
                    onClick={() =>
                      setSortOption(
                        sortOption === "priceAsc" ? "priceDesc" : "priceAsc"
                      )
                    }
                  >
                    <ArrowDownAZ className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {sortOption === "priceAsc"
                        ? "Price: Low to High"
                        : "Price: High to Low"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 ml-2"
                    onClick={() => setSortOption("newest")}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Newest</span>
                  </Button>
                </div>
              </div>
            </div>
          </Transition>

          <div className="flex flex-col md:flex-row gap-6">
            <Transition
              delay={100}
              className="w-full md:w-64 lg:w-72 flex-shrink-0"
            >
              <div className="sticky top-24 bg-card rounded-lg border p-4">
                <div className="mb-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </h3>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Categories</p>
                    <CategoryFilter
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Price Range</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        className="w-full"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Rating</p>
                    <div className="flex items-center gap-1.5">
                      {[4, 3, 2, 1].map((rating) => (
                        <Button
                          key={rating}
                          variant="outline"
                          size="sm"
                          className="px-2.5 py-1"
                        >
                          {rating}+{" "}
                          <StarIcon className="h-3 w-3 ml-1 text-amber-500" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={handleResetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            </Transition>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <Transition key={item.id} delay={150 + index * 50}>
                      <Card className="h-full flex flex-col hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                        <div className="relative h-40 overflow-hidden rounded-t-lg">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {item.featured && (
                            <div className="absolute top-2 right-2">
                              <Badge
                                variant="secondary"
                                className="font-medium"
                              >
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {item.title}
                            </CardTitle>
                            <div className="flex items-center text-amber-500">
                              <Star className="fill-amber-500 h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">
                                {item.rating}
                              </span>
                            </div>
                          </div>
                          <CardDescription className="line-clamp-2 h-10">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 flex-grow">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="bg-secondary/30 hover:bg-secondary/40"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 2 && (
                              <Badge
                                variant="outline"
                                className="bg-secondary/30 hover:bg-secondary/40"
                              >
                                +{item.tags.length - 2} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {item.seller.verified && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                              )}
                              {item.seller.name}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center pt-2 mt-auto">
                          <div className="font-medium">${item.price}</div>
                          {isInCart(item.id) ? (
                            <Button
                              variant="secondary"
                              className="text-green-600"
                              disabled
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              In Cart
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleAddToCart(item)}
                            >
                              Add to Cart
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </Transition>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We couldn't find any AI solutions that match your
                      criteria. Try adjusting your filters or search for
                      something else.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory(null);
                        setFilteredItems(marketPlaceItems);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary/20 to-secondary/20">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to build your own AI solution?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Can't find what you're looking for? Create your own custom AI
                workflow with our drag-and-drop workflow builder.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="h-12 px-8"
                  onClick={() => navigate("/workflow-editor")}
                >
                  Build Your Own Solution
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8">
                  Contact Our Team
                </Button>
              </div>
            </div>
          </Transition>
        </div>
      </section>
    </main>
  );
};

// Helper function to get icons for different categories
function getCategoryIcon(category: string) {
  switch (category) {
    case "Marketing":
      return <Tag className="h-6 w-6 text-primary" />;
    case "Analytics":
      return <TrendingUp className="h-6 w-6 text-primary" />;
    case "Productivity":
      return <Zap className="h-6 w-6 text-primary" />;
    case "Legal":
      return <Shield className="h-6 w-6 text-primary" />;
    case "Research":
      return <Search className="h-6 w-6 text-primary" />;
    case "Customer Support":
      return <StarIcon className="h-6 w-6 text-primary" />;
    default:
      return <Zap className="h-6 w-6 text-primary" />;
  }
}

export default Marketplace;

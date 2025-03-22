import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/context/AuthUserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trash2,
  ArrowLeft,
  CheckCircle2,
  ShoppingCart,
  Shield,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketplaceItem } from "@/lib/marketPlaceData";
import Transition from "@/components/animations/Transition";
import {loadStripe} from '@stripe/stripe-js';

const PaymentCheckout = () => {
  const { cartAgent, setCartAgent, setUsersAgent, usersAgent } = useAuthUser();
  const navigate = useNavigate();

  // Function to remove an item from the cart
  const handleRemoveFromCart = (itemId: string) => {
    const updatedCart = cartAgent.filter(
      (item: MarketplaceItem) => item.id !== itemId
    );
    setCartAgent(updatedCart);
  };

  // Calculate the total price
  const calculateTotal = () => {
    return cartAgent.reduce(
      (total: number, item: MarketplaceItem) => total + item.price,
      0
    );
  };

  // Handle the checkout process
  const handleCheckout = () => {
    // Add cart items to user's agents
   
    // Show success notification or redirect
    alert("Purchase successful! Agents have been added to your account.");
    navigate("/marketplace");
  };

  const makePayment = async () => {
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    const response = await fetch(`${import.meta.env.VITE_NODE_BACKEND_URL}/api/payment/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ products: cartAgent }),
    });
  
    const session = await response.json();
  
    
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error(result.error);
    }
  };
  
  return (
    <main className="flex-grow pt-24 pb-16">
      <div className="container mx-auto px-4">
        <Transition>
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => navigate("/marketplace")}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Marketplace
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

          {cartAgent.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <h3 className="text-xl font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Looks like you haven't added any AI agents to your cart yet.
                Explore our marketplace to find powerful AI solutions.
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cart Items ({cartAgent.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cartAgent.map((item: MarketplaceItem, index: number) => (
                      <div key={item.id}>
                        <div className="flex gap-4 py-4">
                          <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-lg">
                                {item.title}
                              </h3>
                              <div className="font-bold">${item.price}</div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1.5">
                                {item.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="bg-secondary/30"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 2 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-secondary/30"
                                  >
                                    +{item.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                        {index < cartAgent.length - 1 && <Separator />}
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/marketplace")}
                    >
                      Continue Shopping
                    </Button>
                    <Button onClick={() => setCartAgent([])}>Clear Cart</Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cartAgent.map((item: MarketplaceItem) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm truncate max-w-[70%]">
                            {item.title}
                          </span>
                          <span className="font-medium">${item.price}</span>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span>Subtotal</span>
                        <span className="font-medium">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-green-600">
                        <span>Discount</span>
                        <span>$0.00</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>

                      <div className="bg-primary/5 rounded-md p-3 text-sm">
                        <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                          <Shield className="h-4 w-4" />
                          Secure Checkout
                        </div>
                        <p className="text-muted-foreground">
                          Your payment information is securely processed and
                          never stored on our servers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full py-6 text-base"
                      onClick={makePayment}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Complete Purchase
                    </Button>
                  </CardFooter>
                </Card>

                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>
                    By completing your purchase, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </Transition>
      </div>
    </main>
  );
};

export default PaymentCheckout;

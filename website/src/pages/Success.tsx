import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuthUser } from "@/context/AuthUserContext";

const Success: React.FC = () => {
  const navigate = useNavigate();
  const { usersAgent, setUsersAgent, setCartAgent } = useAuthUser();

  useEffect(() => {
    const pendingCart = JSON.parse(localStorage.getItem("pendingCart") || "[]");
    console.log('pendingCart', pendingCart);
    if (pendingCart.length > 0) {
      setUsersAgent([...usersAgent, ...pendingCart]);
      setCartAgent([]); // Clear cart after updating users' agents
      localStorage.removeItem("pendingCart");
      window.scrollTo(0, 0);
    }
  }, []);
  console.log('usersAgent', usersAgent[0]?.icon);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <CheckCircle
              size={96}
              className="text-green-500 mb-4"
              strokeWidth={1.5}
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your transaction has been completed
              successfully.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg w-full mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">
                Order Details
              </h2>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="text-gray-900 font-medium">{`#${Math.random()
                  .toString(36)
                  .substr(2, 9)
                  .toUpperCase()}`}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900 font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="border-t border-gray-200 my-3"></div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-900">Status:</span>
                <span className="text-green-600">Completed</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={() => navigate("/")}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
              >
                Back to Marketplace
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
              >
                View My Purchases
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;

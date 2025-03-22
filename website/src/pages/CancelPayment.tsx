import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CancelPayment: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleConfirmCancel = () => {
    // Add logic here to handle the payment cancellation
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" className="mb-4 p-2" onClick={handleGoBack}>
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </Button>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Cancel Payment</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground text-center mb-6">
            Are you sure you want to cancel this payment? This action cannot be
            undone.
          </p>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              If you cancel:
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">
                Your payment process will be terminated
              </li>
              <li className="text-sm">
                Any pending transactions will be voided
              </li>
              <li className="text-sm">You'll be returned to the dashboard</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="w-full" onClick={handleGoBack}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleConfirmCancel}
          >
            Confirm Cancellation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CancelPayment;

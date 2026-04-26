"use client";
import React from "react";
import { Button } from "./ui/button";
// import axios from "axios";

type Props = { isPro: boolean };

const STRIPE_ENABLED = false;

const SubscriptionButton = ({ isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);

  const handleSubscription = async () => {
    if (!STRIPE_ENABLED) {
      console.warn("[subscription] Stripe is currently disabled");
      return;
    }

    try {
      setLoading(true);

      // const response = await axios.get("/api/stripe");
      // window.location.href = response.data.url;

    } catch (error) {
      console.error("[subscription] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      disabled={!STRIPE_ENABLED || loading}
      onClick={handleSubscription}
      variant="outline"
    >
      {STRIPE_ENABLED
        ? isPro
          ? "Manage Subscription"
          : "Upgrade to Pro"
        : "Coming Soon"}
    </Button>
  );
};

export default SubscriptionButton;
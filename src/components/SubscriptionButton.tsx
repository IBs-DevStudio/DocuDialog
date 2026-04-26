"use client";
import React from "react";
import { Button } from "./ui/button";
// import axios from "axios";

type Props = { isPro: boolean };

const STRIPE_ENABLED =
  process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

const SubscriptionButton = ({ isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);

  const handleSubscription = async () => {
    if (!STRIPE_ENABLED) {
      console.warn("[subscription] Stripe is disabled");
      return;
    }

    try {
      setLoading(true);

      // const response = await axios.get("/api/stripe");
      // window.location.href = response.data.url;

    } catch (error) {
      console.error("[subscription] Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const label = loading
    ? "Redirecting..."
    : STRIPE_ENABLED
    ? isPro
      ? "Manage Subscription"
      : "Upgrade to Pro"
    : "Coming Soon";

  return (
    <Button
      disabled={!STRIPE_ENABLED || loading}
      onClick={handleSubscription}
      variant="outline"
    >
      {label}
    </Button>
  );
};

export default SubscriptionButton;
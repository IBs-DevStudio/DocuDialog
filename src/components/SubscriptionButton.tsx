// STRIPE DISABLED - TO BE ENABLED LATER
"use client";
import React from "react";
import { Button } from "./ui/button";
// import axios from "axios";

type Props = { isPro: boolean };

const SubscriptionButton = (props: Props) => {
  // const [loading, setLoading] = React.useState(false);
  // const handleSubscription = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.get("/api/stripe");
  //     window.location.href = response.data.url;
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  
  // TEMPORARY: Hide subscription button when Stripe is disabled
  return null;
  
  // ORIGINAL CODE - COMMENTED OUT FOR NOW
  // return (
  //   <Button disabled={loading} onClick={handleSubscription} variant="outline">
  //     {props.isPro ? "Manage Subscriptions" : "Get Pro"}
  //   </Button>
  // );
};

export default SubscriptionButton;

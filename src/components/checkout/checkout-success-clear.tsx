"use client";

import { useEffect } from "react";
import { useEnquiryBasket } from "@/store/commerce";

/** Clear the bag after a successful card checkout. */
export function CheckoutSuccessClear() {
  const clear = useEnquiryBasket((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

// @ts-check
// PulseMascot Shopify Function (Cart Transform & Automated Checkout Tier Discount)
// Converted to WebAssembly (WASM) during "shopify app deploy"

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const operations = [];
  const cartTotal = parseFloat(input?.cart?.cost?.totalAmount?.amount || "0");
  const unlockedTier = input?.cart?.attribute?.value;

  // Evaluates tier discounts applied automatically at checkout without discount codes
  if (unlockedTier === "VIP" || cartTotal >= 120.0) {
    // 15% VIP discount automatically applied via Shopify Functions
    operations.push({
      update: {
        cartLines: (input.cart.lines || []).map((line) => ({
          cartLineId: line.id,
          price: {
            adjustment: {
              percentageDecrease: {
                value: 15.0,
              },
            },
          },
        })),
      },
    });
  }

  return {
    operations,
  };
}

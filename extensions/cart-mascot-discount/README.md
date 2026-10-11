# PulseMascot Shopify Function: Checkout Extensibility
## Automated WASM Cart Transformations & Checkout Tier Discounts

This extension is built on Shopify's cutting-edge **Shopify Functions** architecture (replacing deprecated `checkout.liquid` scripts with WebAssembly executing under 5ms).

### Key Commercial Features
- **Automatic VIP Tier Discounting**: When a customer unlocks Tier 3 VIP status, this Function automatically applies the 15% discount at checkout without requiring manual discount code input.
- **Zero Merchant Setup**: Operates natively in Shopify Checkout Extensibility.
- **WASM Compiled**: Compiles to high-performance WebAssembly (`dist/function.wasm`) during `shopify app deploy`.

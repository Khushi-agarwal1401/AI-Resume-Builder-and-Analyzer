"""Add startup env var validation and fix non-null assertions."""
import re

with open('src/lib/stripe.ts', 'r') as f:
    content = f.read()

# Add validation for STRIPE_SECRET_KEY before using it
old_stripe = """export async function getStripe(): Promise<Stripe> {
  if (!_stripe) {
    const StripeModule = await import(\"stripe\");
    _stripe = new StripeModule.default(process.env.STRIPE_SECRET_KEY!, {"""

new_stripe = """export async function getStripe(): Promise<Stripe> {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        \"STRIPE_SECRET_KEY is not configured. Set the STRIPE_SECRET_KEY environment variable.\"
      );
    }
    if (!process.env.STRIPE_PRO_PRICE_ID_MONTHLY || !process.env.STRIPE_PRO_PRICE_ID_YEARLY) {
      throw new Error(
        \"STRIPE_PRO_PRICE_ID_MONTHLY and STRIPE_PRO_PRICE_ID_YEARLY must be set in environment.\"
      );
    }
    const StripeModule = await import(\"stripe\");
    _stripe = new StripeModule.default(process.env.STRIPE_SECRET_KEY, {"""

content = content.replace(old_stripe, new_stripe)

with open('src/lib/stripe.ts', 'w') as f:
    f.write(content)

print("✅ Env var validation added to stripe.ts")

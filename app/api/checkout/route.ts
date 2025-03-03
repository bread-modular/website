import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price: item.version.productId,
      quantity: item.quantity,
    }));

    // Create Stripe checkout session with customer information collection
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart?canceled=true`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'ES', 'IT', 'NL', 
          'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PT', 'IE', 'GR', 
          'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'RO', 'BG', 'JP', 'KR', 
          'SG', 'MY', 'TH', 'PH', 'ID', 'VN', 'IN', 'BR', 'MX', 'AR', 
          'CL', 'CO', 'PE', 'ZA', 'AE', 'IL', 'TR', 'RU', 'UA', "LK"
        ],
      },
      shipping_options: [
        {
          shipping_rate: 'shr_1QyTRKDOvwMyUDfcNI3kuhdA',
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        shipping_address: {
          message: 'Please provide your complete shipping address for delivery.',
        },
        submit: {
          message: 'We\'ll process your order as soon as payment is confirmed.',
        },
      },
      metadata: {
        order_id: `order-${Date.now()}`,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 
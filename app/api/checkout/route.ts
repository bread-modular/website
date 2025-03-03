import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CartItem } from '@/lib/cart';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Function to get the base URL, using Vercel URL if NEXT_PUBLIC_BASE_URL is not available
function getBaseUrl() {
  // First check if NEXT_PUBLIC_BASE_URL is set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // If not, check for Vercel deployment URL
  // VERCEL_URL is provided by Vercel in production deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback to localhost in development
  return 'http://localhost:3000';
}

// Define shipping rate IDs for different environments
const SHIPPING_RATES = {
  development: 'shr_1QyTRKDOvwMyUDfcNI3kuhdA',
  production: 'shr_1QyQmRDOvwMyUDfcApXTHgQz',
};

// Get the current environment
const environment = process.env.APP_ENV === 'production' ? 'production' : 'development';

interface CheckoutRequestBody {
  items: CartItem[];
}

export async function POST(request: Request) {
  try {

    console.log('Environment:', process.env.NEXT_PUBLIC_BASE_URL);

    const body = await request.json() as CheckoutRequestBody;
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map((item) => {
      // Use the appropriate product ID based on the environment
      const priceId = environment === 'production' 
        ? item.version.productId 
        : (item.version.devProductId || item.version.productId);
      
      return {
        price: priceId,
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session with customer information collection
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${getBaseUrl()}/checkout/success`,
      cancel_url: `${getBaseUrl()}/checkout/canceled`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [
          'AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR',
          'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG',
          'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT',
          'BV', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK',
          'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CY', 'CZ', 'DE', 'DJ',
          'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
          'FI', 'FJ', 'FK', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG',
          'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU',
          'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM',
          'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG',
          'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
          'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD',
          'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS',
          'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG',
          'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF',
          'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PY', 'QA',
          'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG',
          'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST',
          'SV', 'SX', 'SZ', 'TA', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK',
          'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG',
          'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VN', 'VU', 'WF', 'WS',
          'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW', 'ZZ'
        ],
      },
      shipping_options: [
        {
          shipping_rate: SHIPPING_RATES[environment],
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
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 
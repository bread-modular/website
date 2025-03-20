import { NextRequest, NextResponse } from 'next/server';

// Function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the email
    const { email } = await request.json();

    // Check if email is provided and valid
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Fetch the API key from environment variables
    const apiKey = process.env.MAILER_LITE_KEY;
    if (!apiKey) {
      console.error('Missing MailerLite API key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Prepare the request to MailerLite API
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email,
        // You can add additional fields as needed
        // fields: {
        //   name: subscriberName,
        //   country: subscriberCountry,
        // },
        groups: [] // Replace with your actual group ID if needed
      })
    });

    const data = await response.json();

    // Check for successful subscription
    if (!response.ok) {
      console.error('MailerLite API error:', data);
      
      // If the subscriber already exists
      if (response.status === 409) {
        return NextResponse.json(
          { message: 'You are already subscribed to our newsletter!' },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({ 
      message: 'Successfully subscribed to the newsletter!' 
    }, { status: 200 });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
} 
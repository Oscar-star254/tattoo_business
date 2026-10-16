# Ember & Ink Tattoo Studio (Vercel)
Static site + one serverless function (api/checkout.js) that creates a Stripe Checkout payment in USD.

## Deploy
1. Put your photos in /images (see images/README.txt).
2. Edit studio details (phone, email, address, prices) in index.html and app.js. Keep prices in api/checkout.js in sync.
3. `npm i -g vercel` then `vercel` in this folder (or import the repo at vercel.com).
4. In Vercel > Settings > Environment Variables add STRIPE_SECRET_KEY (use a test key first) and SITE_URL. Redeploy.
5. Test with Stripe card 4242 4242 4242 4242.

Paid bookings appear in your Stripe Dashboard (Payments > metadata shows service, date, time, client). Booked times are blocked automatically for other visitors.
Free consultations are emailed to you if RESEND_API_KEY / BOOKING_EMAIL / FROM_EMAIL are set.

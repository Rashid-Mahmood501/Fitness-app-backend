# RevenueCat Backend Implementation Guide

This document provides complete setup instructions for the RevenueCat subscription backend for your fitness app.

## Overview

The backend handles:
- RevenueCat webhook events (purchases, renewals, cancellations)
- User synchronization between your app and RevenueCat
- Subscription status verification
- Subscription history tracking
- Admin functions for granting promotional access

## Database Models

### 1. User Model
Updated to include `revenuecatAppUserId` field that links to RevenueCat's app_user_id.

**Location:** `src/models/user.model.js`

### 2. RevenueCat Subscription Model
Stores subscription data from RevenueCat webhooks.

**Location:** `src/models/revenuecatSubscription.model.js`

**Fields:**
- `user` - Reference to User model
- `revenuecatSubscriberId` - RevenueCat app_user_id
- `productId` - Product identifier (e.g., "yearly_premium")
- `entitlementId` - Entitlement identifier (e.g., "Pro")
- `platform` - Store platform (APP_STORE, PLAY_STORE, etc.)
- `status` - Subscription status (active, expired, cancelled, etc.)
- `purchasedAt` - Purchase timestamp
- `expiresAt` - Expiration timestamp
- `willRenew` - Boolean indicating if subscription will auto-renew
- `originalTransactionId` - Unique transaction identifier
- And more...

### 3. Webhook Event Model
Logs all webhook events for debugging and audit purposes.

**Location:** `src/models/webhookEvent.model.js`

## API Endpoints

### Webhook Endpoint

**POST** `/api/revenuecat/webhook`

Receives webhook events from RevenueCat. This endpoint does NOT require authentication as it's called by RevenueCat servers.

**Supported Events:**
- `INITIAL_PURCHASE` - First-time purchase
- `RENEWAL` - Subscription renewed
- `CANCELLATION` - User cancelled subscription
- `UNCANCELLATION` - User resubscribed
- `NON_RENEWING_PURCHASE` - One-time purchase
- `EXPIRATION` - Subscription expired
- `BILLING_ISSUE` - Payment failed
- `PRODUCT_CHANGE` - Subscription plan changed
- `TRANSFER` - Subscription transferred
- `SUBSCRIPTION_PAUSED` - Android subscription paused
- `SUBSCRIPTION_EXTENDED` - Subscription extended by developer

### User Management

**POST** `/api/revenuecat/users/sync`

Links backend user to RevenueCat subscriber.

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "user_id": "mongodb_user_id",
  "email": "user@example.com",
  "revenuecat_app_user_id": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "mongodb_user_id",
    "email": "user@example.com",
    "revenuecatAppUserId": "user123"
  }
}
```

### Subscription Verification

**GET** `/api/revenuecat/subscriptions/verify/:userId`

Quick check if user has active subscription.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "is_active": true,
  "product_id": "yearly_premium",
  "entitlement": "Pro",
  "expires_at": "2024-12-31T23:59:59Z",
  "will_renew": true,
  "platform": "APP_STORE",
  "is_trial": false
}
```

### Subscription Status

**GET** `/api/revenuecat/subscriptions/status/:userId`

Get detailed subscription information including history.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "user_id": "mongodb_user_id",
  "has_active_subscription": true,
  "active_subscription": {
    "subscription_id": "...",
    "product_id": "yearly_premium",
    "status": "active",
    "purchased_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-12-31T23:59:59Z",
    "will_renew": true,
    "platform": "APP_STORE"
  },
  "subscription_history": [...]
}
```

### Subscription History

**GET** `/api/revenuecat/subscriptions/history/:userId`

Get complete subscription history for a user.

**Authentication:** Required (JWT token)

### Grant Access (Admin)

**POST** `/api/revenuecat/subscriptions/grant-access`

Manually grant subscription access for support/testing purposes.

**Authentication:** Required (JWT token - should add admin check)

**Request Body:**
```json
{
  "userId": "mongodb_user_id",
  "productId": "yearly_premium",
  "durationDays": 365
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# RevenueCat Configuration
REVENUECAT_API_KEY=appl_mFqqtUfiRzNmJTeNWDViwOLDRBI
REVENUECAT_WEBHOOK_SECRET=your-webhook-authorization-header

# RevenueCat App Configuration
REVENUECAT_ENTITLEMENT_ID=Pro
REVENUECAT_OFFERING_ID=default
IOS_BUNDLE_ID=com.markcubin.fitnessapp.ios
ANDROID_PACKAGE_ID=com.markcubin.fitnessapp
```

## RevenueCat Dashboard Configuration

### 1. Setup Webhook

1. Go to RevenueCat Dashboard → Project Settings → Integrations → Webhooks
2. Click "Add Webhook"
3. Configure:
   - **URL:** `https://your-backend-domain.com/api/revenuecat/webhook`
   - **Events:** Select all relevant events:
     - Initial Purchase
     - Renewal
     - Cancellation
     - Uncancellation
     - Expiration
     - Billing Issue
     - Product Change
     - Transfer
     - Subscription Paused (Android)
     - Subscription Extended
   - **Authorization Header (Optional):** Set a secret value and add to `.env` as `REVENUECAT_WEBHOOK_SECRET`

4. Click "Save"

### 2. Test Webhook

Use RevenueCat's webhook testing tool to send a test event to your endpoint.

### 3. Products Configuration

Ensure your products are configured in RevenueCat:
- Product ID: `yearly_premium` (or your product identifier)
- Entitlement: `Pro`
- Offering: `default`

## Frontend Integration Flow

### 1. App Initialization
```javascript
// In _layout.tsx
await Purchases.configure({
  apiKey: 'appl_mFqqtUfiRzNmJTeNWDViwOLDRBI'
});

// Login user with RevenueCat
await Purchases.logIn(userId);
```

### 2. User Sync
After user logs in to your app, sync with backend:
```javascript
await fetch('https://your-api.com/api/revenuecat/users/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwt_token}`
  },
  body: JSON.stringify({
    user_id: mongodbUserId,
    email: userEmail,
    revenuecat_app_user_id: userId
  })
});
```

### 3. Purchase Flow
```javascript
// In PaymentMethodScreen.tsx
const offerings = await Purchases.getOfferings();
const purchase = await Purchases.purchasePackage(package);

// Backend automatically receives webhook from RevenueCat
// No need to call backend manually
```

### 4. Check Subscription Status
```javascript
// Option 1: Use RevenueCat SDK directly (fastest)
const customerInfo = await Purchases.getCustomerInfo();
const isPro = customerInfo.entitlements.active['Pro'] !== undefined;

// Option 2: Check with your backend (for server-side features)
const response = await fetch(`https://your-api.com/api/revenuecat/subscriptions/verify/${userId}`, {
  headers: {
    'Authorization': `Bearer ${jwt_token}`
  }
});
const { is_active } = await response.json();
```

### 5. Restore Purchases
```javascript
// In Profile/Subscription.tsx
await Purchases.restorePurchases();

// Backend receives webhook automatically
```

## Database Migrations

No explicit migrations are needed if using MongoDB. The models will create collections automatically.

For production, you may want to run:
```bash
# Ensure indexes are created
node scripts/ensure-indexes.js
```

## Testing

### Test Webhook Events

Use RevenueCat's test mode or create a test script:

```bash
curl -X POST https://your-api.com/api/revenuecat/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "type": "INITIAL_PURCHASE",
      "app_user_id": "test_user_123",
      "product_id": "yearly_premium",
      "entitlement_ids": ["Pro"],
      "period_type": "NORMAL",
      "purchased_at_ms": 1640000000000,
      "expiration_at_ms": 1671536000000,
      "store": "APP_STORE",
      "environment": "SANDBOX",
      "is_trial_period": false,
      "transaction_id": "1000000123456789",
      "original_transaction_id": "1000000123456789",
      "price_in_purchased_currency": 150.00,
      "currency": "USD"
    },
    "api_version": "1.0"
  }'
```

### Test Subscription Verification

```bash
# Verify subscription
curl https://your-api.com/api/revenuecat/subscriptions/verify/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### Environment Setup

1. Set all environment variables in your hosting platform
2. Ensure MongoDB connection string is set
3. Add webhook URL to RevenueCat dashboard

### HTTPS Requirement

RevenueCat webhooks require HTTPS. Ensure your backend is served over HTTPS in production.

### Webhook Retry Logic

RevenueCat will retry failed webhooks automatically. The backend logs all webhook events in the `WebhookEvent` collection for debugging.

## Monitoring

### Webhook Event Logs

Check webhook event logs in MongoDB:
```javascript
db.webhookevents.find({ processed: false }).sort({ createdAt: -1 })
```

### Subscription Status

Query active subscriptions:
```javascript
db.revenuecatsubscriptions.find({
  status: "active",
  expiresAt: { $gt: new Date() }
}).count()
```

## Email Notifications

The backend automatically sends emails for:
- Welcome email on initial purchase
- Renewal confirmation
- Cancellation notice
- Expiration notice
- Billing issue alerts

Ensure SendGrid is configured in `.env`.

## Security Considerations

1. **Webhook Signature Verification**: Implement signature verification using `REVENUECAT_WEBHOOK_SECRET`
2. **JWT Authentication**: All API endpoints (except webhook) require valid JWT token
3. **HTTPS Only**: All endpoints must use HTTPS in production
4. **Rate Limiting**: Consider adding rate limiting to API endpoints
5. **Input Validation**: All inputs are validated before processing

## Troubleshooting

### Webhook Not Receiving Events

1. Check RevenueCat dashboard webhook configuration
2. Verify webhook URL is publicly accessible (HTTPS)
3. Check webhook event logs in database
4. Test webhook manually using curl

### Subscription Status Not Updating

1. Check if webhook events are being received (check `WebhookEvent` collection)
2. Verify `revenuecatAppUserId` is correctly set on user
3. Check webhook event processing errors in database

### User Not Found in Webhook

Ensure user is synced with RevenueCat before purchase:
1. Call `/api/revenuecat/users/sync` after user login
2. Ensure `revenuecatAppUserId` matches the ID used in RevenueCat SDK

## Support

For issues:
1. Check webhook event logs in database
2. Check application logs
3. Verify RevenueCat dashboard configuration
4. Test webhook events manually

## Next Steps

1. Deploy backend to production
2. Configure RevenueCat webhook with production URL
3. Update frontend to call user sync endpoint
4. Test complete flow in sandbox mode
5. Test with real purchases
6. Monitor webhook events and subscription status

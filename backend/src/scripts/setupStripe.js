require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('Setting up Stripe products and prices...');
    
    // Create products for each subscription tier
    const products = {
      basic: await createProduct('Consensus.AI Basic', 'Perfect for individuals getting started', 10000),
      pro: await createProduct('Consensus.AI Pro', 'Ideal for professionals and small teams', 50000),
      enterprise: await createProduct('Consensus.AI Enterprise', 'For large organizations with high volume needs', 200000)
    };

    console.log('Products created:', products);

    // Create prices for each product
    const prices = {};
    
    for (const [tier, product] of Object.entries(products)) {
      console.log(`Creating prices for ${tier} tier...`);
      
      prices[tier] = {
        monthly: await createPrice(product.id, getMonthlyPrice(tier), 'month'),
        yearly: await createPrice(product.id, getYearlyPrice(tier), 'year')
      };
    }

    console.log('Prices created:', prices);

    // Create webhook endpoint
    const webhookEndpoint = await createWebhookEndpoint();
    console.log('Webhook endpoint created:', webhookEndpoint);

    // Display configuration for environment variables
    displayConfiguration(prices, webhookEndpoint);

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

async function createProduct(name, description, tokenLimit) {
  const product = await stripe.products.create({
    name,
    description: `${description} - ${tokenLimit.toLocaleString()} tokens per month`,
    type: 'service'
  });
  
  console.log(`Created product: ${product.name} (${product.id})`);
  return product;
}

async function createPrice(productId, unitAmount, interval) {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: 'usd',
    recurring: {
      interval
    }
  });
  
  console.log(`Created ${interval}ly price: $${unitAmount / 100} (${price.id})`);
  return price;
}

async function createWebhookEndpoint() {
  const webhookEndpoint = await stripe.webhookEndpoints.create({
    url: `${process.env.WEBHOOK_URL || 'https://your-domain.com'}/api/webhooks/stripe`,
    enabled_events: [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'customer.subscription.trial_will_end',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'invoice.upcoming'
    ]
  });
  
  return webhookEndpoint;
}

function getMonthlyPrice(tier) {
  const prices = {
    basic: 1999,      // $19.99
    pro: 4999,        // $49.99
    enterprise: 14999 // $149.99
  };
  return prices[tier];
}

function getYearlyPrice(tier) {
  const prices = {
    basic: 19999,     // $199.99 (2 months free)
    pro: 49999,       // $499.99 (2 months free)
    enterprise: 149999 // $1499.99 (2 months free)
  };
  return prices[tier];
}

function displayConfiguration(prices, webhookEndpoint) {
  console.log('\n=== STRIPE CONFIGURATION ===');
  console.log('Add these environment variables to your .env file:\n');
  
  console.log('# Stripe Price IDs');
  Object.entries(prices).forEach(([tier, tierPrices]) => {
    console.log(`STRIPE_${tier.toUpperCase()}_MONTHLY=${tierPrices.monthly.id}`);
    console.log(`STRIPE_${tier.toUpperCase()}_YEARLY=${tierPrices.yearly.id}`);
  });
  
  console.log(`\n# Webhook Configuration`);
  console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);
  console.log(`STRIPE_WEBHOOK_URL=${webhookEndpoint.url}`);
  
  console.log('\n=== UPDATE CONFIG FILE ===');
  console.log('Update your backend/src/config/stripe.js file with these price IDs:\n');
  
  console.log('subscriptionTiers: {');
  Object.entries(prices).forEach(([tier, tierPrices]) => {
    console.log(`  ${tier}: {`);
    console.log(`    monthlyPriceId: '${tierPrices.monthly.id}',`);
    console.log(`    yearlyPriceId: '${tierPrices.yearly.id}',`);
    console.log(`    tokenLimit: ${tier === 'basic' ? 10000 : tier === 'pro' ? 50000 : 200000}`);
    console.log(`  },`);
  });
  console.log('}');
  
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Update your environment variables');
  console.log('2. Update the stripe.js config file');
  console.log('3. Test the webhook endpoint');
  console.log('4. Configure your domain for the webhook URL');
  console.log('\nSetup completed successfully! 🎉');
}

// Run the setup if this script is called directly
if (require.main === module) {
  setupStripeProducts();
}

module.exports = { setupStripeProducts }; 
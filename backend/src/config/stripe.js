const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeConfig = {
  stripe,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Product and price configurations
  subscriptionTiers: {
    basic: {
      monthlyPriceId: 'price_basic_monthly',
      yearlyPriceId: 'price_basic_yearly',
      tokenLimit: 10000
    },
    pro: {
      monthlyPriceId: 'price_pro_monthly',
      yearlyPriceId: 'price_pro_yearly',
      tokenLimit: 50000
    },
    enterprise: {
      monthlyPriceId: 'price_enterprise_monthly',
      yearlyPriceId: 'price_enterprise_yearly',
      tokenLimit: 200000
    }
  },
  
  // Overage pricing
  overageTokenPrice: 0.001 // $0.001 per token
};

module.exports = stripeConfig; 
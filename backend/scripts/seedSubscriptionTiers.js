// backend/scripts/seedSubscriptionTiers.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import your models
const SubscriptionTier = require('../models/subscriptionTiers');

// Subscription tiers data
const subscriptionTiers = [
  {
    name: 'Free',
    displayName: 'Free Plan',
    description: 'Perfect for trying out Consensus.AI',
    tokenLimit: 25000,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '25,000 tokens per month',
      'Basic consensus analysis',
      'PDF report generation',
      'Community support'
    ],
    stripePriceIds: {
      monthly: null,
      yearly: null
    },
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Lite',
    displayName: 'Lite Plan',
    description: 'Ideal for individuals and light usage',
    tokenLimit: 50000,
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    features: [
      '50,000 tokens per month',
      'Advanced consensus analysis',
      'Priority processing',
      'PDF and HTML reports',
      'Email support'
    ],
    stripePriceIds: {
      monthly: 'price_lite_monthly', // Replace with actual Stripe price IDs
      yearly: 'price_lite_yearly'
    },
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Pro',
    displayName: 'Pro Plan',
    description: 'Perfect for professionals and small teams',
    tokenLimit: 150000,
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: [
      '150,000 tokens per month',
      'Premium consensus analysis',
      'Fastest processing',
      'All report formats',
      'Priority support',
      'Advanced analytics'
    ],
    stripePriceIds: {
      monthly: 'price_pro_monthly', // Replace with actual Stripe price IDs
      yearly: 'price_pro_yearly'
    },
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Expert',
    displayName: 'Expert Plan',
    description: 'For power users and large organizations',
    tokenLimit: 400000,
    monthlyPrice: 59.99,
    yearlyPrice: 599.99,
    features: [
      '400,000 tokens per month',
      'Premium consensus analysis',
      'Instant processing',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantee'
    ],
    stripePriceIds: {
      monthly: 'price_expert_monthly', // Replace with actual Stripe price IDs
      yearly: 'price_expert_yearly'
    },
    isActive: true,
    sortOrder: 4
  }
];

async function seedSubscriptionTiers() {
  try {
    console.log('🌱 Starting subscription tiers seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing subscription tiers (optional - remove if you want to keep existing data)
    console.log('🗑️  Clearing existing subscription tiers...');
    await SubscriptionTier.deleteMany({});

    // Insert new subscription tiers
    console.log('📦 Inserting subscription tiers...');
    const insertedTiers = await SubscriptionTier.insertMany(subscriptionTiers);
    
    console.log('✅ Successfully seeded subscription tiers:');
    insertedTiers.forEach(tier => {
      console.log(`   - ${tier.name}: ${tier.tokenLimit.toLocaleString()} tokens, $${tier.monthlyPrice}/month`);
    });

    // Verify the data
    const tierCount = await SubscriptionTier.countDocuments();
    console.log(`✅ Total subscription tiers in database: ${tierCount}`);

    // Test finding the Free tier (this is what registration uses)
    const freeTier = await SubscriptionTier.findOne({ name: 'Free' });
    if (freeTier) {
      console.log('✅ Free tier found successfully - registration will work!');
      console.log(`   Free tier ID: ${freeTier._id}`);
    } else {
      console.log('❌ Free tier not found - check the seeding process');
    }

  } catch (error) {
    console.error('❌ Error seeding subscription tiers:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedSubscriptionTiers();
}

module.exports = { seedSubscriptionTiers, subscriptionTiers };

// backend/scripts/seedSubscriptionTiers.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import your models
const SubscriptionTier = require('../models/subscriptionTiers');

// Subscription tiers data - Report-based pricing
const subscriptionTiers = [
  {
    name: 'PayAsYouGo',
    displayName: 'Pay-As-You-Go',
    description: 'Perfect for occasional users - pay only for what you need',
    reportsIncluded: 0, // No monthly reports included
    pricePerReport: 15.00,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '$15 per report',
      'No monthly commitment',
      'Full consensus analysis',
      'PDF report generation',
      'Email support',
      'All premium features per report'
    ],
    stripePriceIds: {
      monthly: null,
      yearly: null,
      perReport: 'price_payg_report' // Single report purchase
    },
    isActive: true,
    sortOrder: 1,
    billingType: 'per_report'
  },
  {
    name: 'Starter',
    displayName: 'Starter Plan',
    description: 'Ideal for regular users who need consistent reporting',
    reportsIncluded: 3,
    pricePerReport: 9.67, // Effective price per report
    overageRate: 12.00, // Price for additional reports
    monthlyPrice: 29.00,
    yearlyPrice: 290.00, // 2 months free
    features: [
      '3 reports per month',
      '35% savings vs pay-as-you-go',
      'Additional reports: $12 each',
      'Premium consensus analysis',
      'PDF and HTML reports',
      'Email support'
    ],
    stripePriceIds: {
      monthly: 'price_starter_monthly',
      yearly: 'price_starter_yearly'
    },
    isActive: true,
    sortOrder: 2,
    billingType: 'subscription'
  },
  {
    name: 'Professional',
    displayName: 'Professional Plan',
    description: 'Perfect for professionals and consultants',
    reportsIncluded: 10,
    pricePerReport: 7.90, // Effective price per report
    overageRate: 10.00, // Price for additional reports
    monthlyPrice: 79.00,
    yearlyPrice: 790.00, // 2 months free
    features: [
      '10 reports per month',
      '47% savings vs pay-as-you-go',
      'Additional reports: $10 each',
      'Priority processing',
      'Advanced analytics',
      'All report formats',
      'Priority email support'
    ],
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    },
    isActive: true,
    sortOrder: 3,
    billingType: 'subscription'
  },
  {
    name: 'Business',
    displayName: 'Business Plan',
    description: 'For teams and organizations with high-volume needs',
    reportsIncluded: 30,
    pricePerReport: 6.63, // Effective price per report
    overageRate: 8.00, // Price for additional reports
    monthlyPrice: 199.00,
    yearlyPrice: 1990.00, // 2 months free
    features: [
      '30 reports per month',
      '56% savings vs pay-as-you-go',
      'Additional reports: $8 each',
      'Fastest processing',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantee'
    ],
    stripePriceIds: {
      monthly: 'price_business_monthly',
      yearly: 'price_business_yearly'
    },
    isActive: true,
    sortOrder: 4,
    billingType: 'subscription'
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
      if (tier.billingType === 'per_report') {
        console.log(`   - ${tier.name}: $${tier.pricePerReport}/report (pay-as-you-go)`);
      } else {
        console.log(`   - ${tier.name}: ${tier.reportsIncluded} reports, $${tier.monthlyPrice}/month`);
      }
    });

    // Verify the data
    const tierCount = await SubscriptionTier.countDocuments();
    console.log(`✅ Total subscription tiers in database: ${tierCount}`);

    // Test finding the PayAsYouGo tier (this is what new users will start with)
    const payAsYouGoTier = await SubscriptionTier.findOne({ name: 'PayAsYouGo' });
    if (payAsYouGoTier) {
      console.log('✅ Pay-As-You-Go tier found successfully - registration will work!');
      console.log(`   Pay-As-You-Go tier ID: ${payAsYouGoTier._id}`);
    } else {
      console.log('❌ Pay-As-You-Go tier not found - check the seeding process');
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

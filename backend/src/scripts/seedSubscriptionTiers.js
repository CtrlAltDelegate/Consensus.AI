require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionTier = require('../models/subscriptionTiers');

async function seedSubscriptionTiers() {
  try {
    console.log('🌱 Seeding subscription tiers...');
    
    // Check for MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set.');
      console.log('💡 Please set your MongoDB connection string:');
      console.log('   For Railway: Use Railway dashboard to set MONGODB_URI');
      console.log('   For local: Create a .env file with MONGODB_URI=your_connection_string');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing tiers
    await SubscriptionTier.deleteMany({});
    console.log('🗑️ Cleared existing subscription tiers');

    // Get default tiers
    const defaultTiers = SubscriptionTier.getDefaultTiers();
    
    // Create tiers
    const createdTiers = await SubscriptionTier.insertMany(defaultTiers);
    console.log(`✅ Created ${createdTiers.length} subscription tiers:`);
    
    createdTiers.forEach(tier => {
      console.log(`  - ${tier.displayName} (${tier.name}): ${
        tier.billingType === 'per_report' 
          ? `$${tier.pricePerReport}/report`
          : `$${tier.monthlyPrice}/month (${tier.reportsIncluded} reports included)`
      }`);
    });

    console.log('\n🎉 Subscription tiers seeded successfully!');
    
    // Display the created tiers for verification
    console.log('\n📋 Subscription Tiers Summary:');
    console.log('================================');
    
    for (const tier of createdTiers) {
      console.log(`\n${tier.displayName}:`);
      console.log(`  ID: ${tier._id}`);
      console.log(`  Name: ${tier.name}`);
      console.log(`  Type: ${tier.billingType}`);
      if (tier.billingType === 'per_report') {
        console.log(`  Price: $${tier.pricePerReport} per report`);
      } else {
        console.log(`  Monthly Price: $${tier.monthlyPrice}`);
        console.log(`  Reports Included: ${tier.reportsIncluded}`);
        console.log(`  Overage Rate: $${tier.overageRate} per additional report`);
      }
      console.log(`  Features: ${tier.features.length} features`);
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding subscription tiers:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedSubscriptionTiers();
}

module.exports = seedSubscriptionTiers;

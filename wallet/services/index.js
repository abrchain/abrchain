// ~/abr-project/wallet/services/index.js
const cardIntegration = require('./card/CardIntegration');
const exchangeService = require('./exchange/ExchangeService');
const kycService = require('./kyc/KYCService');
const notificationService = require('./notification/NotificationService');
const transactionService = require('./transaction/TransactionService');

// Export all services
module.exports = {
    cardIntegration,
    exchangeService,
    kycService,
    notificationService,
    transactionService
};

// Initialize all services
async function initializeServices() {
    console.log('🚀 Initializing ABR Wallet Services...');
    
    try {
        // Test card service connection
        await cardIntegration.listUserCards('test-user');
        console.log('✅ Card service connected');
        
        // Initialize other services
        await exchangeService.initialize();
        await kycService.initialize();
        await notificationService.initialize();
        await transactionService.initialize();
        
        console.log('✅ All services initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Service initialization failed:', error);
        return false;
    }
}

// Health check for all services
async function healthCheck() {
    const services = {
        card: false,
        exchange: false,
        kyc: false,
        notification: false,
        transaction: false
    };
    
    try {
        // Check card service
        await cardIntegration.checkCardStatus('test');
        services.card = true;
    } catch (e) {
        services.card = false;
    }
    
    // Add checks for other services
    
    return services;
}

module.exports.initializeServices = initializeServices;
module.exports.healthCheck = healthCheck;

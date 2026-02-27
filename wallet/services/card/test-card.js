// ~/abr-project/wallet/services/card/test-card.js
const cardIntegration = require('./CardIntegration');

async function testCardIntegration() {
    console.log('🧪 Testing ABR Card Integration');
    console.log('================================');
    
    const testUserId = 12345;
    
    try {
        // Test 1: List available card types
        console.log('\n📋 Test 1: Getting available card types...');
        const types = await cardIntegration.getCardTypes(testUserId);
        console.log('✅ Card types:', types);
        
        // Test 2: Create a virtual card
        console.log('\n💳 Test 2: Creating virtual card...');
        const newCard = await cardIntegration.createCard(testUserId, {
            cardType: 'virtual',
            country: 'NG',
            currency: 'USD',
            cardholderName: 'Test User'
        });
        console.log('✅ Card created:', newCard);
        
        if (newCard.success && newCard.cardid) {
            const cardId = newCard.cardid;
            
            // Test 3: Get card details
            console.log('\n🔍 Test 3: Getting card details...');
            const details = await cardIntegration.getCardDetails(testUserId, cardId);
            console.log('✅ Card details:', details);
            
            // Test 4: Top up card
            console.log('\n💰 Test 4: Topping up card...');
            const topup = await cardIntegration.topUpFromWallet('wallet-1', cardId, 100, testUserId);
            console.log('✅ Top up result:', topup);
            
            // Test 5: List user cards
            console.log('\n📚 Test 5: Listing user cards...');
            const cards = await cardIntegration.listUserCards(testUserId);
            console.log('✅ User cards:', cards);
            
            // Test 6: Get card transactions
            console.log('\n📊 Test 6: Getting card transactions...');
            const transactions = await cardIntegration.getCardTransactions(cardId, 10);
            console.log('✅ Transactions:', transactions);
            
            // Test 7: Block card
            console.log('\n🔒 Test 7: Blocking card...');
            const blocked = await cardIntegration.blockCard(testUserId, cardId);
            console.log('✅ Card blocked:', blocked);
        }
        
        console.log('\n✨ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests
testCardIntegration();

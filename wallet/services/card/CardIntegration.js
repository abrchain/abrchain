// ~/abr-project/wallet/services/card/CardIntegration.js
const axios = require('axios');

class CardIntegrationService {
    constructor() {
        this.cardServiceUrl = process.env.CARD_SERVICE_URL || 'http://localhost:3008';
        this.apiKey = process.env.CARD_SERVICE_API_KEY || 'abr-card-service-key-2026';
        this.timeout = 10000; // 10 seconds timeout
    }

    // Create headers with API key
    _getHeaders() {
        return {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    // Handle API errors
    _handleError(error, operation) {
        console.error(`Card service ${operation} failed:`, error.message);
        if (error.response) {
            throw new Error(`Card service error: ${error.response.data.error || error.response.statusText}`);
        } else if (error.request) {
            throw new Error('Card service unavailable');
        } else {
            throw error;
        }
    }

    // Link card to wallet
    async linkCard(userId, walletId, cardId) {
        try {
            console.log(`Linking card ${cardId} to wallet ${walletId} for user ${userId}`);
            
            const response = await axios.post(
                `${this.cardServiceUrl}/api/cards/${userId}/${cardId}/link`,
                { 
                    walletId,
                    linkedAt: new Date().toISOString()
                },
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                ...response.data,
                message: 'Card linked successfully'
            };
        } catch (error) {
            this._handleError(error, 'link card');
        }
    }

    // Top up card from wallet
    async topUpFromWallet(walletId, cardId, amount, userId) {
        try {
            console.log(`Topping up card ${cardId} with ${amount} ABR from wallet ${walletId}`);
            
            // First check wallet balance (would call wallet service)
            const hasBalance = await this._checkWalletBalance(walletId, amount);
            if (!hasBalance) {
                throw new Error('Insufficient wallet balance');
            }

            // Call card service to top up
            const response = await axios.post(
                `${this.cardServiceUrl}/api/cards/${cardId}/topup`,
                { 
                    amount, 
                    source: 'wallet',
                    sourceId: walletId,
                    userId
                },
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            // Record the transaction
            await this._recordCardTopUp(walletId, cardId, amount, response.data);
            
            return {
                success: true,
                transactionId: response.data.transactionId,
                newBalance: response.data.newBalance,
                amount,
                message: 'Card topped up successfully'
            };
        } catch (error) {
            this._handleError(error, 'top up card');
        }
    }

    // Get card details
    async getCardDetails(userId, cardId) {
        try {
            const response = await axios.get(
                `${this.cardServiceUrl}/api/cards/${userId}/${cardId}`,
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            this._handleError(error, 'get card details');
        }
    }

    // List user cards
    async listUserCards(userId) {
        try {
            const response = await axios.get(
                `${this.cardServiceUrl}/api/cards/${userId}`,
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                cards: response.data
            };
        } catch (error) {
            this._handleError(error, 'list cards');
        }
    }

    // Create new card
    async createCard(userId, cardData) {
        try {
            const { cardType, country, currency, cardholderName } = cardData;
            
            const response = await axios.post(
                `${this.cardServiceUrl}/api/cards`,
                {
                    userId,
                    cardType,
                    country,
                    currency,
                    cardholderName
                },
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                ...response.data,
                message: response.data.virtual ? 
                    'Virtual card created. Save your details!' : 
                    'Physical card ordered. Delivery in 5-7 business days.'
            };
        } catch (error) {
            this._handleError(error, 'create card');
        }
    }

    // Block card
    async blockCard(userId, cardId) {
        try {
            const response = await axios.post(
                `${this.cardServiceUrl}/api/cards/${userId}/${cardId}/block`,
                {},
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                ...response.data,
                message: 'Card blocked successfully'
            };
        } catch (error) {
            this._handleError(error, 'block card');
        }
    }

    // Get card transactions
    async getCardTransactions(cardId, limit = 50) {
        try {
            const response = await axios.get(
                `${this.cardServiceUrl}/api/cards/${cardId}/transactions?limit=${limit}`,
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                transactions: response.data
            };
        } catch (error) {
            this._handleError(error, 'get card transactions');
        }
    }

    // Check card status
    async checkCardStatus(cardId) {
        try {
            const response = await axios.get(
                `${this.cardServiceUrl}/api/cards/status/${cardId}`,
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            this._handleError(error, 'check card status');
        }
    }

    // Get available card types and limits
    async getCardTypes(userId) {
        try {
            const response = await axios.get(
                `${this.cardServiceUrl}/api/cards/types/${userId}`,
                { 
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            
            return {
                success: true,
                types: response.data
            };
        } catch (error) {
            this._handleError(error, 'get card types');
        }
    }

    // Private helper methods
    async _checkWalletBalance(walletId, amount) {
        // This would call the wallet service
        // For now, return true (in production, implement actual check)
        return true;
    }

    async _recordCardTopUp(walletId, cardId, amount, response) {
        // This would record the transaction in database
        console.log(`Recording top-up: Wallet ${walletId} -> Card ${cardId}: ${amount} ABR`);
        // In production, insert into database
    }

    // Process card payment (webhook from card service)
    async processCardPaymentWebhook(paymentData) {
        try {
            const { cardId, amount, merchant, transactionId, status } = paymentData;
            
            console.log(`Processing card payment webhook: Card ${cardId}, Amount ${amount}, Status ${status}`);
            
            // Update wallet balance if needed
            if (status === 'completed') {
                // Deduct from linked wallet if card is prepaid
                await this._updateWalletFromCardPayment(cardId, amount);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Webhook processing failed:', error);
            throw error;
        }
    }

    async _updateWalletFromCardPayment(cardId, amount) {
        // Update wallet balance based on card payment
        console.log(`Updating wallet for card ${cardId} payment of ${amount}`);
        // In production, implement actual wallet update
    }
}

module.exports = new CardIntegrationService();

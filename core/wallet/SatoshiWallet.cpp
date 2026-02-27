// satoshi-core/wallet/SatoshiWallet.cpp
#include "SatoshiWallet.hpp"
#include "../math/SatoshiMath.hpp"
#include <random>
#include <chrono>

SatoshiWallet::SatoshiWallet() 
    : m_balance(1'000'000'000) // 10 ABR initial balance for demo
    , m_creationTime(std::time(nullptr)) {
    
    // Generate a default address
    m_address = generateNewAddress();
    m_addresses.push_back(m_address);
}

SatoshiWallet::~SatoshiWallet() {
    // Cleanup
}

double SatoshiWallet::getBalanceAbr() const {
    return SatoshiMath::satoshisToAbr(m_balance);
}

void SatoshiWallet::addBalance(int64_t amount) {
    m_balance = SatoshiMath::safeAdd(m_balance, amount);
}

void SatoshiWallet::subtractBalance(int64_t amount) {
    m_balance = SatoshiMath::safeSubtract(m_balance, amount);
}

std::string SatoshiWallet::generateNewAddress() {
    // Generate a mock Bitcoin address (for demo only)
    static const char* chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 57);
    
    std::string address = "1";
    for (int i = 0; i < 33; i++) {
        address += chars[dis(gen)];
    }
    return address;
}

bool SatoshiWallet::isMyAddress(const std::string& address) const {
    for (const auto& addr : m_addresses) {
        if (addr == address) return true;
    }
    return false;
}

void SatoshiWallet::addTransaction(const std::string& txid) {
    m_transactions.push_back(txid);
}

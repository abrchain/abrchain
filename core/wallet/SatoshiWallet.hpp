#ifndef SATOSHI_WALLET_HPP
#define SATOSHI_WALLET_HPP

#include <cstdint>
#include <string>
#include <vector>
#include <map>
#include <ctime>

class SatoshiWallet {
private:
    int64_t m_balance;
    std::string m_address;
    std::vector<std::string> m_addresses;
    std::vector<std::string> m_transactions;
    time_t m_creationTime;
    
public:
    SatoshiWallet();
    ~SatoshiWallet();
    
    // Balance management
    int64_t getBalance() const { return m_balance; }
    double getBalanceAbr() const;
    void setBalance(int64_t balance) { m_balance = balance; }
    void addBalance(int64_t amount);
    void subtractBalance(int64_t amount);
    
    // Address management
    std::string getAddress() const { return m_address; }
    std::vector<std::string> getAllAddresses() const { return m_addresses; }
    std::string generateNewAddress();
    bool isMyAddress(const std::string& address) const;
    
    // Transaction management
    void addTransaction(const std::string& txid);
    std::vector<std::string> getTransactions() const { return m_transactions; }
    
    // Wallet info
    time_t getCreationTime() const { return m_creationTime; }
};

#endif

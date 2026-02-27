// satoshi-core/cli/satoshi-cli.cpp
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <iomanip>
#include <sstream>
#include "../math/SatoshiMath.hpp"
#include "../wallet/SatoshiWallet.hpp"

class SatoshiCLI {
private:
    SatoshiWallet wallet;
    
    void printHeader(const std::string& title) {
        std::cout << "\n💰 " << title << std::endl;
        std::cout << std::string(title.length() + 4, '=') << std::endl;
    }
    
    void printHelp() {
        std::cout << "\n💰 SATOSHI CLI - Micro-transactions in satoshis" << std::endl;
        std::cout << "==============================================" << std::endl;
        std::cout << "1 satoshi = 0.00000001 ABR" << std::endl;
        std::cout << std::endl;
        std::cout << "Commands:" << std::endl;
        std::cout << "  balance                    - Show wallet balance" << std::endl;
        std::cout << "  convert <amount> [unit]    - Convert between sat/abr" << std::endl;
        std::cout << "  help                        - Show this help" << std::endl;
    }
    
    void handleBalance() {
        printHeader("WALLET BALANCE");
        
        int64_t balance = wallet.getBalance();
        std::cout << "Satoshis: " << SatoshiMath::formatSatoshis(balance) << std::endl;
        std::cout << "ABR:      " << SatoshiMath::formatAbr(balance) << std::endl;
    }
    
    void handleConvert(int argc, char* argv[]) {
        if (argc < 3) {
            std::cout << "Usage: satoshi-cli convert <amount> [unit]" << std::endl;
            std::cout << "Units: sat, abr (default: abr)" << std::endl;
            return;
        }
        
        double amount = std::stod(argv[2]);
        std::string unit = (argc > 3) ? argv[3] : "abr";
        
        printHeader("CURRENCY CONVERSION");
        
        if (unit == "abr" || unit == "ABR") {
            int64_t sat = SatoshiMath::abrToSatoshis(amount);
            std::cout << amount << " ABR = " << sat << " satoshis" << std::endl;
            std::cout << "       = " << SatoshiMath::formatSatoshis(sat) << std::endl;
        } else if (unit == "sat" || unit == "sats") {
            double abr = SatoshiMath::satoshisToAbr(static_cast<int64_t>(amount));
            std::cout << amount << " satoshis = " << std::fixed << std::setprecision(8) 
                      << abr << " ABR" << std::endl;
        }
    }

public:
    void run(int argc, char* argv[]) {
        if (argc < 2) {
            printHelp();
            return;
        }
        
        std::string cmd = argv[1];
        
        if (cmd == "balance") {
            handleBalance();
        }
        else if (cmd == "convert") {
            handleConvert(argc, argv);
        }
        else if (cmd == "help" || cmd == "--help") {
            printHelp();
        }
        else {
            std::cout << "Unknown command: " << cmd << std::endl;
            printHelp();
        }
    }
};

int main(int argc, char* argv[]) {
    SatoshiCLI cli;
    cli.run(argc, argv);
    return 0;
}

#ifndef SATOSHI_MATH_HPP
#define SATOSHI_MATH_HPP

#include <cstdint>
#include <string>
#include <map>
#include <vector>
#include <stdexcept>

class SatoshiMath {
private:
    static constexpr int64_t SATOSHI_PER_ABR = 100'000'000;
    static constexpr int64_t MAX_SATOSHI = 1'000'000'000 * SATOSHI_PER_ABR;
    static constexpr int64_t MIN_SATOSHI = 1;
    static constexpr int64_t BASIS_POINTS_DIVISOR = 10'000;
    static constexpr int64_t MAX_BASIS_POINTS = 50'000;
    static constexpr int64_t USD_PER_BTC = 100'000;

    static const std::map<std::string, int64_t> AFRICAN_CURRENCY_RATES;

public:
    // Core conversion functions
    static int64_t abrToSatoshis(double abr);
    static int64_t abrStringToSatoshis(const std::string& abrStr);
    static double satoshisToAbr(int64_t satoshis);
    static std::string satoshisToAbrString(int64_t satoshis, int decimals = 8);
    
    // Safe arithmetic
    static int64_t safeMultiply(int64_t a, int64_t b);
    static int64_t safeAdd(int64_t a, int64_t b);
    static int64_t safeSubtract(int64_t a, int64_t b);
    static int64_t safeDivide(int64_t a, int64_t b);
    
    // Fee calculations
    static int64_t calculatePercentage(int64_t amount, int64_t percentage);
    static int64_t calculateBasisPoints(int64_t amount, int64_t basisPoints);
    static int64_t calculateVolumeDiscount(int64_t volume);
    
    // Fiat conversion
    static int64_t satoshisToUsd(int64_t satoshis);
    static double satoshisToLocalCurrency(int64_t satoshis, const std::string& currency);
    static int64_t localCurrencyToSatoshis(double amount, const std::string& currency);
    
    // Formatting
    static std::string formatSatoshis(int64_t satoshis);
    static std::string formatAbr(int64_t satoshis, bool includeSymbol = true);
    static std::string formatWithUnit(int64_t satoshis);
    static std::string formatHumanReadable(int64_t satoshis);
    
    // Validation
    static bool isValidSatoshi(int64_t satoshis);
    static bool isValidFeeRate(int64_t basisPoints);
    
    // Getters
    static int64_t getSatoshiPerAbr() { return SATOSHI_PER_ABR; }
    static int64_t getMaxSatoshi() { return MAX_SATOSHI; }
    static int64_t getMinTxFee() { return 1000; }
    static int64_t getMinChange() { return 1000; }
};

#endif

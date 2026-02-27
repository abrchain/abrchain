// satoshi-core/math/SatoshiMath.cpp
#include "SatoshiMath.hpp"
#include <cmath>
#include <algorithm>
#include <iomanip>
#include <sstream>

const std::map<std::string, int64_t> SatoshiMath::AFRICAN_CURRENCY_RATES = {
    {"USD", 100'000},
    {"NGN", 150'000},
    {"KES", 130'000},
    {"ZAR", 18'000},
    {"GHS", 12'000},
    {"UGX", 380},
    {"TZS", 430}
};

int64_t SatoshiMath::abrToSatoshis(double abr) {
    if (abr < 0) {
        throw std::invalid_argument("ABR amount cannot be negative");
    }
    return static_cast<int64_t>(abr * SATOSHI_PER_ABR + 0.5);
}

double SatoshiMath::satoshisToAbr(int64_t satoshis) {
    if (satoshis < 0) {
        throw std::invalid_argument("Satoshis cannot be negative");
    }
    return static_cast<double>(satoshis) / SATOSHI_PER_ABR;
}

int64_t SatoshiMath::safeMultiply(int64_t a, int64_t b) {
    if (a == 0 || b == 0) return 0;
    if (a > MAX_SATOSHI / b) {
        throw std::overflow_error("Multiplication would overflow");
    }
    return a * b;
}

int64_t SatoshiMath::safeAdd(int64_t a, int64_t b) {
    if (a > MAX_SATOSHI - b) {
        throw std::overflow_error("Addition would overflow");
    }
    return a + b;
}

int64_t SatoshiMath::safeSubtract(int64_t a, int64_t b) {
    if (a < b) {
        throw std::underflow_error("Subtraction would underflow");
    }
    return a - b;
}

int64_t SatoshiMath::safeDivide(int64_t a, int64_t b) {
    if (b == 0) {
        throw std::invalid_argument("Division by zero");
    }
    return a / b;
}

int64_t SatoshiMath::calculatePercentage(int64_t amount, int64_t percentage) {
    return safeMultiply(amount, percentage) / 100;
}

int64_t SatoshiMath::calculateBasisPoints(int64_t amount, int64_t basisPoints) {
    return safeMultiply(amount, basisPoints) / BASIS_POINTS_DIVISOR;
}

int64_t SatoshiMath::calculateVolumeDiscount(int64_t volume) {
    if (volume < 1'000'000) return 0;
    if (volume < 10'000'000) return 50;
    if (volume < 100'000'000) return 100;
    if (volume < 1'000'000'000) return 200;
    return 500;
}

int64_t SatoshiMath::satoshisToUsd(int64_t satoshis) {
    return satoshis / USD_PER_BTC;
}

double SatoshiMath::satoshisToLocalCurrency(int64_t satoshis, const std::string& currency) {
    auto it = AFRICAN_CURRENCY_RATES.find(currency);
    if (it == AFRICAN_CURRENCY_RATES.end()) {
        throw std::invalid_argument("Unsupported currency: " + currency);
    }
    return static_cast<double>(satoshis) / it->second;
}

int64_t SatoshiMath::localCurrencyToSatoshis(double amount, const std::string& currency) {
    auto it = AFRICAN_CURRENCY_RATES.find(currency);
    if (it == AFRICAN_CURRENCY_RATES.end()) {
        throw std::invalid_argument("Unsupported currency: " + currency);
    }
    return static_cast<int64_t>(amount * it->second + 0.5);
}

std::string SatoshiMath::formatSatoshis(int64_t satoshis) {
    if (satoshis < 0) {
        return "-" + formatSatoshis(-satoshis);
    }
    
    std::string num = std::to_string(satoshis);
    int insertPosition = num.length() - 3;
    while (insertPosition > 0) {
        num.insert(insertPosition, ",");
        insertPosition -= 3;
    }
    return num + " sats";
}

std::string SatoshiMath::formatAbr(int64_t satoshis, bool includeSymbol) {
    if (satoshis < 0) {
        return "-" + formatAbr(-satoshis, includeSymbol);
    }
    
    int64_t whole = satoshis / SATOSHI_PER_ABR;
    int64_t fraction = satoshis % SATOSHI_PER_ABR;
    
    std::string result = std::to_string(whole) + ".";
    std::string fracStr = std::to_string(fraction);
    while (fracStr.length() < 8) {
        fracStr = "0" + fracStr;
    }
    // Trim trailing zeros
    while (fracStr.length() > 1 && fracStr.back() == '0') {
        fracStr.pop_back();
    }
    
    result += fracStr;
    if (includeSymbol) {
        result += " ABR";
    }
    return result;
}

std::string SatoshiMath::formatWithUnit(int64_t satoshis) {
    return formatSatoshis(satoshis);
}

std::string SatoshiMath::formatHumanReadable(int64_t satoshis) {
    if (satoshis >= SATOSHI_PER_ABR) {
        return formatAbr(satoshis);
    } else {
        return formatSatoshis(satoshis);
    }
}

bool SatoshiMath::isValidSatoshi(int64_t satoshis) {
    return satoshis >= MIN_SATOSHI && satoshis <= MAX_SATOSHI;
}

bool SatoshiMath::isValidFeeRate(int64_t basisPoints) {
    return basisPoints >= 0 && basisPoints <= MAX_BASIS_POINTS;
}

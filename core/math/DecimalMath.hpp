// satoshi-core/math/DecimalMath.hpp
#ifndef DECIMAL_MATH_HPP
#define DECIMAL_MATH_HPP

#include <cstdint>
#include <cmath>
#include <vector>
#include <string>
#include <stdexcept>
#include <algorithm>
#include <functional>
#include <map>
#include <iostream>
#include <iomanip>
#include <sstream>

class DecimalMath {
private:
    // Core precision constants
    static constexpr int64_t BASE_PRECISION = 1'000'000'000;      // 9 decimals for intermediate calculations
    static constexpr int64_t HIGH_PRECISION = 1'000'000'000'000;  // 12 decimals for high precision
    static constexpr int64_t MAX_VALUE = INT64_MAX / BASE_PRECISION;
    
    // Mathematical constants (scaled by precision)
    static constexpr int64_t E_SCALED = 2'718'281'828;            // e * 1e9
    static constexpr int64_t PI_SCALED = 3'141'592'654;           // π * 1e9
    static constexpr int64_t LN2_SCALED = 693'147'181;            // ln(2) * 1e9
    static constexpr int64_t SQRT2_SCALED = 1'414'213'562;        // √2 * 1e9

public:
    // ==================== Core Arithmetic with Overflow Protection ====================

    /**
     * Multiply two satoshi amounts and divide by a third with full precision
     * Uses 128-bit intermediate to prevent overflow
     * @param a First factor
     * @param b Second factor
     * @param c Divisor
     * @return (a * b) / c with 9 decimal precision
     */
    static int64_t mulDiv(int64_t a, int64_t b, int64_t c) {
        if (c == 0) {
            throw std::invalid_argument("Division by zero");
        }
        
        // Check for overflow in 128-bit multiplication
        __int128_t result = (__int128_t)a * b;
        result = result / c;
        
        if (result > INT64_MAX || result < INT64_MIN) {
            throw std::overflow_error("Result out of 64-bit range");
        }
        return static_cast<int64_t>(result);
    }

    /**
     * Multiply with high precision (12 decimals)
     */
    static int64_t mulDivHigh(int64_t a, int64_t b, int64_t c) {
        __int128_t result = (__int128_t)a * b * HIGH_PRECISION / BASE_PRECISION;
        result = result / c;
        
        if (result > INT64_MAX || result < INT64_MIN) {
            throw std::overflow_error("High precision result out of range");
        }
        return static_cast<int64_t>(result);
    }

    /**
     * Safe multiplication with precision scaling
     */
    static int64_t mulScale(int64_t a, int64_t b, int64_t scale) {
        return mulDiv(a, b, scale);
    }

    // ==================== Advanced Mathematical Functions ====================

    /**
     * Calculate power with integer exponent (a^exp)
     * @param a Base (scaled by BASE_PRECISION)
     * @param exp Exponent (integer)
     * @return a^exp scaled by BASE_PRECISION
     */
    static int64_t pow(int64_t a, int64_t exp) {
        if (exp < 0) {
            throw std::invalid_argument("Negative exponent not supported");
        }
        if (exp == 0) return BASE_PRECISION;
        
        int64_t result = BASE_PRECISION;
        int64_t base = a;
        int64_t e = exp;
        
        while (e > 0) {
            if (e & 1) {
                result = mulDiv(result, base, BASE_PRECISION);
            }
            base = mulDiv(base, base, BASE_PRECISION);
            e >>= 1;
        }
        return result;
    }

    /**
     * Calculate natural logarithm (ln) using series expansion
     * @param x Value scaled by BASE_PRECISION (x > 0)
     * @return ln(x) scaled by BASE_PRECISION
     */
    static int64_t ln(int64_t x) {
        if (x <= 0) {
            throw std::invalid_argument("ln argument must be positive");
        }
        
        // Use ln(x) = 2 * artanh((x-1)/(x+1))
        int64_t numerator = x - BASE_PRECISION;
        int64_t denominator = x + BASE_PRECISION;
        int64_t y = mulDiv(numerator, BASE_PRECISION, denominator);
        
        int64_t result = 0;
        int64_t term = y;
        int64_t ySquared = mulDiv(y, y, BASE_PRECISION);
        int64_t n = 1;
        
        // Series: 2 * (y + y^3/3 + y^5/5 + ...)
        while (term != 0 && n < 100) { // Limit iterations to prevent infinite loop
            result = result + mulDiv(term, 2 * BASE_PRECISION, n);
            term = mulDiv(term, ySquared, BASE_PRECISION);
            n += 2;
        }
        
        return result;
    }

    /**
     * Calculate exponential (e^x)
     * @param x Scaled by BASE_PRECISION
     * @return e^x scaled by BASE_PRECISION
     */
    static int64_t exp(int64_t x) {
        // Use e^x = sum(x^n/n!)
        int64_t result = BASE_PRECISION;
        int64_t term = BASE_PRECISION;
        int64_t n = 1;
        
        while (term != 0 && n < 50) { // Limit iterations
            term = mulDiv(term, x, n * BASE_PRECISION);
            result = result + term;
            n++;
        }
        
        return result;
    }

    /**
     * Calculate square root using Newton's method
     * @param x Scaled by BASE_PRECISION
     * @return √x scaled by BASE_PRECISION
     */
    static int64_t sqrt(int64_t x) {
        if (x < 0) {
            throw std::invalid_argument("Cannot take square root of negative number");
        }
        if (x == 0) return 0;
        
        int64_t guess = x / 2 + BASE_PRECISION / 2;
        int64_t prevGuess = 0;
        
        // Newton's method: guess = (guess + x/guess) / 2
        while (std::abs(guess - prevGuess) > 1) {
            prevGuess = guess;
            int64_t reciprocal = mulDiv(x, BASE_PRECISION, guess);
            guess = (guess + reciprocal) / 2;
        }
        
        return guess;
    }

    // ==================== Financial Calculations ====================

    /**
     * Calculate compound interest over time
     * @param principal Initial amount in satoshis
     * @param rateBasisPoints Annual rate in basis points (1% = 100 basis points)
     * @param periods Number of compounding periods
     * @param compoundsPerPeriod Compounding frequency per period
     * @return Future value in satoshis
     */
    static int64_t compoundInterest(int64_t principal, int64_t rateBasisPoints, 
                                   int64_t periods, int64_t compoundsPerPeriod = 1) {
        if (principal < 0 || rateBasisPoints < 0 || periods < 0) {
            throw std::invalid_argument("Invalid parameters for compound interest");
        }
        
        int64_t ratePerPeriod = mulDiv(rateBasisPoints, compoundsPerPeriod, 1);
        int64_t amount = principal;
        
        for (int64_t i = 0; i < periods * compoundsPerPeriod; i++) {
            int64_t interest = mulDiv(amount, ratePerPeriod, 10000 * compoundsPerPeriod);
            amount = amount + interest;
        }
        
        return amount;
    }

    /**
     * Calculate continuous compound interest
     * A = P * e^(rt)
     */
    static int64_t continuousCompound(int64_t principal, int64_t rateBasisPoints, double time) {
        int64_t rate = mulDiv(rateBasisPoints, BASE_PRECISION, 10000);
        int64_t exponent = static_cast<int64_t>(rate * time);
        int64_t eFactor = exp(exponent);
        return mulDiv(principal, eFactor, BASE_PRECISION);
    }

    /**
     * Calculate present value
     * PV = FV / (1 + r)^n
     */
    static int64_t presentValue(int64_t futureValue, int64_t rateBasisPoints, int64_t periods) {
        if (rateBasisPoints == 0) return futureValue;
        
        int64_t denominator = BASE_PRECISION;
        int64_t rate = mulDiv(rateBasisPoints, BASE_PRECISION, 10000);
        
        for (int64_t i = 0; i < periods; i++) {
            denominator = mulDiv(denominator, BASE_PRECISION + rate, BASE_PRECISION);
        }
        
        return mulDiv(futureValue, BASE_PRECISION, denominator);
    }

    /**
     * Calculate net present value (NPV) of cash flows
     * @param cashFlows Vector of (period, amount) pairs
     * @param rateBasisPoints Discount rate in basis points
     * @return NPV in satoshis
     */
    static int64_t netPresentValue(const std::vector<std::pair<int64_t, int64_t>>& cashFlows, 
                                   int64_t rateBasisPoints) {
        int64_t npv = 0;
        
        for (const auto& cf : cashFlows) {
            int64_t period = cf.first;
            int64_t amount = cf.second;
            
            if (period == 0) {
                npv = npv + amount;
            } else {
                int64_t pv = presentValue(amount, rateBasisPoints, period);
                npv = npv + (amount < 0 ? -pv : pv);
            }
        }
        
        return npv;
    }

    /**
     * Calculate internal rate of return (IRR) using Newton's method
     * @param cashFlows Vector of cash flows (period 0 first)
     * @return IRR in basis points
     */
    static int64_t internalRateOfReturn(const std::vector<int64_t>& cashFlows) {
        if (cashFlows.empty()) return 0;
        
        int64_t guess = 1000; // Start with 10%
        int64_t tolerance = 1; // 0.01% tolerance
        int64_t maxIterations = 100;
        
        for (int64_t iter = 0; iter < maxIterations; iter++) {
            int64_t npv = 0;
            int64_t derivative = 0;
            
            for (size_t t = 0; t < cashFlows.size(); t++) {
                int64_t factor = pow(BASE_PRECISION + guess, t);
                npv = npv + mulDiv(cashFlows[t], BASE_PRECISION, factor);
                
                if (t > 0) {
                    int64_t derivFactor = pow(BASE_PRECISION + guess, t + 1);
                    derivative = derivative - mulDiv(cashFlows[t] * t, BASE_PRECISION, derivFactor);
                }
            }
            
            if (std::abs(npv) < tolerance) {
                return guess;
            }
            
            if (derivative == 0) break;
            
            int64_t newGuess = guess - mulDiv(npv, BASE_PRECISION, derivative);
            
            if (std::abs(newGuess - guess) < 1) {
                return newGuess;
            }
            
            guess = newGuess;
        }
        
        throw std::runtime_error("IRR calculation did not converge");
    }

    // ==================== Statistical Functions ====================

    /**
     * Weighted average of amounts
     * @param amounts Vector of values
     * @param weights Vector of weights
     * @return Weighted average
     */
    static int64_t weightedAverage(const std::vector<int64_t>& amounts, 
                                   const std::vector<int64_t>& weights) {
        if (amounts.size() != weights.size() || amounts.empty()) {
            throw std::invalid_argument("Mismatched or empty vectors");
        }
        
        int64_t totalWeight = 0;
        int64_t weightedSum = 0;
        
        for (size_t i = 0; i < amounts.size(); i++) {
            weightedSum = weightedSum + amounts[i] * weights[i];
            totalWeight = totalWeight + weights[i];
        }
        
        if (totalWeight == 0) {
            throw std::invalid_argument("Total weight cannot be zero");
        }
        
        return weightedSum / totalWeight;
    }

    /**
     * Calculate exponential moving average (EMA)
     * @param values Time series values
     * @param smoothing Smoothing factor (2/(period+1)) scaled by BASE_PRECISION
     * @return EMA values
     */
    static std::vector<int64_t> exponentialMovingAverage(const std::vector<int64_t>& values, 
                                                         int64_t smoothing) {
        if (values.empty()) return {};
        
        std::vector<int64_t> ema;
        ema.reserve(values.size());
        
        ema.push_back(values[0]);
        
        for (size_t i = 1; i < values.size(); i++) {
            int64_t prevEma = ema.back();
            int64_t current = mulDiv(smoothing, values[i], BASE_PRECISION) +
                             mulDiv(BASE_PRECISION - smoothing, prevEma, BASE_PRECISION);
            ema.push_back(current);
        }
        
        return ema;
    }

    /**
     * Calculate standard deviation
     * @param values Vector of values
     * @param mean Pre-calculated mean (optional)
     * @return Standard deviation scaled by BASE_PRECISION
     */
    static int64_t standardDeviation(const std::vector<int64_t>& values, int64_t mean = -1) {
        if (values.size() < 2) return 0;
        
        if (mean == -1) {
            int64_t sum = 0;
            for (int64_t v : values) sum += v;
            mean = sum / values.size();
        }
        
        int64_t variance = 0;
        for (int64_t v : values) {
            int64_t diff = v - mean;
            variance += mulDiv(diff, diff, BASE_PRECISION);
        }
        
        variance = variance / values.size();
        return sqrt(variance);
    }

    /**
     * Calculate correlation coefficient between two datasets
     * @param x First dataset
     * @param y Second dataset
     * @return Correlation coefficient scaled by BASE_PRECISION
     */
    static int64_t correlation(const std::vector<int64_t>& x, const std::vector<int64_t>& y) {
        if (x.size() != y.size() || x.empty()) {
            throw std::invalid_argument("Mismatched or empty datasets");
        }
        
        size_t n = x.size();
        
        // Calculate means
        int64_t sumX = 0, sumY = 0;
        for (size_t i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
        }
        int64_t meanX = sumX / n;
        int64_t meanY = sumY / n;
        
        // Calculate covariance and variances
        int64_t cov = 0, varX = 0, varY = 0;
        for (size_t i = 0; i < n; i++) {
            int64_t diffX = x[i] - meanX;
            int64_t diffY = y[i] - meanY;
            cov += mulDiv(diffX, diffY, BASE_PRECISION);
            varX += mulDiv(diffX, diffX, BASE_PRECISION);
            varY += mulDiv(diffY, diffY, BASE_PRECISION);
        }
        
        if (varX == 0 || varY == 0) return 0;
        
        int64_t stdX = sqrt(varX);
        int64_t stdY = sqrt(varY);
        
        return mulDiv(cov, BASE_PRECISION, mulDiv(stdX, stdY, BASE_PRECISION));
    }

    // ==================== Bonding Curve Functions ====================

    /**
     * Linear bonding curve: price = basePrice + slope * supply
     */
    static int64_t linearBondingCurve(int64_t basePrice, int64_t slope, int64_t supply) {
        return basePrice + mulDiv(slope, supply, BASE_PRECISION);
    }

    /**
     * Exponential bonding curve: price = basePrice * e^(k * supply)
     */
    static int64_t exponentialBondingCurve(int64_t basePrice, int64_t k, int64_t supply) {
        int64_t exponent = mulDiv(k, supply, BASE_PRECISION);
        int64_t eFactor = exp(exponent);
        return mulDiv(basePrice, eFactor, BASE_PRECISION);
    }

    /**
     * Logarithmic bonding curve: price = basePrice * ln(k * supply + 1)
     */
    static int64_t logarithmicBondingCurve(int64_t basePrice, int64_t k, int64_t supply) {
        int64_t argument = mulDiv(k, supply, BASE_PRECISION) + BASE_PRECISION;
        int64_t logValue = ln(argument);
        return mulDiv(basePrice, logValue, BASE_PRECISION);
    }

    /**
     * Calculate buy amount for bonding curve
     * @param curveFunction Function that returns price at given supply
     * @param currentSupply Current token supply
     * @param buyAmount Amount of tokens to buy
     * @return Cost in satoshis
     */
    static int64_t calculateBuyCost(std::function<int64_t(int64_t)> curveFunction,
                                    int64_t currentSupply, int64_t buyAmount) {
        int64_t cost = 0;
        
        // Integrate price over the supply range
        for (int64_t i = 0; i < buyAmount; i++) {
            cost += curveFunction(currentSupply + i);
        }
        
        return cost;
    }

    // ==================== Risk Metrics ====================

    /**
     * Calculate Value at Risk (VaR) using historical method
     * @param returns Historical returns (scaled by BASE_PRECISION)
     * @param confidenceLevel Confidence level (e.g., 9500 for 95%)
     * @return VaR in basis points
     */
    static int64_t valueAtRisk(const std::vector<int64_t>& returns, int64_t confidenceLevel) {
        if (returns.empty()) return 0;
        
        std::vector<int64_t> sorted = returns;
        std::sort(sorted.begin(), sorted.end());
        
        size_t index = static_cast<size_t>((10000 - confidenceLevel) * returns.size() / 10000);
        index = std::min(index, returns.size() - 1);
        
        return -sorted[index];
    }

    /**
     * Calculate Sharpe ratio
     * @param returns Historical returns
     * @param riskFreeRate Risk-free rate in basis points
     * @return Sharpe ratio scaled by BASE_PRECISION
     */
    static int64_t sharpeRatio(const std::vector<int64_t>& returns, int64_t riskFreeRate) {
        if (returns.empty()) return 0;
        
        // Calculate mean return
        int64_t sum = 0;
        for (int64_t r : returns) sum += r;
        int64_t mean = sum / returns.size();
        
        // Calculate standard deviation
        int64_t stdDev = standardDeviation(returns, mean);
        
        if (stdDev == 0) return 0;
        
        // Sharpe = (mean - riskFree) / stdDev
        int64_t excessReturn = mean - riskFreeRate;
        return mulDiv(excessReturn, BASE_PRECISION, stdDev);
    }

    // ==================== Utility Functions ====================

    /**
     * Linear interpolation between two points
     */
    static int64_t lerp(int64_t a, int64_t b, int64_t t) {
        return a + mulDiv(b - a, t, BASE_PRECISION);
    }

    /**
     * Clamp value between min and max
     */
    static int64_t clamp(int64_t value, int64_t minVal, int64_t maxVal) {
        return std::max(minVal, std::min(value, maxVal));
    }

    /**
     * Format scaled value as decimal string
     */
    static std::string formatScaled(int64_t value, int64_t scale, int decimals = 9) {
        int64_t whole = value / scale;
        int64_t fraction = value % scale;
        
        std::stringstream ss;
        ss << whole << ".";
        
        std::string fracStr = std::to_string(fraction);
        while (fracStr.length() < 9) {
            fracStr = "0" + fracStr;
        }
        
        if (decimals < 9) {
            fracStr = fracStr.substr(0, decimals);
        }
        
        // Trim trailing zeros
        while (fracStr.length() > 1 && fracStr.back() == '0') {
            fracStr.pop_back();
        }
        
        ss << fracStr;
        return ss.str();
    }

    /**
     * Parse decimal string to scaled value
     */
    static int64_t parseScaled(const std::string& str, int64_t scale) {
        size_t dotPos = str.find('.');
        
        if (dotPos == std::string::npos) {
            return std::stoll(str) * scale;
        }
        
        std::string wholePart = str.substr(0, dotPos);
        std::string fracPart = str.substr(dotPos + 1);
        
        while (fracPart.length() < 9) {
            fracPart += '0';
        }
        if (fracPart.length() > 9) {
            fracPart = fracPart.substr(0, 9);
        }
        
        int64_t whole = std::stoll(wholePart);
        int64_t fraction = std::stoll(fracPart);
        
        return whole * scale + fraction;
    }
};

#endif // DECIMAL_MATH_HPP

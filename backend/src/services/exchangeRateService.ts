import axios from 'axios';

/**
 * ExchangeRateService - Dịch vụ chuyển đổi tỉ giá tiền tệ
 * 
 * Mục đích: Chuyển đổi GBP sang VND cho thanh toán MoMo
 * 
 * API sử dụng: fawazahmed0/currency-api
 * - Miễn phí, không giới hạn request
 * - Không cần API key
 * - Cập nhật realtime (daily)
 * - Độ ổn định cao (hosted trên jsdelivr CDN)
 * - Open source: https://github.com/fawazahmed0/currency-api
 * 
 * Lý do chọn:
 * 1. Hoàn toàn miễn phí, không yêu cầu đăng ký
 * 2. Hosted trên CDN toàn cầu (jsdelivr) - uptime cao
 * 3. Hỗ trợ đầy đủ các loại tiền tệ bao gồm GBP và VND
 * 4. Response format đơn giản, dễ xử lý
 * 5. Không có rate limiting nghiêm ngặt
 */

interface CurrencyAPIResponse {
  date: string;
  [baseCurrency: string]: {
    vnd?: number;
    gbp?: number;
    usd?: number;
    [key: string]: number | undefined;
  } | string;
}

interface ExchangeRates {
  gbp_to_vnd: number;
  gbp_to_usd: number;
  usd_to_vnd: number;
  usd_to_gbp: number;
  date: string;
}

export class ExchangeRateService {
  private readonly GBP_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/gbp.json';
  private readonly USD_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
  private cachedRates: ExchangeRates | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION_MS = 3600000; // 1 hour cache

  /**
   * Lấy tất cả tỉ giá (GBP, USD, VND) từ API
   * Sử dụng cache 1 giờ để tránh request quá nhiều
   */
  async getAllRates(): Promise<ExchangeRates> {
    try {
      // Kiểm tra cache
      const now = Date.now();
      if (this.cachedRates && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION_MS)) {
        console.log('💰 [ExchangeRate] Using cached rates');
        return this.cachedRates;
      }

      console.log('🌐 [ExchangeRate] Fetching latest exchange rates...');
      
      // Fetch both GBP and USD rates in parallel
      const [gbpResponse, usdResponse] = await Promise.all([
        axios.get<CurrencyAPIResponse>(this.GBP_API_URL, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        }),
        axios.get<CurrencyAPIResponse>(this.USD_API_URL, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        })
      ]);

      const gbpData = gbpResponse.data.gbp as { vnd: number; usd: number };
      const usdData = usdResponse.data.usd as { vnd: number; gbp: number };

      if (!gbpData?.vnd || !gbpData?.usd || !usdData?.vnd || !usdData?.gbp) {
        throw new Error('Invalid response from currency API');
      }

      const rates: ExchangeRates = {
        gbp_to_vnd: gbpData.vnd,
        gbp_to_usd: gbpData.usd,
        usd_to_vnd: usdData.vnd,
        usd_to_gbp: usdData.gbp,
        date: (gbpResponse.data.date as string) || new Date().toISOString().split('T')[0]
      };

      // Validate rates
      if (rates.gbp_to_vnd < 20000 || rates.gbp_to_vnd > 60000) {
        console.warn('⚠️ [ExchangeRate] GBP->VND rate seems unusual:', rates.gbp_to_vnd);
      }
      if (rates.usd_to_vnd < 15000 || rates.usd_to_vnd > 40000) {
        console.warn('⚠️ [ExchangeRate] USD->VND rate seems unusual:', rates.usd_to_vnd);
      }

      // Lưu vào cache
      this.cachedRates = rates;
      this.cacheTimestamp = now;

      console.log('✅ [ExchangeRate] Rates fetched successfully:', rates);

      return rates;
    } catch (error: any) {
      console.error('❌ [ExchangeRate] Failed to fetch exchange rates:', error.message);
      
      // Nếu có cache cũ, sử dụng cache
      if (this.cachedRates) {
        console.warn('⚠️ [ExchangeRate] Using old cached rates');
        return this.cachedRates;
      }

      // Fallback: Sử dụng tỉ giá ước tính
      const fallbackRates: ExchangeRates = {
        gbp_to_vnd: 32000,
        gbp_to_usd: 1.27,
        usd_to_vnd: 25000,
        usd_to_gbp: 0.79,
        date: new Date().toISOString().split('T')[0]
      };
      console.warn('⚠️ [ExchangeRate] Using fallback rates:', fallbackRates);
      
      return fallbackRates;
    }
  }

  /**
   * Lấy tỉ giá GBP -> VND (backward compatibility)
   */
  async getExchangeRate(): Promise<number> {
    const rates = await this.getAllRates();
    return rates.gbp_to_vnd;
  }

  /**
   * Chuyển đổi GBP sang VND
   * @param amountGBP - Số tiền tính bằng GBP
   * @returns Số tiền tính bằng VND (làm tròn theo quy tắc)
   */
  async convertGBPtoVND(amountGBP: number): Promise<number> {
    if (!amountGBP || amountGBP <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    const rate = await this.getExchangeRate();
    const amountVND = amountGBP * rate;

    /**
     * Quy tắc làm tròn cho MoMo:
     * 1. MoMo yêu cầu số tiền là integer (không số thập phân)
     * 2. Tối thiểu: 1,000 VND
     * 3. Tối đa: 50,000,000 VND
     * 4. Làm tròn lên đến hàng nghìn gần nhất (để dễ đọc và tránh mất mát nhỏ)
     */
    const roundedAmount = Math.ceil(amountVND / 1000) * 1000;

    console.log('💱 [ExchangeRate] Conversion:', {
      amountGBP: `£${amountGBP.toFixed(2)}`,
      rate: `${rate.toFixed(2)} VND/GBP`,
      rawVND: `${amountVND.toFixed(2)} VND`,
      roundedVND: `${roundedAmount.toLocaleString()} VND`
    });

    // Validate kết quả
    if (roundedAmount < 1000) {
      throw new Error(`Amount too small: ${roundedAmount} VND (minimum 1,000 VND required by MoMo)`);
    }

    if (roundedAmount > 50000000) {
      throw new Error(`Amount too large: ${roundedAmount} VND (maximum 50,000,000 VND allowed by MoMo)`);
    }

    return roundedAmount;
  }

  /**
   * Convert amount from one currency to another
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency (gbp/usd/vnd)
   * @param toCurrency - Target currency (gbp/usd/vnd)
   */
  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    fromCurrency = fromCurrency.toLowerCase();
    toCurrency = toCurrency.toLowerCase();

    // Same currency - no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getAllRates();
    let result = amount;

    // Convert to VND first if needed
    if (fromCurrency === 'gbp') {
      if (toCurrency === 'vnd') {
        result = amount * rates.gbp_to_vnd;
      } else if (toCurrency === 'usd') {
        result = amount * rates.gbp_to_usd;
      }
    } else if (fromCurrency === 'usd') {
      if (toCurrency === 'vnd') {
        result = amount * rates.usd_to_vnd;
      } else if (toCurrency === 'gbp') {
        result = amount * rates.usd_to_gbp;
      }
    } else if (fromCurrency === 'vnd') {
      if (toCurrency === 'gbp') {
        result = amount / rates.gbp_to_vnd;
      } else if (toCurrency === 'usd') {
        result = amount / rates.usd_to_vnd;
      }
    } else {
      throw new Error(`Unsupported currency: ${fromCurrency}`);
    }

    console.log(`💱 [ExchangeRate] ${amount} ${fromCurrency.toUpperCase()} = ${result.toFixed(2)} ${toCurrency.toUpperCase()}`);

    return result;
  }

  /**
   * Clear cache (dùng cho testing hoặc force refresh)
   */
  clearCache(): void {
    this.cachedRates = null;
    this.cacheTimestamp = null;
    console.log('🗑️ [ExchangeRate] Cache cleared');
  }

  /**
   * Get cache info (cho debugging)
   */
  getCacheInfo(): { rates: ExchangeRates | null; age: number | null } {
    if (!this.cacheTimestamp) {
      return { rates: null, age: null };
    }

    const age = Date.now() - this.cacheTimestamp;
    return {
      rates: this.cachedRates,
      age: Math.floor(age / 1000) // seconds
    };
  }
}

// Export singleton instance
const exchangeRateService = new ExchangeRateService();
export default exchangeRateService;

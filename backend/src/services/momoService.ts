import crypto from 'crypto';
import axios from 'axios';

interface MomoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  extraData?: string;
}

interface MomoPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

interface MomoIPNData {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

export class MomoService {
  private partnerCode: string;
  private accessKey: string;
  private secretKey: string;
  private endpoint: string;
  private redirectUrl: string;
  private ipnUrl: string;
  private initialized: boolean = false;

  constructor() {
    // Don't load env vars in constructor - wait for init()
    this.partnerCode = '';
    this.accessKey = '';
    this.secretKey = '';
    this.endpoint = '';
    this.redirectUrl = '';
    this.ipnUrl = '';
  }

  /**
   * Initialize service with environment variables
   * Must be called after dotenv.config()
   */
  init(): void {
    if (this.initialized) return;

    this.partnerCode = process.env.MOMO_PARTNER_CODE || '';
    this.accessKey = process.env.MOMO_ACCESS_KEY || '';
    this.secretKey = process.env.MOMO_SECRET_KEY || '';
    this.endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    this.redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:4200/payment/momo/callback';
    this.ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/v1/payment/momo/ipn';

    // Validate MOMO credentials on initialization
    if (!this.partnerCode || !this.accessKey || !this.secretKey) {
      console.warn('⚠️ MOMO is disabled due to missing configuration:', {
        hasPartnerCode: !!this.partnerCode,
        hasAccessKey: !!this.accessKey,
        hasSecretKey: !!this.secretKey
      });
      console.warn('Set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY to enable MOMO payments');
    } else {
      console.log('✅ MOMO Service initialized:', {
        partnerCode: this.partnerCode,
        endpoint: this.endpoint,
        redirectUrl: this.redirectUrl,
        ipnUrl: this.ipnUrl
      });
    }

    this.initialized = true;
  }

  /**
   * Generate HMAC SHA256 signature for MOMO request
   */
  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Create payment request to MOMO
   */
  async createPaymentRequest(paymentData: MomoPaymentRequest): Promise<MomoPaymentResponse> {
    // Ensure service is initialized
    if (!this.initialized) {
      this.init();
    }

    // Validate credentials before making request
    if (!this.partnerCode || !this.accessKey || !this.secretKey) {
      throw new Error('MOMO credentials are not configured. Please check your .env file.');
    }

    // Generate unique orderId with MOMO prefix and timestamp (like reference project)
    const momoOrderId = `MOMO${paymentData.orderId}${Date.now()}`;
    const requestId = `${this.partnerCode}${Date.now()}`;
    const orderInfo = paymentData.orderInfo || `Payment for order ${paymentData.orderId}`;
    
    // Encode extraData to Base64 (CRITICAL: reference project does this)
    const extraDataObj = paymentData.extraData ? JSON.parse(paymentData.extraData) : { orderId: paymentData.orderId };
    const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString('base64');
    
    const requestType = 'payWithMethod'; // payWithMethod, captureWallet
    const autoCapture = true;
    const lang = 'vi';

    // Create raw signature string according to MOMO documentation
    const rawSignature = `accessKey=${this.accessKey}&amount=${paymentData.amount}&extraData=${extraData}&ipnUrl=${this.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = this.generateSignature(rawSignature);

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'Furni Shop',
      storeId: 'FurniShop',
      requestId,
      amount: paymentData.amount,
      orderId: momoOrderId, // Use MOMO prefixed orderId
      orderInfo,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      signature
    };

    try {
      console.log('\n🔵 [MOMO] Creating payment request...');
      console.log('📦 Request Data:', {
        originalOrderId: paymentData.orderId,
        momoOrderId,
        amount: paymentData.amount,
        requestId,
        orderInfo
      });
      
      console.log('🔐 Signature Generation:');
      console.log('  Raw String:', rawSignature);
      console.log('  Signature:', signature);
      console.log('  ExtraData (Base64):', extraData);
      
      console.log('📤 Sending to MOMO:', {
        endpoint: this.endpoint,
        body: requestBody
      });

      const response = await axios.post<MomoPaymentResponse>(
        this.endpoint,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ [MOMO] Response received:', {
        resultCode: response.data.resultCode,
        message: response.data.message,
        payUrl: response.data.payUrl ? 'Present' : 'Missing'
      });

      if (response.data.resultCode !== 0) {
        console.error('❌ [MOMO] Payment creation failed:', {
          resultCode: response.data.resultCode,
          message: response.data.message
        });
        throw new Error(`MOMO Error [${response.data.resultCode}]: ${response.data.message}`);
      }

      // Return response with momoOrderId for tracking
      return {
        ...response.data,
        orderId: momoOrderId // Override with our MOMO-prefixed orderId
      };
    } catch (error: any) {
      console.error('\n❌ [MOMO] Payment request failed:');
      
      if (error.response) {
        // MOMO API returned an error
        console.error('  Status:', error.response.status);
        console.error('  Data:', error.response.data);
        throw new Error(
          `MOMO API Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        // Request was made but no response received
        console.error('  No response from MOMO');
        console.error('  Request:', error.request);
        throw new Error('MOMO API is unreachable. Please check network connection.');
      } else {
        // Error setting up the request
        console.error('  Error:', error.message);
        throw new Error(`Failed to create MOMO payment: ${error.message}`);
      }
    }
  }

  /**
   * Verify IPN signature from MOMO callback
   */
  verifyIPNSignature(ipnData: MomoIPNData): boolean {
    try {
      // Create raw signature string for IPN according to MOMO documentation
      const rawSignature = `accessKey=${this.accessKey}&amount=${ipnData.amount}&extraData=${ipnData.extraData}&message=${ipnData.message}&orderId=${ipnData.orderId}&orderInfo=${ipnData.orderInfo}&orderType=${ipnData.orderType}&partnerCode=${ipnData.partnerCode}&payType=${ipnData.payType}&requestId=${ipnData.requestId}&responseTime=${ipnData.responseTime}&resultCode=${ipnData.resultCode}&transId=${ipnData.transId}`;
      
      const expectedSignature = this.generateSignature(rawSignature);

      const isValid = expectedSignature === ipnData.signature;

      console.log('MOMO IPN signature verification:', {
        orderId: ipnData.orderId,
        isValid,
        resultCode: ipnData.resultCode
      });

      return isValid;
    } catch (error: any) {
      console.error('MOMO signature verification failed:', error.message);
      return false;
    }
  }

  /**
   * Parse MOMO result code to payment status
   */
  parseResultCode(resultCode: number): 'paid' | 'failed' | 'pending' {
    switch (resultCode) {
      case 0:
        return 'paid'; // Success
      case 1006:
        return 'failed'; // Transaction failed
      case 1000:
        return 'failed'; // System error
      case 9000:
        return 'pending'; // Transaction is processing
      default:
        return 'failed'; // Default to failed for unknown codes
    }
  }

  /**
   * Get human-readable message for result code
   */
  getResultMessage(resultCode: number): string {
    const messages: Record<number, string> = {
      0: 'Payment successful',
      9000: 'Payment is being processed',
      1000: 'System error occurred',
      1001: 'Account not found',
      1002: 'Account is inactive',
      1003: 'Account is locked',
      1004: 'Invalid amount',
      1005: 'Invalid transaction',
      1006: 'Transaction failed',
      1007: 'Transaction rejected',
      1026: 'Transaction limit exceeded',
      1080: 'Payment was cancelled',
      1081: 'Transaction timeout',
      2001: 'Invalid parameters',
      2007: 'Invalid signature',
      3001: 'Payment method not supported',
      3002: 'Card type not supported',
      4001: 'Transaction amount too low',
      4011: 'Transaction amount exceeds limit',
      4100: 'User cancelled the transaction',
      7000: 'Payment is being processed',
      7002: 'Payment is being processed'
    };

    return messages[resultCode] || `Unknown error (code: ${resultCode})`;
  }
}

// Export singleton instance
const momoServiceInstance = new MomoService();
export default momoServiceInstance;

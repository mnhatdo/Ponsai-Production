import { OAuth2Client, TokenPayload } from 'google-auth-library';

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

/**
 * Verify Google ID Token and extract user information
 * This is used when the frontend uses Google Sign-In button
 * and sends the credential (ID token) to our backend
 */
export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo | null> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload: TokenPayload | undefined = ticket.getPayload();
    
    if (!payload) {
      console.error('Google OAuth: No payload in token');
      return null;
    }

    if (!payload.email) {
      console.error('Google OAuth: No email in payload');
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
      emailVerified: payload.email_verified || false
    };
  } catch (error) {
    console.error('Google OAuth: Token verification failed', error);
    return null;
  }
};

/**
 * Check if Google OAuth is configured
 */
export const isGoogleOAuthConfigured = (): boolean => {
  return !!process.env.GOOGLE_CLIENT_ID;
};

export default {
  verifyGoogleToken,
  isGoogleOAuthConfigured
};

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
          ].join(' '),
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, exchange tokens with our backend
      if (account && account.access_token && account.refresh_token) {
        try {
          // Send tokens to our backend to store them
          const response = await axios.post(`${API_URL}/auth/google/callback`, {
            code: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000).toISOString()
              : null,
            providerAccountId: account.providerAccountId,
            profile: {
              id: profile?.sub,
              email: profile?.email,
              name: profile?.name,
              picture: (profile as { picture?: string })?.picture,
            },
          });

          if (response.data.success) {
            token.backendToken = response.data.token;
            token.userId = response.data.user.id;
          }
        } catch (error) {
          console.error('Failed to sync tokens with backend:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
      }

      if (token.userId) {
        session.userId = token.userId as string;
      }

      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  events: {
    async signOut() {
      // Additional cleanup if needed
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    userId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    userId?: string;
  }
}

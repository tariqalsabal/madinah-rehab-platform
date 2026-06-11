import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import axios from "axios";

// إعداد NextAuth: دخول بالبريد (عبر ORDS) + Google + Facebook
// رمز الوصول (JWT الصادر من ORDS) يُحفظ في الجلسة لاستخدامه في طلبات الـ API.

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "البريد وكلمة المرور",
      credentials: {
        email: { label: "البريد", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { data } = await axios.post(`${process.env.BACKEND_API_URL}/auth/login`, {
          email: credentials.email,
          password: credentials.password,
        });
        if (!data?.access_token) return null;
        return {
          id: String(data.user_id),
          name: credentials.email,
          email: credentials.email,
          accessToken: data.access_token,
          roles: (data.roles || "").split(",").filter(Boolean),
        } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.roles = (user as any).roles;
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).roles = token.roles;
      (session as any).userId = token.userId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

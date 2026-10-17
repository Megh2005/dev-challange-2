import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email address and password.");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const db = await getDatabase();
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ email });

        if (!user) {
          throw new Error("No registered account found with this email address.");
        }

        if (!user.password) {
          throw new Error("Account has no password set. Please sign up or reset your password.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password. Please verify your credentials and try again.");
        }

        return {
          id: user._id.toString(),
          name: user.name || "User",
          email: user.email,
          country: user.country || "Not specified"
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    // 24 hour session
    maxAge: 24 * 60 * 60
  },
  jwt: {
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.country = user.country;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.name = (token.name as string) || session.user.name;
        session.user.email = (token.email as string) || session.user.email;
        session.user.country = (token.country as string) || null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  secret: process.env.NEXTAUTH_SECRET || "mediscan-production-auth-secret-key-32chars-minimum"
};

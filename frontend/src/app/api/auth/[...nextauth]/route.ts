import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// مسار NextAuth (App Router)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

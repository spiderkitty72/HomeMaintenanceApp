import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import type { DefaultSession, NextAuthConfig } from "next-auth"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { clearLoginFailures, getClientIp, isLoginBlocked, recordLoginFailure } from "@/lib/loginRateLimit"

declare module "next-auth" {
    interface User {
        password?: string | null
        role?: string
    }
    interface Session {
        user: {
            id: string
            role?: string
        } & DefaultSession["user"]
    }
}

const authConfig = {
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials, request) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const ip = getClientIp(request as Request | undefined)
                    if (isLoginBlocked(email, ip)) return null

                    const user = await prisma.user.findUnique({ where: { email } }) as any
                    const passwordsMatch = !!user?.password && await bcrypt.compare(password, user.password)
                    if (passwordsMatch) {
                        clearLoginFailures(email)
                        return user
                    }
                    recordLoginFailure(email, ip)
                }
                return null
            },
        }),
    ],
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login", // Optional, will add later
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as string | undefined;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                return token;
            }
            // On the Node.js server (pages and server actions), re-read the user so that a
            // deleted user loses access and a role change applies right away. The edge
            // middleware can't use Prisma, so it keeps the token as is.
            if (process.env.NEXT_RUNTIME !== "edge" && token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true },
                });
                if (!dbUser) return null;
                token.role = dbUser.role;
            }
            return token;
        }
    }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

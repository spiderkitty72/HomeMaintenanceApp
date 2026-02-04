import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

declare module "next-auth" {
    interface User {
        password?: string | null
    }
}

const authConfig = {
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await prisma.user.findUnique({ where: { email } }) as any
                    if (!user || !user.password) return null

                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) return user
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
                (session.user as any).role = token.role;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        }
    }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

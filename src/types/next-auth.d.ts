import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isVerified?: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }

  interface Profile {
    id: number
    properties?: {
      nickname?: string
      profile_image?: string
    }
    kakao_account?: {
      email?: string
      profile?: {
        nickname?: string
        profile_image_url?: string
      }
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    kakaoId?: string | number
  }
}
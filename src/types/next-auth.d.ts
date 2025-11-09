import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      email: string
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    id: number
    email: string
    name?: string | null
    image?: string | null
  }
}

'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Callback() {
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const exchangeCode = async () => {
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)

            if (error) {
                console.error('Error exchanging code:', error)
                router.push('/login')
                return
            }

            // ✅ Session is now stored client-side by Supabase
            router.push('/dashboard')
        }

        exchangeCode()
    }, [router, supabase])

    return <p>Finishing login... please wait</p>
}

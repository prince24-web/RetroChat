'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/app/components/Navbar'
import { FileText, ArrowRight } from "lucide-react"
import FileUploader from '../components/fileUpload'

export default function Dashboard() {
    const router = useRouter()
    const supabase = createClient()
    const [user, setUser] = useState(null)
    const [pdfs, setPdfs] = useState([])

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) throw error
                if (!session) {
                    router.push('/login')
                    return
                }

                console.log('✅ Logged in as:', session.user)
                setUser(session.user)
                fetchUserPdfs(session.user.id)
            } catch (err) {
                console.error('❌ Session error:', err)
            }
        }
        checkSession()
    }, [router, supabase])

    // Fetch PDFs for this user
    const fetchUserPdfs = async (userId) => {
        console.log('📂 Fetching PDFs for user:', userId)
        const { data, error } = await supabase
            .from('pdf_files')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Error fetching PDFs:', error)
            return
        }

        console.log('✅ PDFs fetched:', data)
        setPdfs(data)
    }

    if (!user) return <p>Loading dashboard...</p>

    return (
        <div className="min-h-screen bg-white text-black">
            <Navbar user={user} />
            <main className="p-8 max-w-4xl mx-auto">
                {/* Upload Section */}
                <div className='flex justify-center mt-10'>
                    <FileUploader
                        user={user}
                        supabase={supabase}
                        onUploadSuccess={() => fetchUserPdfs(user.id)}
                    />
                </div>

                {/* PDF List */}
                <div className='flex justify-center'>
                    <div className="w-full max-w-3xl">
                        {pdfs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pdfs.map((pdf) => (
                                    <div
                                        key={pdf.id}
                                        className="border border-gray-300 rounded-xl p-5 flex items-center justify-between bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                        onClick={() => router.push(`/chat/${pdf.id}`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                            <span className="font-semibold text-gray-900">{pdf.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">
                                                {new Date(pdf.created_at).toLocaleDateString()}
                                            </span>
                                            <ArrowRight className="text-gray-600 w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center mt-10">
                                No PDFs uploaded yet.
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
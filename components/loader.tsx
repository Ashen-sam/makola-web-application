"use client"

import { Loader2 } from "lucide-react"

export default function Loader() {
    return (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        </div>
    )
}

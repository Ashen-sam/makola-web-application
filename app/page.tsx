"use client"
import { useRouter } from "next/navigation"
import LandingLayout from "../components/landing-layout"
import LandingPage from "../components/landing-page"

export default function HomePage() {
  const router = useRouter()

  const handleLoginClick = () => {
    router.push("/login")
  }

  const handleTryNow = () => {
    router.push("/register")
  }

  return (
    <LandingLayout onLoginClick={handleLoginClick}>
      <LandingPage onTryNow={handleTryNow} />
    </LandingLayout>
  )
}

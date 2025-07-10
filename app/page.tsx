"use client"
import { useRouter } from "next/navigation"
import LandingLayout from "../components/landing-layout"
import LandingPage from "../components/landing-page"

export default function HomePage() {
  const router = useRouter()

  const handleLoginClick = () => {
    router.push("/auth/login")
  }

  const handleTryNow = () => {
    router.push("/auth/register")
  }

  return (
    <LandingLayout onLoginClick={handleLoginClick}>
      <LandingPage onTryNow={handleTryNow} />
    </LandingLayout>
  )
}

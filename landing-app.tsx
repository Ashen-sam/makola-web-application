// "use client"

// import { useState } from "react"
// import LandingLayout from "./components/landing-layout"
// import AuthPage from "./auth-page"
// import LandingPage from "./components/landing-page"

// interface LandingAppProps {
//   onLogin: (role: "user" | "admin") => void
// }

// export default function LandingApp({ onLogin }: LandingAppProps) {
//   const [currentView, setCurrentView] = useState<"landing" | "auth">("landing")

//   const handleLoginClick = () => {
//     setCurrentView("auth")
//   }

//   const handleTryNow = () => {
//     setCurrentView("auth")
//   }

//   const handleAuthLogin = (role: "user" | "admin") => {
//     console.log(`Authentication successful for role: ${role}`)
//     // Pass the login up to the main app
//     onLogin(role)
//   }

//   if (currentView === "auth") {
//     return <AuthPage onLogin={handleAuthLogin} />
//   }

//   return (
//     <LandingLayout onLoginClick={handleLoginClick}>
//       <LandingPage onTryNow={handleTryNow} />
//     </LandingLayout>
//   )
// }

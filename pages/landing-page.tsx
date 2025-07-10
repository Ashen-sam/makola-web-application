"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  MessageCircle,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPinIcon,
} from "lucide-react"
import Image from "next/image"

interface LandingPageProps {
  onTryNow: () => void
}

export default function LandingPage({ onTryNow }: LandingPageProps) {
  const features = [
    {
      icon: AlertTriangle,
      title: "Report Issues",
      description: "Easily report community issues with photos, location, and detailed descriptions.",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      icon: Users,
      title: "Community Engagement",
      description: "Connect with neighbors, vote on issues, and collaborate on solutions.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor the status of reported issues from submission to resolution.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: Shield,
      title: "Admin Management",
      description: "Comprehensive admin tools for managing users, issues, and community oversight.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const stats = [
    { number: "1,247", label: "Active Users", icon: Users },
    { number: "339", label: "Issues Reported", icon: AlertTriangle },
    { number: "220", label: "Issues Resolved", icon: CheckCircle },
    { number: "89%", label: "Success Rate", icon: TrendingUp },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Community Member",
      content:
        "This platform has transformed how our community addresses local issues. It's so easy to report problems and see real progress!",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
    },
    {
      name: "David Wilson",
      role: "Local Resident",
      content:
        "Finally, a way to make our voices heard! The admin response time is excellent, and issues actually get resolved.",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
    },
    {
      name: "Emma Davis",
      role: "Community Leader",
      content: "The analytics and tracking features help us understand community needs better. Highly recommended!",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
    },
  ]

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section id="home" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Building Stronger
                  <span className="text-emerald-600"> Communities</span>
                  <br />
                  Together
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Report community issues, track progress, and collaborate with neighbors to create positive change in
                  Makola. Your voice matters, and together we can build a better community.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onTryNow}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-8 py-4 text-lg bg-transparent"
                  onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Learn More
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="text-center">
                      <Icon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">{stat.number}</p>
                      <p className="text-sm text-slate-600">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hero Image/Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Mock Issue Card */}
                  <Card className="bg-white shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-600 p-2 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">Street Light Broken</h3>
                          <p className="text-sm text-slate-600">Main Road, Makola</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">HIGH</span>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">IN PROGRESS</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mock Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">89</p>
                      <p className="text-xs text-slate-600">Resolved</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">23</p>
                      <p className="text-xs text-slate-600">In Progress</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <Users className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">1.2K</p>
                      <p className="text-xs text-slate-600">Users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Community Management
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our platform provides comprehensive tools for reporting, tracking, and resolving community issues
              efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">About Makola Community Platform</h2>
              <div className="space-y-4 text-slate-600">
                <p className="text-lg">
                  The Makola Community Platform was created to bridge the gap between community members and local
                  authorities, making it easier than ever to report, track, and resolve local issues.
                </p>
                <p>
                  Our mission is to empower communities by providing a transparent, efficient, and user-friendly
                  platform where every voice can be heard and every issue can be addressed promptly.
                </p>
                <p>
                  With features like real-time tracking, community voting, and comprehensive analytics, we&#39;re building
                  stronger, more connected communities across Sri Lanka.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">2024</div>
                  <div className="text-sm text-slate-600">Founded</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">1K+</div>
                  <div className="text-sm text-slate-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">89%</div>
                  <div className="text-sm text-slate-600">Resolution Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">24/7</div>
                  <div className="text-sm text-slate-600">Support</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Community collaboration"
                className="rounded-2xl shadow-2xl"
                width={600}
                height={500}
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Community Driven</p>
                    <p className="text-sm text-slate-600">Built by the community, for the community</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Community Says</h2>
            <p className="text-xl text-slate-600">Real feedback from real community members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full"
                      width={600}
                      height={500}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Try Now Section */}
      <section id="try-now" className="py-20 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make a Difference in Your Community?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of community members who are already using our platform to create positive change. Start
            reporting issues and tracking progress today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onTryNow}
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 text-lg bg-transparent"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Get in Touch</h2>
            <p className="text-xl text-slate-600">Have questions? We&#39;d love to hear from you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Send us a Message</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Tell us more about your inquiry..." className="min-h-[120px]" />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Send Message</Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <MapPinIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Address</h4>
                      <p className="text-slate-600">123 Makola Street, Colombo 11, Sri Lanka</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Phone</h4>
                      <p className="text-slate-600">+94 11 234 5678</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Email</h4>
                      <p className="text-slate-600">info@makola.community</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Office Hours</h4>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Response */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-slate-900 mb-2">Quick Response</h4>
                  <p className="text-slate-600 text-sm">
                    We typically respond to all inquiries within 24 hours. For urgent community issues, please use our
                    platform directly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { BarChart3, MapPin, CheckCircle, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react"

export default function Analytics() {
  // Simplified area data - easy to understand
  const areaData = [
    { area: "Main Road", resolved: 32, pending: 13, total: 45 },
    { area: "School Lane", resolved: 28, pending: 10, total: 38 },
    { area: "Market Street", resolved: 35, pending: 17, total: 52 },
    { area: "Residential A", resolved: 22, pending: 7, total: 29 },
    { area: "Residential B", resolved: 20, pending: 14, total: 34 },
    { area: "Industrial Zone", resolved: 30, pending: 11, total: 41 },
  ]

  // Simple issue types
  const issueTypes = [
    { name: "Roads", count: 89, color: "#ef4444" },
    { name: "Lighting", count: 67, color: "#f97316" },
    { name: "Garbage", count: 45, color: "#eab308" },
    { name: "Water", count: 38, color: "#22c55e" },
    { name: "Safety", count: 29, color: "#3b82f6" },
    { name: "Other", count: 71, color: "#6b7280" },
  ]

  // Overall statistics
  const totalIssues = 339
  const resolvedIssues = 167
  const pendingIssues = 172
  const resolutionRate = Math.round((resolvedIssues / totalIssues) * 100)

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 p-3 rounded-lg">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Overview</h1>
          <p className="text-slate-600">Simple view of issues in Makola areas</p>
        </div>
      </div>

      {/* Big Numbers - Easy to understand */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-900 mb-1">{totalIssues}</p>
            <p className="text-sm text-slate-600">Total Issues</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-green-600 mb-1">{resolvedIssues}</p>
            <p className="text-sm text-slate-600">Fixed</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-orange-600 mb-1">{pendingIssues}</p>
            <p className="text-sm text-slate-600">Not Fixed Yet</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-emerald-600 mb-1">{resolutionRate}%</p>
            <p className="text-sm text-slate-600">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Simple Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Areas Chart - Simple Bar Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <MapPin className="h-5 w-5" />
              Issues by Area
            </CardTitle>
            <p className="text-sm text-slate-600">Green = Fixed, Orange = Not Fixed Yet</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value, name) => [value, name === "resolved" ? "Fixed" : "Not Fixed Yet"]} />
                <Bar dataKey="resolved" fill="#10b981" name="Fixed" />
                <Bar dataKey="pending" fill="#f59e0b" name="Not Fixed Yet" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issue Types - Simple Pie Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5" />
              Types of Issues
            </CardTitle>
            <p className="text-sm text-slate-600">What problems people report most</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {issueTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Issues"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Area Details - Simple Cards */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">How Each Area is Doing</CardTitle>
          <p className="text-slate-600">See which areas have the most fixed issues</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaData.map((area, index) => {
              const successRate = Math.round((area.resolved / area.total) * 100)
              const isGood = successRate >= 70
              const isOkay = successRate >= 50

              return (
                <div key={index} className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{area.area}</h3>
                    <Badge
                      className={`${
                        isGood
                          ? "bg-green-100 text-green-800 border-green-200"
                          : isOkay
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {successRate}% Fixed
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">
                        {area.resolved} of {area.total} fixed
                      </span>
                    </div>
                    <Progress value={successRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-green-100 rounded p-2">
                      <p className="text-lg font-bold text-green-700">{area.resolved}</p>
                      <p className="text-xs text-green-600">Fixed</p>
                    </div>
                    <div className="bg-orange-100 rounded p-2">
                      <p className="text-lg font-bold text-orange-700">{area.pending}</p>
                      <p className="text-xs text-orange-600">Pending</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Simple Summary */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-900">Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-700">School Lane</p>
              <p className="text-sm text-emerald-600">Best performing area</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">Roads</p>
              <p className="text-sm text-emerald-600">Most reported issue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{resolutionRate}%</p>
              <p className="text-sm text-emerald-600">Overall success rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

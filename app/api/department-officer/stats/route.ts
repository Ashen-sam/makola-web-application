import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Department Officer Dashboard Stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');

    if (!user_id || role !== 'department_officer') {
      return NextResponse.json(
        { error: 'Unauthorized. Department officer access only.' },
        { status: 403 }
      );
    }

    // Get department officer details
    const { data: officer, error: officerError } = await supabase
      .from('department_officers')
      .select('department_name')
      .eq('user_id', user_id)
      .single();

    if (officerError || !officer) {
      return NextResponse.json(
        { error: 'Department officer not found' },
        { status: 404 }
      );
    }

    const departmentName = officer.department_name;

    // Get all stats in parallel for better performance
    const [
      totalIssuesResult,
      resolvedIssuesResult,
      inProgressIssuesResult,
      newIssuesTodayResult
    ] = await Promise.all([
      // Total Issues Assigned Count
      supabase
        .from('issues')
        .select('issue_id')
        .eq('assigned_department', departmentName),

      // Resolved Issues Count  
      supabase
        .from('issues')
        .select('issue_id')
        .eq('assigned_department', departmentName)
        .eq('status', 'resolved'),

      // In-Progress Issues Count
      supabase
        .from('issues')
        .select('issue_id')
        .eq('assigned_department', departmentName)
        .eq('status', 'in_progress'),

      // New Issues Today Count
      supabase
        .from('issues')
        .select('issue_id')
        .eq('assigned_department', departmentName)
        .gte('created_date', new Date().toISOString().split('T')[0])
    ]);

    // Calculate counts
    const totalIssuesCount = totalIssuesResult.data?.length || 0;
    const resolvedIssuesCount = resolvedIssuesResult.data?.length || 0;
    const inProgressIssuesCount = inProgressIssuesResult.data?.length || 0;
    const newIssuesTodayCount = newIssuesTodayResult.data?.length || 0;

    // Calculate Resolution Rate (%)
    const resolutionRate = totalIssuesCount > 0 
      ? Math.round((resolvedIssuesCount / totalIssuesCount) * 100) 
      : 0;

    return NextResponse.json({
      department: departmentName,
      stats: {
        totalIssuesAssigned: totalIssuesCount,
        resolvedIssues: resolvedIssuesCount,
        inProgressIssues: inProgressIssuesCount,
        newIssuesToday: newIssuesTodayCount,
        resolutionRate: resolutionRate
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Department officer stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { DateTime } from 'luxon';

function formatToLocalTime(utcDateStr: string): string {
  return DateTime.fromISO(utcDateStr, { zone: "utc" })
    .setZone("Asia/Colombo")
    .toFormat("yyyy-MM-dd HH:mm:ss");
}

export async function GET(request: NextRequest) {
  try {
    // Get all issues
    const { data: allIssues, error: allIssuesError } = await supabase
      .from('issues')
      .select('issue_id, status, priority, created_date');

    if (allIssuesError) {
      return NextResponse.json({ error: 'Failed to fetch issue data' }, { status: 500 });
    }

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Issue statistics
    const totalIssues = allIssues?.length || 0;
    const openIssues = allIssues?.filter(i => i.status === 'open').length || 0;
    const inProgressIssues = allIssues?.filter(i => i.status === 'in_progress').length || 0;
    const resolvedIssues = allIssues?.filter(i => i.status === 'resolved').length || 0;
    const highPriorityIssues = allIssues?.filter(i => i.priority === 'high').length || 0;

    // Today's resolved issues
    const todayResolvedIssues = allIssues?.filter(i => 
      i.status === 'resolved' && 
      new Date(i.created_date) >= todayStart
    ).length || 0;

    // Recent 5 issues with details
    const { data: recentIssues, error: recentError } = await supabase
      .from('issues')
      .select(`
        issue_id,
        title,
        priority,
        created_date,
        location,
        users (username),
        residents (name)
      `)
      .order('created_date', { ascending: false })
      .limit(5);

    let recentIssueDetails: any = [];
    if (!recentError && recentIssues) {
      recentIssueDetails = recentIssues.map(issue => ({
        issue_id: issue.issue_id,
        title: issue.title,
        priority: issue.priority,
        created_date: formatToLocalTime(issue.created_date),
        location: issue.location,
        // created_by: issue.residents?.[0]?.name || issue.users?.username || 'Unknown'
        created_by: issue.residents?.[0]?.name || issue.users?.[0]?.username || 'Unknown'
      }));
    }

    const statistics = {
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      highPriorityIssues,
      todayResolvedIssues,
      recentIssues: recentIssueDetails
    };

    return NextResponse.json({
      statistics,
      timestamp: new Date().toISOString(),
      message: 'Issue statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get issue statistics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
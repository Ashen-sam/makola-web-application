import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Get all issues for admin dashboard with analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const sort = searchParams.get('sort') || 'created_date';
    const order = searchParams.get('order') || 'desc';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('issues')
      .select(`
        *,
        residents (
          name,
          address,
          phone_number,
          nic
        )
      `)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);

    const { data: issues, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('issues')
      .select('status, category, priority')
      .then(result => {
        if (result.error) return { data: null, error: result.error };
        
        const statusCounts = result.data.reduce((acc: any, issue) => {
          acc[issue.status] = (acc[issue.status] || 0) + 1;
          return acc;
        }, {});

        const categoryCounts = result.data.reduce((acc: any, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        }, {});

        const priorityCounts = result.data.reduce((acc: any, issue) => {
          acc[issue.priority] = (acc[issue.priority] || 0) + 1;
          return acc;
        }, {});

        return {
          data: {
            statusCounts,
            categoryCounts,
            priorityCounts,
            total: result.data.length
          },
          error: null
        };
      });

    if (analyticsError) {
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('issues')
      .select('*', { count: 'exact', head: true });

    if (status) countQuery = countQuery.eq('status', status);
    if (category) countQuery = countQuery.eq('category', category);
    if (priority) countQuery = countQuery.eq('priority', priority);

    const { count } = await countQuery;

    return NextResponse.json({
      issues,
      analytics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Admin get issues error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Bulk update issues status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { issue_ids, status, priority, role } = await request.json();

    if (role !== 'urban_councilor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!issue_ids || !Array.isArray(issue_ids) || issue_ids.length === 0) {
      return NextResponse.json({ error: 'Issue IDs are required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const { data: updatedIssues, error } = await supabase
      .from('issues')
      .update(updateData)
      .in('issue_id', issue_ids)
      .select('issue_id, status, priority');

    if (error) {
      return NextResponse.json({ error: 'Failed to update issues' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Issues updated successfully',
      updated_count: updatedIssues.length
    });

  } catch (error) {
    console.error('Admin bulk update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Bulk delete issues (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { issue_ids, role } = await request.json();

    if (role !== 'urban_councilor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!issue_ids || !Array.isArray(issue_ids) || issue_ids.length === 0) {
      return NextResponse.json({ error: 'Issue IDs are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('issues')
      .delete()
      .in('issue_id', issue_ids);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete issues' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Issues deleted successfully',
      deleted_count: issue_ids.length
    });

  } catch (error) {
    console.error('Admin bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
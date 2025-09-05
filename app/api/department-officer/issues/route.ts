           
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Get all assigned issues for department officer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // optional filter
    const priority = searchParams.get('priority'); // optional filter

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

    // Build query
    let query = supabase
      .from('issues')
      .select(`
        issue_id,
        title,
        photos,
        category,
        description,
        status,
        priority,
        created_date,
        vote_count,
        location,
        latitude,
        longitude,
        date_observed,
        time_observed,
        user_id,
        resident_id,
        assigned_department,
        residents (
          name,
          address,
          phone_number,
          nic
        )
      `)
      .eq('assigned_department', departmentName)
      .order('created_date', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: issues, error: issuesError } = await query;

    if (issuesError) {
      return NextResponse.json(
        { error: 'Failed to fetch assigned issues' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('issues')
      .select('issue_id', { count: 'exact', head: true })
      .eq('assigned_department', departmentName);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    
    if (priority) {
      countQuery = countQuery.eq('priority', priority);
    }

    const { count: totalCount } = await countQuery;

    // Get comment counts for each issue
    const issuesWithComments = await Promise.all(
      (issues || []).map(async (issue) => {
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('comment_id')
          .eq('issue_id', issue.issue_id);

        return {
          ...issue,
          comment_count: commentsError ? 0 : (comments?.length || 0)
        };
      })
    );

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      issues: issuesWithComments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      },
      department: departmentName,
      filters: {
        status: status || 'all',
        priority: priority || 'all'
      }
    });

  } catch (error) {
    console.error('Department officer assigned issues error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
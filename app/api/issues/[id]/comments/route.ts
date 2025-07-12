import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Get all comments for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (
          username,
          role
        )
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a comment to an issue
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    const { content, user_id } = await request.json();

    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    if (!content || !user_id) {
      return NextResponse.json(
        { error: 'Content and user_id are required' },
        { status: 400 }
      );
    }

    // Check if issue exists
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('issue_id')
      .eq('issue_id', issueId)
      .single();

    if (issueError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        content,
        user_id,
        issue_id: issueId
      })
      .select(`
        *,
        users (
          username,
          role
        )
      `)
      .single();

    if (commentError) {
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Comment added successfully',
      comment
    }, { status: 201 });

  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a comment (only by the user who created it or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    const { comment_id, user_id, role } = await request.json();

    if (isNaN(issueId) || !comment_id) {
      return NextResponse.json({ error: 'Invalid issue ID or comment ID' }, { status: 400 });
    }

    // Get the comment to check ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('comment_id', comment_id)
      .eq('issue_id', issueId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check authorization
    if (role !== 'urban_councilor' && comment.user_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('comment_id', comment_id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
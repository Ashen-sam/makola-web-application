import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// POST - Vote on an issue (increment vote count)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    const { user_id, action } = await request.json(); // action: 'upvote' or 'downvote'

    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if issue exists
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('issue_id, vote_count')
      .eq('issue_id', issueId)
      .single();

    if (issueError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Increment/decrement vote count
    let newVoteCount = issue.vote_count;
    
    if (action === 'upvote') {
      newVoteCount += 1;
    } else if (action === 'downvote' && newVoteCount > 0) {
      newVoteCount -= 1;
    } else {
      return NextResponse.json({ error: 'Invalid vote action' }, { status: 400 });
    }

    const { data: updatedIssue, error: updateError } = await supabase
      .from('issues')
      .update({ vote_count: newVoteCount })
      .eq('issue_id', issueId)
      .select('issue_id, vote_count')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update vote count' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Vote recorded successfully',
      vote_count: updatedIssue.vote_count
    });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
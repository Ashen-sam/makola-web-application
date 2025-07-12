import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// PUT - Edit comment (only the resident who created it can edit)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    
    // Extract ID from URL as fallback
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const idFromPath = pathSegments[pathSegments.length - 1];
    
    const id = parseInt(params.id || idFromPath);
    const { content, user_id, role } = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    if (!content || !user_id || !role) {
      return NextResponse.json(
        { error: 'Content, user_id, and role are required' },
        { status: 400 }
      );
    }

    // Only residents can edit comments
    if (role !== 'resident') {
      return NextResponse.json({ error: 'Only residents can edit comments' }, { status: 403 });
    }

    // Get the comment to check ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('comment_id', id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if the user owns this comment
    if (comment.user_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized to edit this comment' }, { status: 403 });
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ content })
      .eq('comment_id', id)
      .select(`
        *,
        users (
          username,
          role
        )
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });

  } catch (error) {
    console.error('Edit comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete comment (resident can delete their own, urban_councilor can delete any)
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    
    // Extract ID from URL as fallback
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const idFromPath = pathSegments[pathSegments.length - 1];
    
    const id = parseInt(params.id || idFromPath);
    const { user_id, role } = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    if (!user_id || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Get the comment to check ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('comment_id', id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check authorization
    let canDelete = false;
    
    if (role === 'urban_councilor') {
      canDelete = true;
    } else if (role === 'resident' && comment.user_id === user_id) {
      canDelete = true;
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('comment_id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
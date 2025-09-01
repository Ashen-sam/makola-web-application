import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSocketIO } from '@/lib/socketService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const issueId = parseInt(resolvedParams.id);
    
    const { status, user_id, role } = await request.json();

    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Only admin can change status
    if (role !== 'urban_councilor') {
      return NextResponse.json(
        { error: 'Only urban councilors can change issue status' },
        { status: 403 }
      );
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get current issue details
    const { data: currentIssue, error: currentIssueError } = await supabase
      .from('issues')
      .select(`
        issue_id, title, status, user_id, resident_id, assigned_department,
        users (username),
        residents (name)
      `)
      .eq('issue_id', issueId)
      .single();

    if (currentIssueError || !currentIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update the issue status
    const { data: updatedIssue, error: updateError } = await supabase
      .from('issues')
      .update({ status })
      .eq('issue_id', issueId)
      .select(`
        issue_id, title, photos, category, description, status, priority,
        created_date, vote_count, location, latitude, longitude,
        date_observed, time_observed, user_id, resident_id, assigned_department,
        residents (name, address, phone_number)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update issue status' }, { status: 500 });
    }

    // Create notification for the user who posted the issue
    if (currentIssue.user_id) {
      const notificationMessage = `Your issue "${currentIssue.title}" status has been changed to "${status}".`;
      
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({ message: notificationMessage })
        .select('notification_id')
        .single();

      if (!notificationError && notification) {
        await supabase
          .from('user_notifications')
          .insert({
            user_id: currentIssue.user_id,
            notification_id: notification.notification_id,
            read_status: false
          });
      }
    }

    // Socket.IO events
    const socketIO = getSocketIO();
    if (socketIO) {
      socketIO.emit('issueStatusChanged', {
        issueId: issueId,
        newStatus: status,
        issue: updatedIssue,
        timestamp: new Date().toISOString()
      });

      // Notify the issue creator
      if (currentIssue.user_id) {
        socketIO.to(`user_${currentIssue.user_id}`).emit('issueStatusUpdate', {
          issueId: issueId,
          newStatus: status,
          title: currentIssue.title,
          message: `Your issue "${currentIssue.title}" status has been changed to "${status}".`
        });
      }

      // Notify assigned department if exists
      if (currentIssue.assigned_department) {
        const { data: deptOfficers } = await supabase
          .from('department_officers')
          .select('user_id')
          .eq('department_name', currentIssue.assigned_department);

        deptOfficers?.forEach(officer => {
          socketIO.to(`user_${officer.user_id}`).emit('assignedIssueStatusUpdate', {
            issueId: issueId,
            newStatus: status,
            title: currentIssue.title,
            department: currentIssue.assigned_department
          });
        });
      }
    }

    return NextResponse.json({
      message: 'Issue status updated successfully',
      issue: updatedIssue,
      previousStatus: currentIssue.status,
      newStatus: status
    });

  } catch (error) {
    console.error('Status change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
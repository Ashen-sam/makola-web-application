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

    // Only department officers can use this endpoint
    if (role !== 'department_officer') {
      return NextResponse.json(
        { error: 'Only department officers can change issue status' },
        { status: 403 }
      );
    }

    // Department officers can only set status to 'in_progress' or 'resolved'
    const allowedStatuses = ['in_progress', 'resolved'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Department officers can only set status to "in_progress" or "resolved"' },
        { status: 400 }
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

    // Get current issue details and verify assignment
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

    // Check if issue is assigned to officer's department
    if (currentIssue.assigned_department !== officer.department_name) {
      return NextResponse.json(
        { error: 'Issue is not assigned to your department' },
        { status: 403 }
      );
    }

    // Prevent setting same status
    if (currentIssue.status === status) {
      return NextResponse.json(
        { error: `Issue is already ${status}` },
        { status: 400 }
      );
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
      console.error('Issue update error:', updateError);
      return NextResponse.json({ error: 'Failed to update issue status' }, { status: 500 });
    }

    // Create notification for the user who posted the issue
    if (currentIssue.user_id) {
      const notificationMessage = `Your issue "${currentIssue.title}" has been updated to "${status}" by ${officer.department_name}.`;
      
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

    // Also notify urban councilors about status changes
    const { data: councilors, error: councilorError } = await supabase
      .from('users')
      .select('user_id')
      .eq('role', 'urban_councilor');

    if (!councilorError && councilors) {
      const councilorNotificationMessage = `Issue "${currentIssue.title}" status changed to "${status}" by ${officer.department_name}.`;
      
      const { data: councilorNotification, error: councilorNotificationError } = await supabase
        .from('notifications')
        .insert({ message: councilorNotificationMessage })
        .select('notification_id')
        .single();

      if (!councilorNotificationError && councilorNotification) {
        const councilorUserNotifications = councilors.map(councilor => ({
          user_id: councilor.user_id,
          notification_id: councilorNotification.notification_id,
          read_status: false
        }));

        await supabase
          .from('user_notifications')
          .insert(councilorUserNotifications);
      }
    }

    // Socket.IO events for real-time updates
    try {
      // Initialize Socket.IO if not already done
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/socket/io`);
    } catch (socketInitError) {
      console.log('Socket.IO initialization skipped');
    }

    const socketIO = getSocketIO();
    if (socketIO) {
      // Emit general status change event
      socketIO.emit('issueStatusChanged', {
        issueId: issueId,
        newStatus: status,
        issue: updatedIssue,
        updatedBy: 'department_officer',
        department: officer.department_name,
        timestamp: new Date().toISOString()
      });

      // Notify the issue creator
      if (currentIssue.user_id) {
        socketIO.to(`user_${currentIssue.user_id}`).emit('issueStatusUpdate', {
          issueId: issueId,
          newStatus: status,
          title: currentIssue.title,
          department: officer.department_name,
          message: `Your issue "${currentIssue.title}" has been updated to "${status}" by ${officer.department_name}.`
        });
      }

      // Notify urban councilors
      if (!councilorError && councilors) {
        councilors.forEach(councilor => {
          socketIO.to(`user_${councilor.user_id}`).emit('departmentIssueUpdate', {
            issueId: issueId,
            newStatus: status,
            title: currentIssue.title,
            department: officer.department_name,
            message: `Issue "${currentIssue.title}" status changed to "${status}" by ${officer.department_name}.`
          });
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Issue status updated successfully',
      issue: updatedIssue,
      previousStatus: currentIssue.status,
      newStatus: status,
      updatedBy: officer.department_name,
      department: officer.department_name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Department officer status change error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
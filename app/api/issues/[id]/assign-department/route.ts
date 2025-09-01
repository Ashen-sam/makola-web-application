// app/api/issues/[id]/assign-department/route.ts
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
    
    const { department_name, user_id, role } = await request.json();

    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Only admin can assign departments
    if (role !== 'urban_councilor') {
      return NextResponse.json(
        { error: 'Only urban councilors can assign departments' },
        { status: 403 }
      );
    }

    if (!department_name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if issue exists
    const { data: currentIssue, error: issueError } = await supabase
      .from('issues')
      .select('issue_id, title, status, assigned_department')
      .eq('issue_id', issueId)
      .single();

    if (issueError || !currentIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if department exists
    const { data: departmentOfficers, error: deptError } = await supabase
      .from('department_officers')
      .select('user_id, department_name')
      .eq('department_name', department_name);

    if (deptError || !departmentOfficers || departmentOfficers.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Update issue with assigned department
    const { data: updatedIssue, error: updateError } = await supabase
      .from('issues')
      .update({ 
        assigned_department: department_name,
        status: 'in_progress' // Auto change to in_progress when assigned
      })
      .eq('issue_id', issueId)
      .select(`
        issue_id, title, category, description, status, priority,
        location, assigned_department, created_date
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to assign department' }, { status: 500 });
    }

    // Create notifications for all officers in the department
    const notificationMessage = `New issue assigned to ${department_name}: "${currentIssue.title}"`;
    
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        message: notificationMessage,
      })
      .select('notification_id')
      .single();

    if (!notificationError && notification) {
      // Create notifications for all department officers
      const userNotifications = departmentOfficers.map(officer => ({
        user_id: officer.user_id,
        notification_id: notification.notification_id,
        read_status: false
      }));

      await supabase
        .from('user_notifications')
        .insert(userNotifications);
    }

    // Socket.IO notifications
    const socketIO = getSocketIO();
    if (socketIO) {
      // Notify all department officers
      departmentOfficers.forEach(officer => {
        socketIO.to(`user_${officer.user_id}`).emit('issueAssigned', {
          issueId: issueId,
          title: currentIssue.title,
          department: department_name,
          message: notificationMessage,
          timestamp: new Date().toISOString()
        });
      });

      // Broadcast to all admins
      socketIO.emit('departmentAssigned', {
        issueId: issueId,
        department: department_name,
        assignedBy: user_id,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'Department assigned successfully',
      issue: updatedIssue,
      assigned_department: department_name,
      notified_officers: departmentOfficers.length
    });

  } catch (error) {
    console.error('Assign department error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

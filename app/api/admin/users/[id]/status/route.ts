import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSocketIO } from '@/lib/socketService';

// Helper function to check admin permissions
async function checkAdminPermissions(userId: string, role: string) {
  if (role !== 'urban_councilor') {
    return { isAdmin: false, error: 'Only urban councilors can manage users' };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('user_id, role, status')
    .eq('user_id', userId)
    .eq('role', 'urban_councilor')
    .eq('status', 'active')
    .single();

  if (error || !user) {
    return { isAdmin: false, error: 'Admin user not found or inactive' };
  }

  return { isAdmin: true, error: null };
}

// PATCH - Change user status (suspend/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = parseInt(resolvedParams.id);
    
    const { status, admin_user_id, admin_role, reason } = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!admin_user_id || !admin_role) {
      return NextResponse.json(
        { error: 'Admin user ID and role are required' },
        { status: 400 }
      );
    }

    // Check admin permissions
    const { isAdmin, error: permissionError } = await checkAdminPermissions(admin_user_id, admin_role);
    if (!isAdmin) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Validate status
    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be active or suspended' }, { status: 400 });
    }

    // Get current user data
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select(`
        user_id,
        username,
        role,
        status,
        residents (
          resident_id,
          name
        ),
        department_officers (
          officer_id,
          department_name
        )
      `)
      .eq('user_id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow suspending urban councilors
    if (currentUser.role === 'urban_councilor') {
      return NextResponse.json({ error: 'Cannot change status of urban councilor accounts' }, { status: 403 });
    }

    // Don't allow changing to the same status
    if (currentUser.status === status) {
      return NextResponse.json(
        { error: `User is already ${status}` },
        { status: 400 }
      );
    }

    // Update user status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ status })
      .eq('user_id', userId)
      .select(`
        user_id,
        username,
        role,
        status,
        created_at
      `)
      .single();

    if (updateError) {
      console.error('Status update error:', updateError);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    // Create notification for the affected user
    const notificationMessage = status === 'suspended'
      ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`
      : 'Your account has been reactivated. You can now access all features.';

    // Create notification
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        message: notificationMessage,
      })
      .select("notification_id")
      .single();

    if (!notificationError && notification) {
      // Create user notification
      await supabase
        .from("user_notifications")
        .insert({
          user_id: userId,
          notification_id: notification.notification_id,
          read_status: false,
        });
    }

    // Initialize Socket.IO
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/socket/io`);
    } catch (socketInitError) {
      console.log('Socket.IO initialization skipped');
    }

    // Emit socket events for real-time updates
    const socketIO = getSocketIO();
    if (socketIO) {
      // Broadcast status change to all admins
      socketIO.emit("userStatusChanged", {
        userId: userId,
        username: currentUser.username,
        role: currentUser.role,
        previousStatus: currentUser.status,
        newStatus: status,
        reason: reason || null,
        changedBy: admin_user_id,
        timestamp: new Date().toISOString(),
      });

      // Send notification to the affected user
      socketIO.to(`user_${userId}`).emit("statusNotification", {
        newStatus: status,
        message: notificationMessage,
        reason: reason || null,
        timestamp: new Date().toISOString(),
      });

      // If user is being suspended, force disconnect them
      if (status === 'suspended') {
        socketIO.to(`user_${userId}`).emit("forceLogout", {
          reason: "Account suspended",
          message: notificationMessage,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Get profile name for response
    const profileName = currentUser.role === 'resident' 
      ? currentUser.residents?.[0]?.name 
      : currentUser.department_officers?.[0]?.department_name;

    return NextResponse.json({
      message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
      user: {
        user_id: updatedUser.user_id,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status,
        profile_name: profileName
      },
      previousStatus: currentUser.status,
      newStatus: status,
      reason: reason || null
    });

  } catch (error) {
    console.error('Status change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
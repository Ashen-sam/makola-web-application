import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, username, password, role, status')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Account is suspended' }, { status: 403 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Get role-specific profile data
    let userDetails = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      status: user.status
    };

    if (user.role === 'resident') {
      const { data: resident } = await supabase
        .from('residents')
        .select('resident_id, name, address, phone_number, nic')
        .eq('user_id', user.user_id)
        .single();

      if (resident) {
        userDetails = { ...userDetails, ...resident };
      }
    } else if (user.role === 'department_officer') {
      const { data: officer } = await supabase
        .from('department_officers')
        .select('officer_id, department_name, address, phone_number')
        .eq('user_id', user.user_id)
        .single();

      if (officer) {
        userDetails = { ...userDetails, ...officer };
      }
    } else if (user.role === 'urban_councilor') {
      // Urban councilor doesn't have additional profile data
      userDetails = { ...userDetails };
    }

    return NextResponse.json({
      message: 'Login successful',
      user: userDetails,
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
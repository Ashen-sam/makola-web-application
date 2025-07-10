import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, username, password, role')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let userDetails = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
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
    }

    return NextResponse.json(
      {
        message: 'Login successful',
        user: userDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
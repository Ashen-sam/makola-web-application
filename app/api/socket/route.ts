// Create this file: app/api/socket/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSocketIO, initSocketIO } from "@/lib/socketService";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const socket = getSocketIO();
        return NextResponse.json({
            socketInitialized: !!socket,
            clientCount: socket ? socket.engine?.clientsCount ?? 0 : 0,
            timestamp: new Date().toISOString(),
            message: socket ? 'Socket.IO is running' : 'Socket.IO not initialized'
        });

      case 'init':
        initSocketIO();
        return NextResponse.json({
          message: 'Socket.IO initialized',
          timestamp: new Date().toISOString()
        });

      case 'test':
        let testSocket = getSocketIO();
        if (!testSocket) {
          initSocketIO();
          testSocket = getSocketIO();
        }

        if (testSocket) {
          testSocket.emit('testEvent', {
            message: 'Socket.IO test successful',
            timestamp: new Date().toISOString()
          });
          
          return NextResponse.json({
            message: 'Test event emitted successfully',
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json({
            error: 'Socket.IO not available',
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          message: 'Socket.IO Management Endpoint',
          availableActions: ['status', 'init', 'test'],
          usage: {
            status: '/api/socket?action=status',
            init: '/api/socket?action=init',
            test: '/api/socket?action=test'
          },
          currentPort: process.env.PORT || '4000'
        });
    }
  } catch (error) {
    console.error('Socket endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
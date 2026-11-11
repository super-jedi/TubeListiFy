import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = req.nextUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || 'Access denied')}`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/auth/spotify/callback`;

  if (!clientId || !clientSecret) {
    // If not configured in environment, redirect with instructions
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(
        'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be configured in .env.local to complete OAuth callback.'
      )}`
    );
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const tokenRes = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Fetch user profile
    const userRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userRes.data;
    const displayName = encodeURIComponent(user.display_name || user.id);

    const response = NextResponse.redirect(
      `${origin}/?spotify_connected=true&spotify_token=${access_token}&spotify_user=${displayName}`
    );

    // Also set a secure HTTP-only cookie
    response.cookies.set('spotify_access_token', access_token, {
      maxAge: expires_in || 3600,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    const msg = err.response?.data?.error_description || err.message || 'Token exchange failed';
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(msg)}`);
  }
}

import React from 'react';

import { ReactComponent as IconLight } from '../assets/icon-light.svg';

const AUTH_URL =
  'https://accounts.spotify.com/authorize?client_id=82ba1125a54642d7944679a6e2a5b8d9&response_type=code&redirect_uri=https://emwil23.github.io/Willify&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state';

export default function Login() {
  return (
    <div className='login'>
      <IconLight className='login-icon' />
      <a className='login-btn' href={AUTH_URL}>
        Login with Spotify
      </a>
      <p className='login-text'>
        This app uses Spotify API , you must have an active premium membership
        to play tracks.
      </p>
    </div>
  );
}

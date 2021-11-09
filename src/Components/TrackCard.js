import React from 'react';

export default function TrackCard({ track, chooseTrack }) {
  const handlePlay = () => {
    chooseTrack(track);
  };

  return (
    <div
      className='trackCard'
      /* style={{
        display: 'flex',
        margin: '5px',
        alignItems: 'center',
        cursor: 'pointer',
      }} */
      onClick={handlePlay}
    >
      <img src={track.albumUrl} style={{ height: '120px', width: '120px' }} />
      <div className='trackCard__details'>
        <div className='trackCard-song'>{track.title}</div>
        <div className='trackCard-artist'>{track.artists}</div>
      </div>
    </div>
  );
}

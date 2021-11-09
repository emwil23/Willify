import React, { useState, useEffect } from 'react';
import useAuth from './useAuth';
import TrackCard from './TrackCard';
import SpotifyWebApi from 'spotify-web-api-node';
import Player from './Player';

const spotifyApi = new SpotifyWebApi({
  clientId: '82ba1125a54642d7944679a6e2a5b8d9',
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();

  const chooseTrack = (track) => {
    setPlayingTrack(track);
    // setSearch('');
  };

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);

    // spotifyApi.getMe().then((res) => console.log(res.body));
  }, [accessToken]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;

    let cancel = false;
    spotifyApi.searchTracks(search).then((res) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) => {
              if (smallest.height < image.height) return image;
              else return smallest;
            },
            track.album.images[0]
          );

          return {
            artists: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          };
        })
      );
    });
    return () => (cancel = true);
  }, [search, accessToken]);

  return (
    <div className='container__dashboard'>
      <div className='container__search'>
        <form className='form'>
          <input
            type='search'
            placeholder='Search songs'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className='form__input'
          />
        </form>
      </div>
      <div className='container__songs'>
        {searchResults.map((track) => (
          <TrackCard track={track} key={track.uri} chooseTrack={chooseTrack} />
        ))}
      </div>
      <div className='container__player'>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </div>
  );
}

/* 
 <button
          className='btn'
          onClick={() => {
            window.location.replace('https://accounts.spotify.com/logout');
          }}
        >
          Log OUt
        </button>
*/

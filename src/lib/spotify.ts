export interface FocusPlaylist {
  id: string;
  name: string;
  desc: string;
  color: string;
  embed: string;
  directUrl: string;
}

export const FOCUS_PLAYLISTS: FocusPlaylist[] = [
  {
    id: "lofi",
    name: "Lo-Fi Relajante",
    desc: "Vibes tranquilas para concentrarte",
    color: "#a855f7",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DWYoYGBbGKurt?utm_source=generator&theme=0",
    directUrl: "https://open.spotify.com/playlist/37i9dQZF1DWYoYGBbGKurt",
  },
  {
    id: "academia",
    name: "Dark Academia",
    desc: "Clásicos y ambient para estudiar",
    color: "#ec4899",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6?utm_source=generator&theme=0",
    directUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6",
  },
];

export const FOCUS_PLAYLIST_KEY = "deskly-focus-playlist";

export function getFocusPlaylist(id: string): FocusPlaylist {
  return FOCUS_PLAYLISTS.find((p) => p.id === id) || FOCUS_PLAYLISTS[0];
}
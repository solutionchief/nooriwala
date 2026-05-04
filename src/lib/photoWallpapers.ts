// 10 in-app photo wallpapers for chat background (CDN-hosted royalty-free).
export interface PhotoWallpaper { id: string; name: string; url: string; }

export const PHOTO_WALLPAPERS: PhotoWallpaper[] = [
  { id: 'beach',     name: 'Beach',          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70' },
  { id: 'bluesky',   name: 'Blue Sky',       url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=70' },
  { id: 'forest',    name: 'Green Forest',   url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=70' },
  { id: 'birds',     name: 'Birds',          url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=70' },
  { id: 'mountain',  name: 'Mountain',       url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=70' },
  { id: 'desert',    name: 'Desert',         url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=800&q=70' },
  { id: 'galaxy',    name: 'Galaxy',         url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=70' },
  { id: 'flowers',   name: 'Flowers',        url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=70' },
  { id: 'snow',      name: 'Snow',           url: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=70' },
  { id: 'sunset',    name: 'Sunset',         url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=70' },
];

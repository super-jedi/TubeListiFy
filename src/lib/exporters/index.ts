import { Track } from '../../types';

/**
 * Generates standard M3U / M3U8 playlist file content
 */
export function exportToM3U(tracks: Track[], playlistName: string = 'TubeListiFy Playlist'): string {
  const lines: string[] = ['#EXTM3U', `#PLAYLIST:${playlistName}`];

  for (const track of tracks) {
    const seconds = track.durationMs ? Math.round(track.durationMs / 1000) : -1;
    lines.push(`#EXTINF:${seconds},${track.artist} - ${track.title}`);
    if (track.externalUrl) {
      lines.push(track.externalUrl);
    } else if (track.spotifyUri) {
      lines.push(track.spotifyUri);
    } else if (track.youtubeVideoId) {
      lines.push(`https://www.youtube.com/watch?v=${track.youtubeVideoId}`);
    } else {
      lines.push(`${track.artist} - ${track.title}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generates CSV string of tracklist
 */
export function exportToCSV(tracks: Track[]): string {
  const headers = ['Track Number', 'Title', 'Artist', 'Album', 'Duration', 'Source', 'URL'];
  const rows = tracks.map((t, index) => {
    const fields = [
      index + 1,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.artist || '').replace(/"/g, '""')}"`,
      `"${(t.album || '').replace(/"/g, '""')}"`,
      `"${t.durationFormatted || ''}"`,
      `"${t.source}"`,
      `"${t.externalUrl || ''}"`,
    ];
    return fields.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates JSON string of tracklist
 */
export function exportToJSON(tracks: Track[], metadata: Record<string, any> = {}): string {
  const data = {
    exportedAt: new Date().toISOString(),
    generator: 'TubeListiFy',
    totalTracks: tracks.length,
    ...metadata,
    tracks,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Parse lines of text (e.g. pasted tracklist "Artist - Title" or "1. Artist - Title")
 */
export function parsePastedTracklist(rawText: string): Track[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tracks: Track[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove leading numbers like "1. ", "01 - ", "[1] "
    line = line.replace(/^\s*(?:\[\d+\]|\d+[\.\-\)]\s*)/, '').trim();

    // Split by dash or hyphen
    const dashSplit = line.split(/\s+[-–—]\s+/);
    let artist = 'Unknown Artist';
    let title = line;

    if (dashSplit.length >= 2) {
      artist = dashSplit[0].trim();
      title = dashSplit.slice(1).join(' - ').trim();
    }

    if (title) {
      tracks.push({
        id: `manual_${Date.now()}_${i}`,
        title,
        artist,
        source: 'billboard',
      });
    }
  }

  return tracks;
}

/**
 * Client-side file trigger helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

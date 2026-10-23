import {
  download,
  fileName,
  playlistAsCsv,
  playlistAsDocument,
  playlistAsText,
} from '@/lib/exporting'
import type { Track } from '@/lib/music'
import { Copy, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'

/** Copy as text, or save as a text file or CSV with Apple Music links. */
export function ExportButtons({ title, tracks }: { title: string; tracks: Track[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        onClick={() =>
          void navigator.clipboard
            .writeText(playlistAsText(tracks))
            .then(() => toast.success('Playlist copied as text'))
            .catch(() => toast.error('Copying was blocked by the browser'))
        }
      >
        <Copy /> Copy as text
      </Button>
      <Button
        size="sm"
        onClick={() =>
          download(fileName(title, 'txt'), playlistAsDocument(title, tracks), 'text/plain')
        }
      >
        <FileText /> Save .txt
      </Button>
      <Button
        size="sm"
        onClick={() => download(fileName(title, 'csv'), playlistAsCsv(tracks), 'text/csv')}
      >
        <FileSpreadsheet /> Save CSV
      </Button>
    </div>
  )
}

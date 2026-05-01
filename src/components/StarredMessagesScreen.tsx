import { ArrowLeft, Star, Image as ImageIcon, Film } from 'lucide-react';
import { useStarred } from '@/hooks/useStarred';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ChatList';

export default function StarredMessagesScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, toggleStar } = useStarred();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">Starred Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <Star className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No starred messages</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Long-press a message in any chat and tap the star to save it here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(it => (
              <li key={it.id} className="flex gap-3 px-4 py-3">
                <Avatar name={it.sender_name} avatarUrl={it.sender_avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">{it.sender_name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">in {it.conversation_name}</p>
                  <div className="mt-1 text-sm text-foreground break-words">
                    {it.content_type === 'image' && <span className="inline-flex items-center gap-1 text-muted-foreground"><ImageIcon className="h-3.5 w-3.5"/>Photo</span>}
                    {it.content_type === 'video' && <span className="inline-flex items-center gap-1 text-muted-foreground"><Film className="h-3.5 w-3.5"/>Video</span>}
                    {it.content_type === 'text' && (it.content || '')}
                  </div>
                </div>
                <button onClick={() => toggleStar(it.message_id, it.conversation_id)} className="self-start">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

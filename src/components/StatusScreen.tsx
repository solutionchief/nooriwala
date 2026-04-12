import { motion } from 'framer-motion';
import { Plus, Eye } from 'lucide-react';
import { Avatar } from '@/components/ChatList';
import type { Status } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface StatusScreenProps {
  statuses: Status[];
}

export default function StatusScreen({ statuses }: StatusScreenProps) {
  const grouped = statuses.reduce((acc, s) => {
    const key = s.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, Status[]>);

  return (
    <div className="flex flex-col px-4 py-4">
      {/* My Status */}
      <div className="mb-6">
        <button className="flex w-full items-center gap-3 rounded-xl bg-card p-4">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
              Y
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">My Status</p>
            <p className="text-sm text-muted-foreground">Tap to add status update</p>
          </div>
        </button>
      </div>

      {/* Recent updates */}
      {Object.keys(grouped).length > 0 && (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent updates</p>
          <div className="space-y-2">
            {Object.entries(grouped).map(([userId, userStatuses]) => {
              const latest = userStatuses[0];
              return (
                <motion.button
                  key={userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-card"
                >
                  <div className="relative">
                    <div className="rounded-full p-0.5" style={{ background: 'conic-gradient(hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)' }}>
                      <div className="rounded-full border-2 border-background">
                        <Avatar name={latest.user.display_name} isOnline={latest.user.is_online} />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{latest.user.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {latest.viewers.length}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      {Object.keys(grouped).length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">No recent updates</p>
          <p className="mt-1 text-sm text-muted-foreground">Status updates from your contacts will appear here</p>
        </div>
      )}
    </div>
  );
}

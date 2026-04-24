import { Bell, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { maskOrderRefsInText } from '@/lib/maskOrder';

const typeIcons: Record<string, string> = {
  info: '💡',
  sale: '🔥',
  order: '📦',
  alert: '⚠️',
};

const typeBadgeColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  sale: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  order: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  alert: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  if (!user) return null;

  const recent = notifications.slice(0, 5);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} new</span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              recent.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => setSelected(n)}
                >
                  <div className="flex gap-2">
                    <span className="text-base mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{maskOrderRefsInText(n.title)}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{maskOrderRefsInText(n.message)}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                          <Eye size={10} />
                          View
                        </span>
                      </div>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border">
              <button
                onClick={() => navigate('/notifications')}
                className="text-sm text-primary hover:underline w-full text-center font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeIcons[selected?.type || ''] || '🔔'}</span>
              <DialogTitle className="text-lg">{maskOrderRefsInText(selected?.title)}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadgeColors[selected?.type || ''] || 'bg-muted text-muted-foreground'}`}>
              {selected?.type}
            </span>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {maskOrderRefsInText(selected?.message)}
            </p>
            <p className="text-xs text-muted-foreground">
              {selected?.created_at && format(new Date(selected.created_at), 'PPpp')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;
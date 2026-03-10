import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Bell, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

const Notifications = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, loading } = useNotifications();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 min-h-screen max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-full bg-primary/10">
            <Bell size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll notify you about sales, orders, and updates
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border border-border p-4 transition-colors cursor-pointer hover:border-primary/30 ${
                  !n.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
                onClick={() => setSelected(n)}
              >
                <div className="flex gap-3">
                  <span className="text-xl mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadgeColors[n.type] || 'bg-muted text-muted-foreground'}`}>
                        {n.type}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                        <Eye size={14} />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeIcons[selected?.type || ''] || '🔔'}</span>
              <DialogTitle className="text-lg">{selected?.title}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadgeColors[selected?.type || ''] || 'bg-muted text-muted-foreground'}`}>
              {selected?.type}
            </span>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {selected?.message}
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

export default Notifications;
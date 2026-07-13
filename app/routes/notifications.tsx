import type { LoaderFunctionArgs } from 'react-router';
import type { Route } from "./+types/notifications";
import { Link } from "react-router";
import { useLoaderData } from 'react-router';
import { useState } from 'react';
import { Bell, Check, Trash2, Settings, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useNotifications } from "~/hooks/useNotifications";
import { Button } from "~/components/ui/Button";
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { serverNotifications: [] };
  const { data } = await supabase
    .from('alert_notifications')
    .select('id, kind, title, body, action_url, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  return { serverNotifications: data || [] };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Notificări - AutoFans.ro" },
  ];
}

export default function NotificationsPage() {
  const data = useLoaderData<typeof loader>();
  const { notifications: localNotifications, markAsRead: markLocalAsRead, markAllAsRead: markAllLocalAsRead, clearAll: clearLocal, handleNotificationClick } = useNotifications();
  const [serverNotifications, setServerNotifications] = useState(data.serverNotifications);
  const usingServerNotifications = serverNotifications.length > 0;
  const notifications: any[] = usingServerNotifications ? serverNotifications.map((notification) => ({
    id: String(notification.id),
    type: notification.kind === 'price_drop' ? 'warning' : 'info',
    title: notification.title,
    message: notification.body,
    actionUrl: notification.action_url,
    isRead: Boolean(notification.read_at),
    createdAt: new Date(notification.created_at),
  })) : localNotifications;
  const unreadCount = notifications.filter((notification: any) => !notification.isRead).length;

  const markAsRead = async (id: string) => {
    if (!usingServerNotifications) return markLocalAsRead(id);
    setServerNotifications((current) => current.map((notification) => notification.id === Number(id) ? { ...notification, read_at: new Date().toISOString() } : notification));
    const { error } = await getSupabaseBrowserClient().from('alert_notifications').update({ read_at: new Date().toISOString() }).eq('id', Number(id));
    if (error) console.warn('Could not mark alert as read:', error);
  };
  const markAllAsRead = async () => {
    if (!usingServerNotifications) return markAllLocalAsRead();
    const unreadIds = serverNotifications.filter((notification) => !notification.read_at).map((notification) => notification.id);
    setServerNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || new Date().toISOString() })));
    if (unreadIds.length) await getSupabaseBrowserClient().from('alert_notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
  };
  const clearAll = async () => {
    if (!usingServerNotifications) return clearLocal();
    const ids = serverNotifications.map((notification) => notification.id);
    setServerNotifications([]);
    if (ids.length) await getSupabaseBrowserClient().from('alert_notifications').delete().in('id', ids);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-accent-gold" />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-white/5 border-white/5";
    switch (type) {
      case 'success':
        return "bg-green-500/10 border-green-500/20";
      case 'warning':
        return "bg-yellow-500/10 border-yellow-500/20";
      case 'error':
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-accent-gold/10 border-accent-gold/20";
    }
  };

  return (
    <div className="min-h-screen bg-premium-gradient py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center">
              <Bell className="h-6 w-6 text-accent-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Notificări</h1>
              <p className="text-gray-400">
                {unreadCount > 0 ? `Ai ${unreadCount} notificări necitite` : "Nu ai nicio notificare nouă"}
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-gray-300 hover:text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marchează ca citite
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge tot
              </Button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-glass backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <Bell className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-white mb-2">Nu ai notificări</h2>
            <p className="text-gray-400">
              Când vei primi alerte despre mașini favorite sau actualizări de cont, vor apărea aici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${getBgColor(notification.type, notification.isRead)}`}
              >
                <div className="mt-1 shrink-0">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-semibold text-base ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString('ro-RO', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-300'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-3">
                    {notification.actionUrl && (
                      <Link 
                        to={notification.actionUrl}
                        onClick={() => handleNotificationClick(notification)}
                        className="text-sm font-semibold text-accent-gold hover:text-yellow-400 transition-colors"
                      >
                        {notification.actionLabel || "Vezi detalii"}
                      </Link>
                    )}
                    
                    {!notification.isRead && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Marchează ca citit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

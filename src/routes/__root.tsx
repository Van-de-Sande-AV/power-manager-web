import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Zap } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5 text-primary" />
            Power Manager
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
                <span className="text-muted-foreground">{session.user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="hover:text-primary">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

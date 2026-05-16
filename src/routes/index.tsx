import { createRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: '/dashboard' });
    throw redirect({ to: '/login' });
  },
});

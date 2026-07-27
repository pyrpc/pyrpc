import { api } from '@/lib/pyrpc';
import { Greeting } from './greeting';

export default async function Page() {
  await api.prefetch.greet('Ada');
  await api.prefetch.get_status(undefined);

  return (
    <api.HydrationBoundary state={api.dehydrate()}>
      <Greeting />
    </api.HydrationBoundary>
  );
}

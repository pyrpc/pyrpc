'use client';

import { api } from '@/lib/pyrpc';

export function Greeting() {
  const { data, isLoading } = api.greet.useQuery('Ada');
  const status = api.get_status.useQuery(undefined);
  const rename = api.set_display_name.useMutation();

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
      <h1>pyRPC × Next.js</h1>
      <p>{isLoading ? 'Loading greeting…' : data}</p>
      <p>
        Status:{' '}
        {status.isLoading
          ? '…'
          : `${status.data?.status} (${status.data?.version})`}
      </p>
      <button
        type="button"
        onClick={() => rename.mutate('Grace')}
        disabled={rename.isPending}
      >
        {rename.isPending ? 'Saving…' : 'Run mutation'}
      </button>
      {rename.data ? (
        <pre>{JSON.stringify(rename.data, null, 2)}</pre>
      ) : null}
    </div>
  );
}

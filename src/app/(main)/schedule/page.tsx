import { Topbar } from '@/components/layout/Topbar';

export default function SchedulePage() {
  return (
    <>
      <Topbar crumbs={['CrickScore', 'Fixtures']} />
      <div style={{ padding: '28px 32px' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          Fixtures
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>Coming soon — upcoming match schedule.</p>
      </div>
    </>
  );
}

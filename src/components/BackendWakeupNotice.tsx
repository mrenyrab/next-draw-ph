import { useEffect, useState } from 'react';

const WAKEUP_NOTICE_DELAY_MS = 2000;

export default function BackendWakeupNotice({
  testId,
}: {
  testId: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setVisible(true),
      WAKEUP_NOTICE_DELAY_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <small className="d-block fw-normal" aria-live="polite" data-testid={testId}>
      The free Render backend may take about 50 seconds to wake after
      inactivity. Please wait.
    </small>
  );
}

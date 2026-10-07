import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EventScanRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/scan-ticket?eventId=${id}`);
    }
  }, [id, router]);

  return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading Scanner...</span>
      </div>
    </div>
  );
}

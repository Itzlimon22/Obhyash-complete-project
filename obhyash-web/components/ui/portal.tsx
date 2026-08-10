import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer mount state update to avoid synchronous setState inside effect
    // (SSR hydration guard — must remain client-only, hence useEffect)
    queueMicrotask(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
};

export default Portal;

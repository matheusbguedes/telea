import { useUpdater } from '@/hooks/use-updater';
import { getVersion } from '@tauri-apps/api/app';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Loader, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

type Status = 'idle' | 'checking' | 'downloading';

const STATUS_CONFIG: Record<Status, { label: (v: string) => string; icon: React.ReactNode }> = {
  idle: {
    label: (v) => `v${v}`,
    icon: <Tag className="size-3" />,
  },
  checking: {
    label: () => 'Checking updates',
    icon: <Loader className="size-3 animate-spin" />,
  },
  downloading: {
    label: () => 'Downloading',
    icon: <Download className="size-3 animate-pulse" />,
  },
};

export function VersionBadge() {
  const { status } = useUpdater();
  const [version, setVersion] = useState('...');

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const config = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.idle;

  return (
    <div
      className="w-fit px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-purple-400/70 text-xs select-none cursor-default"
        >
          {config.label(version)}
          {config.icon}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
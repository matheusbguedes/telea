import { getVersion } from '@tauri-apps/api/app';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

export function VersionBadge() {
  const [version, setVersion] = useState('...');

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1
      }}
      className="w-fit px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20"
    >
      <span className="flex items-center gap-1.5 text-purple-400/70 text-xs select-none cursor-default">
        v{version}
        <Tag className="size-3" />
      </span>
    </motion.div>
  );
}
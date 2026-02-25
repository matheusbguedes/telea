import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';

export function VersionBadge() {
    const [version, setVersion] = useState('...');

    useEffect(() => {
        getVersion().then(setVersion);
    }, []);

    return (
        <div className="w-fit p-2 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <p className="text-purple-500 text-xs text-center">
                v {version}
            </p>
        </div>
    );
}
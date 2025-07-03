// src/components/ui/PageLoader.tsx
'use client';

import Image from 'next/image';
import { useLoading } from '@/context/LoadingContext';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function PageLoader({ logoUrl }: { logoUrl: string }) {
    const { isLoading, hideLoader } = useLoading();
    const pathname = usePathname();
    
    // Este efecto se ejecuta cada vez que la URL cambia,
    // lo que significa que la nueva página ha terminado de cargar.
    useEffect(() => {
        hideLoader();
    }, [pathname, hideLoader]);

    return (
        <div className={cn(
            "fixed inset-0 bg-white flex justify-center items-center z-[9999] transition-opacity duration-300 ease-in-out",
            isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <div className="flex flex-col items-center gap-4 text-center">
                <Image
                    src={logoUrl}
                    alt="Cargando..."
                    width={120}
                    height={120}
                    className="animate-pulse"
                    priority
                />
            </div>
        </div>
    );
}
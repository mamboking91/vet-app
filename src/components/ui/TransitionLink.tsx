// src/components/ui/TransitionLink.tsx
'use client';

import Link, { type LinkProps } from 'next/link';
import { useLoading } from '@/context/LoadingContext';
import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface TransitionLinkProps extends LinkProps {
    children: ReactNode;
    className?: string;
}

export default function TransitionLink({ children, href, ...props }: TransitionLinkProps) {
    const { showLoader } = useLoading();
    const pathname = usePathname();

    const handleClick = () => {
        // Solo mostramos el loader si la nueva ruta es diferente a la actual
        if (pathname !== href.toString()) {
            showLoader();
        }
    };

    return (
        <Link href={href} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
}
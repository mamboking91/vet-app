"use client";

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
    className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <Button
            onClick={handleLogout}
            variant="ghost"
            className={className}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
        </Button>
    );
}
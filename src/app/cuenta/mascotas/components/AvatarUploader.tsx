// src/app/cuenta/mascotas/[pacienteId]/AvatarUploader.tsx
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { updatePetAvatar } from "./actions";
import { Loader2 } from "lucide-react"; // Solo para el icono de carga

interface AvatarUploaderProps {
  pacienteId: string;
  currentAvatarUrl: string | null;
  petName: string;
}

export default function AvatarUploader({
  pacienteId,
  currentAvatarUrl,
  petName,
}: AvatarUploaderProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  // Chivato final: Se reinicia el estado de error si la URL cambia.
  useEffect(() => {
    setImageError(false);
  }, [currentAvatarUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecciona un archivo de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. El máximo es 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await updatePetAvatar(pacienteId, formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const fallbackText = petName ? petName.charAt(0).toUpperCase() : "?";

  return (
    <div>
      {/* Contenedor principal que se puede clickar */}
      <div
        onClick={() => !isPending && fileInputRef.current?.click()}
        style={{
          width: '128px',
          height: '128px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9', // Un gris muy claro
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden', // Importante para que la imagen no se salga del círculo
          position: 'relative',
        }}
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
        ) : currentAvatarUrl && !imageError ? (
          // Si hay URL y no hay error, muestra la imagen
          <img
            key={currentAvatarUrl} // Forzamos la recarga de la imagen
            src={currentAvatarUrl}
            alt={`Foto de ${petName}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            // Chivato Definitivo: Si este código se ejecuta, hay un problema con la URL o los permisos.
            onError={() => {
              console.error("Error al cargar la imagen desde la URL:", currentAvatarUrl);
              setImageError(true);
            }}
          />
        ) : (
          // Si no hay URL o si la imagen falló al cargar, muestra las iniciales
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#64748b' }}>
            {fallbackText}
          </span>
        )}
      </div>

      {/* Input de archivo, oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, image/webp"
        disabled={isPending}
      />
    </div>
  );
}
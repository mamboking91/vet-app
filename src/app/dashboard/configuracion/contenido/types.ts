// src/app/dashboard/configuracion/contenido/types.ts
export type BloquePagina = {
    id: string;
    pagina: string;
    tipo_bloque: 'heroe' | 'caracteristicas' | 'productos_destacados' | 'texto_con_imagen' | 'cta' | 'instagram' | string;
    orden: number;
    contenido: any; 
    created_at: string;
  };
  
export type ContenidoBoton = {
  texto: string;
  enlace: string;
  backgroundColor?: string;
  textColor?: string;
}
  
export type ContenidoHeroe = {
    titulo: string;
    subtitulo: string;
    tituloFontSize: string;
    subtituloFontSize: string;
    boton_principal: ContenidoBoton;
    boton_secundario: ContenidoBoton;
    backgroundType: 'color' | 'imagen';
    backgroundColor: string;
    backgroundImageUrl: string | null;
    backgroundPosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
    overlayOpacity: number;
  };
  
export type ContenidoCaracteristicaItem = {
      id: string;
      icono: string;
      titulo: string;
      descripcion: string;
  };
  
export type ContenidoCaracteristicas = {
      items: ContenidoCaracteristicaItem[];
  };
  
export type ContenidoProductosDestacados = {
      titulo: string;
  };
  
export type ContenidoTextoConImagen = {
      titulo: string;
      texto: string;
      imagenUrl: string;
      posicionImagen: 'izquierda' | 'derecha';
      boton?: ContenidoBoton;
  };
  
export type ContenidoCTA = {
      titulo: string;
      boton: ContenidoBoton;
  };

// --- INICIO DE LA CORRECCIÓN ---
export type ContenidoInstagramPost = {
  id: string; // ID temporal para el cliente
  imagenUrl: string;
  enlace: string;
  file?: File; // Solo para uso en el cliente
};

export type ContenidoInstagram = {
  titulo: string;
  posts: ContenidoInstagramPost[];
};
// --- FIN DE LA CORRECCIÓN ---
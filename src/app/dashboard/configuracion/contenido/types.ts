// src/app/dashboard/configuracion/contenido/types.ts

// Tipo base para cualquier bloque en la base de datos
export type BloquePagina = {
    id: string;
    pagina: string;
    tipo_bloque: 'heroe' | 'caracteristicas' | 'productos_destacados' | 'texto_con_imagen' | 'cta' | string;
    orden: number;
    contenido: any; 
    created_at: string;
  };
  
  // --- Tipos de Contenido para cada Bloque ---
  
  export type ContenidoBoton = {
    texto: string;
    enlace: string;
  }
  
  export type ContenidoHeroe = {
    titulo: string;
    subtitulo: string;
    boton_principal: ContenidoBoton;
    boton_secundario: ContenidoBoton;
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
      texto: string; // Almacenará HTML
      imagenUrl: string;
      posicionImagen: 'izquierda' | 'derecha';
      boton?: ContenidoBoton;
  };
  
  export type ContenidoCTA = {
      titulo: string; // Almacenará HTML
      boton: ContenidoBoton;
  };
  
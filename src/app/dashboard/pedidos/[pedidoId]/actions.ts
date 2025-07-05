// src/app/cuenta/pedidos/actions.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Obtiene un pedido específico para el cliente que ha iniciado sesión.
export async function getCustomerOrderById(orderId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // La consulta es similar a la del dashboard, pero con dos diferencias clave:
  // 1. Se asegura de que el pedido pertenezca al usuario que ha iniciado sesión.
  // 2. Se enlaza `items_pedido` con `producto_variantes` para obtener los detalles correctos.
  const { data: order, error } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      created_at,
      estado,
      total,
      direccion_envio,
      items_pedido (
        id,
        cantidad,
        precio_unitario,
        producto_variantes (
          id,
          nombre,
          productos_catalogo (
            id,
            imagenes
          )
        )
      )
    `
    )
    .eq('id', orderId)
    .eq('propietario_id', user.id) // ¡Importante! Comprobación de seguridad.
    .single()

  if (error) {
    console.error('Error fetching customer order:', error)
    throw new Error('Pedido no encontrado o no tienes permiso para verlo.')
  }

  return order
}

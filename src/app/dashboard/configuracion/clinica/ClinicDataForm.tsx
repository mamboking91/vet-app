// app/dashboard/configuracion/clinica/ClinicDataForm.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { actualizarDatosClinica } from '../actions'; // Ajusta la ruta si es necesario
import type { ClinicData } from './page'; // Importa el tipo desde la página contenedora

interface ClinicDataFormProps {
  initialData: ClinicData;
}

type FieldErrors = {
  [key in keyof Omit<ClinicData, 'id' | 'logo_url' | 'updated_at'>]?: string[] | undefined;
} & { logo_file?: string[] };


export default function ClinicDataForm({ initialData }: ClinicDataFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para los campos del formulario
  const [nombreClinica, setNombreClinica] = useState(initialData.nombre_clinica || '');
  const [direccion, setDireccion] = useState(initialData.direccion_completa || '');
  const [codigoPostal, setCodigoPostal] = useState(initialData.codigo_postal || '');
  const [ciudad, setCiudad] = useState(initialData.ciudad || '');
  const [provincia, setProvincia] = useState(initialData.provincia || '');
  const [pais, setPais] = useState(initialData.pais || '');
  const [telefono, setTelefono] = useState(initialData.telefono_principal || '');
  const [email, setEmail] = useState(initialData.email_contacto || '');
  const [nifCif, setNifCif] = useState(initialData.nif_cif || '');
  const [horarios, setHorarios] = useState(initialData.horarios_atencion || '');
  const [sitioWeb, setSitioWeb] = useState(initialData.sitio_web || '');

  const [currentLogoUrl, setCurrentLogoUrl] = useState(initialData.logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logo_url || null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    // Sincronizar con initialData si cambia (ej. después de guardar y que la página se recargue con nuevos props)
    setNombreClinica(initialData.nombre_clinica || '');
    setDireccion(initialData.direccion_completa || '');
    setCodigoPostal(initialData.codigo_postal || '');
    setCiudad(initialData.ciudad || '');
    setProvincia(initialData.provincia || '');
    setPais(initialData.pais || '');
    setTelefono(initialData.telefono_principal || '');
    setEmail(initialData.email_contacto || '');
    setNifCif(initialData.nif_cif || '');
    setHorarios(initialData.horarios_atencion || '');
    setSitioWeb(initialData.sitio_web || '');
    setCurrentLogoUrl(initialData.logo_url || null);
    setLogoPreview(initialData.logo_url || null);
    setLogoFile(null); // Resetear el archivo seleccionado
    setRemoveLogo(false); // Resetear la opción de eliminar logo
  }, [initialData]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setRemoveLogo(false); // Si se sube un nuevo logo, no queremos eliminarlo por defecto
    } else {
      setLogoFile(null);
      // Si se cancela la selección de archivo, volver al logo actual o a nada si no había
      setLogoPreview(currentLogoUrl || null); 
    }
  };

  // Limpiar el object URL para evitar memory leaks
  useEffect(() => {
    let objectUrl: string | null = null;
    if (logoFile && logoPreview && logoPreview.startsWith('blob:')) {
      objectUrl = logoPreview;
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [logoPreview, logoFile]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    // Los campos de texto ya están en formData gracias a sus atributos 'name'.
    // Añadimos el archivo del logo si existe.
    if (logoFile) {
      formData.append("logo_file", logoFile);
    }
    if (removeLogo) {
      formData.append("remove_logo", "true");
    }

    startTransition(async () => {
      // Pasamos la URL del logo actual para que la acción sepa si debe borrarlo del storage
      const result = await actualizarDatosClinica(initialData.logo_url, formData); 

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al actualizar los datos.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        setSuccessMessage(result.message || "Datos actualizados correctamente.");
        // La acción llama a revalidatePath, lo que debería hacer que la página contenedora
        // obtenga los nuevos datos y los pase de nuevo como initialData,
        // lo que activará el useEffect para actualizar los estados del formulario.
        router.refresh(); // Forzar un refresh para asegurar que initialData se actualice
        if (result.data?.logo_url !== undefined) { // data es el registro actualizado de datos_clinica
          setCurrentLogoUrl(result.data.logo_url); // Actualizar la URL del logo actual
          if (!logoFile && !removeLogo) { // Si no se subió nuevo ni se pidió borrar, mantener preview actual
             setLogoPreview(result.data.logo_url || null);
          } else if (removeLogo) {
             setLogoPreview(null);
          }
        }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información General de la Clínica</CardTitle>
        <CardDescription>Actualiza los detalles principales de tu clínica. Esta información podría usarse en facturas y otros documentos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="nombre_clinica" className="mb-1.5 block">Nombre de la Clínica</Label>
              <Input id="nombre_clinica" name="nombre_clinica" value={nombreClinica} onChange={(e) => setNombreClinica(e.target.value)} required />
              {fieldErrors?.nombre_clinica && <p className="text-sm text-red-500 mt-1">{fieldErrors.nombre_clinica[0]}</p>}
            </div>
            <div>
              <Label htmlFor="nif_cif" className="mb-1.5 block">NIF/CIF</Label>
              <Input id="nif_cif" name="nif_cif" value={nifCif} onChange={(e) => setNifCif(e.target.value)} />
              {fieldErrors?.nif_cif && <p className="text-sm text-red-500 mt-1">{fieldErrors.nif_cif[0]}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="direccion_completa" className="mb-1.5 block">Dirección Completa</Label>
            <Textarea id="direccion_completa" name="direccion_completa" value={direccion} onChange={(e) => setDireccion(e.target.value)} rows={3} />
            {fieldErrors?.direccion_completa && <p className="text-sm text-red-500 mt-1">{fieldErrors.direccion_completa[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="codigo_postal" className="mb-1.5 block">Código Postal</Label>
              <Input id="codigo_postal" name="codigo_postal" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
              {fieldErrors?.codigo_postal && <p className="text-sm text-red-500 mt-1">{fieldErrors.codigo_postal[0]}</p>}
            </div>
            <div>
              <Label htmlFor="ciudad" className="mb-1.5 block">Ciudad</Label>
              <Input id="ciudad" name="ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
              {fieldErrors?.ciudad && <p className="text-sm text-red-500 mt-1">{fieldErrors.ciudad[0]}</p>}
            </div>
            <div>
              <Label htmlFor="provincia" className="mb-1.5 block">Provincia</Label>
              <Input id="provincia" name="provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
              {fieldErrors?.provincia && <p className="text-sm text-red-500 mt-1">{fieldErrors.provincia[0]}</p>}
            </div>
          </div>
          {/* Pais podría ser un Select si operas en varios, por ahora Input */}
          <div>
            <Label htmlFor="pais" className="mb-1.5 block">País</Label>
            <Input id="pais" name="pais" value={pais} onChange={(e) => setPais(e.target.value)} />
            {fieldErrors?.pais && <p className="text-sm text-red-500 mt-1">{fieldErrors.pais[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="telefono_principal" className="mb-1.5 block">Teléfono Principal</Label>
              <Input id="telefono_principal" name="telefono_principal" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              {fieldErrors?.telefono_principal && <p className="text-sm text-red-500 mt-1">{fieldErrors.telefono_principal[0]}</p>}
            </div>
            <div>
              <Label htmlFor="email_contacto" className="mb-1.5 block">Email de Contacto</Label>
              <Input id="email_contacto" name="email_contacto" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors?.email_contacto && <p className="text-sm text-red-500 mt-1">{fieldErrors.email_contacto[0]}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="sitio_web" className="mb-1.5 block">Sitio Web (opcional)</Label>
            <Input id="sitio_web" name="sitio_web" type="url" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} placeholder="https://ejemplo.com" />
            {fieldErrors?.sitio_web && <p className="text-sm text-red-500 mt-1">{fieldErrors.sitio_web[0]}</p>}
          </div>

          <div>
            <Label htmlFor="horarios_atencion" className="mb-1.5 block">Horarios de Atención (opcional)</Label>
            <Textarea id="horarios_atencion" name="horarios_atencion" value={horarios} onChange={(e) => setHorarios(e.target.value)} rows={4} placeholder="Ej: Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 10:00 - 14:00"/>
            {fieldErrors?.horarios_atencion && <p className="text-sm text-red-500 mt-1">{fieldErrors.horarios_atencion[0]}</p>}
          </div>

          {/* Sección del Logo */}
          <div>
            <Label htmlFor="logo_file" className="mb-1.5 block">Logo de la Clínica</Label>
            {logoPreview && (
              <div className="mb-4">
                <Image src={logoPreview} alt="Previsualización del logo" width={150} height={150} className="rounded border object-contain" />
              </div>
            )}
            <Input 
              id="logo_file" 
              name="logo_file" 
              type="file" 
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              ref={fileInputRef}
              onChange={handleLogoChange} 
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {currentLogoUrl && !logoFile && ( // Solo mostrar si hay un logo actual y no se ha seleccionado uno nuevo
                <div className="mt-2 flex items-center space-x-2">
                    <Checkbox 
                        id="remove_logo" 
                        name="remove_logo" // El action leerá esto
                        checked={removeLogo} 
                        onCheckedChange={(checked) => setRemoveLogo(Boolean(checked))}
                    />
                    <Label htmlFor="remove_logo" className="text-sm font-normal">Eliminar logo actual</Label>
                </div>
            )}
             {fieldErrors?.logo_file && <p className="text-sm text-red-500 mt-1">{fieldErrors.logo_file[0]}</p>}
          </div>

        </CardContent>
        <CardFooter className="flex flex-col items-start gap-y-2">
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando Cambios..." : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
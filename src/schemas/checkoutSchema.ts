import { z } from "zod";

export const addressSchema = z.object({
  cep: z
    .string()
    .min(8, "CEP inválido")
    .max(9, "CEP inválido")
    .regex(/^\d{5}-?\d{3}$/, "Use o formato 00000-000"),
  logradouro: z.string().min(3, "Informe a rua/avenida"),
  numero: z.string().min(1, "Informe o número"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Informe o bairro"),
  cidade: z.string().min(2, "Informe a cidade"),
  uf: z
    .string()
    .length(2, "Use a sigla do estado (ex: SP)")
    .transform((v) => v.toUpperCase()),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

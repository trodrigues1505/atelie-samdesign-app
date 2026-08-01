import { supabase } from "@/api/supabaseClient";
import type { Product, ProductVariant } from "@/types/database";

export type ProductWithVariants = Product & {
  product_variants: ProductVariant[];
};

export const productRepository = {
  async listActive(): Promise<ProductWithVariants[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /** Lista todos os produtos (inclusive inativos) — uso exclusivo do admin. */
  async listAllAdmin(): Promise<ProductWithVariants[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<ProductWithVariants | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(
    product: Pick<Product, "nome" | "descricao" | "categoria" | "preco" | "peso_gramas" | "fotos" | "ativo">
  ): Promise<Product> {
    const { data, error } = await supabase.from("products").insert(product).select("*").single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadPhoto(productId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${productId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
    return data.publicUrl;
  },

  async createVariant(
    variant: Pick<ProductVariant, "product_id" | "tamanho" | "cor" | "tecido" | "estoque">
  ): Promise<ProductVariant> {
    const { data, error } = await supabase
      .from("product_variants")
      .insert(variant)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    const { data, error } = await supabase
      .from("product_variants")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async removeVariant(id: string): Promise<void> {
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) throw error;
  },
};

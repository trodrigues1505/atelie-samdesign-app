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

  async getById(id: string): Promise<ProductWithVariants | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

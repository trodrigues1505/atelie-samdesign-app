import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/pages/client/ShopPage";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Carrinho</h1>
        <p className="mt-4 text-sm text-muted-foreground">Seu carrinho está vazio.</p>
        <Link
          to="/loja"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Ir para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Carrinho</h1>

      <div className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex items-center gap-4 rounded-lg border border-border p-3"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {item.foto ? (
                <img src={item.foto} alt={item.nome} className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium">{item.nome}</p>
              {(item.tamanho || item.cor) && (
                <p className="text-xs text-muted-foreground">
                  {[item.tamanho, item.cor].filter(Boolean).join(" — ")}
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-primary">{formatBRL(item.preco)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.variantId, item.quantidade - 1)}
                className="h-7 w-7 rounded-md border border-border text-sm hover:bg-muted"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{item.quantidade}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.variantId, item.quantidade + 1)}
                className="h-7 w-7 rounded-md border border-border text-sm hover:bg-muted"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              className="text-xs text-red-600 hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-lg font-semibold">{formatBRL(subtotal)}</span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        O frete é calculado na próxima etapa.
      </p>

      <button
        onClick={() => navigate("/checkout")}
        className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:w-auto"
      >
        Ir para o checkout
      </button>
    </div>
  );
}

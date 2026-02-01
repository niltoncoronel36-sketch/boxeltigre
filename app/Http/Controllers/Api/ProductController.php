<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * GET /api/products
     * Query params:
     * - q: string (buscador)
     * - category: slug de categoría (ej "guantes")
     * - min_price, max_price
     * - sort: price_asc|price_desc|newest
     * - include_inactive=1  (solo admin / autenticado)
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $categorySlug = trim((string) $request->query('category', ''));
        $minPrice = $request->query('min_price');
        $maxPrice = $request->query('max_price');
        $sort = (string) $request->query('sort', 'newest');

        $query = Product::query()
            ->with([
                'category:id,name,slug',
                'primaryImage:id,product_id,path,alt,is_primary',
            ]);

        /**
         * ✅ Pública: solo activos
         * ✅ Admin: puede pedir include_inactive=1
         */
        $includeInactive = $request->boolean('include_inactive') && $request->user();
        if (!$includeInactive) {
            $query->where('is_active', true);
        }

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('name', 'like', "%{$q}%")
                    ->orWhere('brand', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        if ($categorySlug !== '') {
            $catId = ProductCategory::where('slug', $categorySlug)->value('id');
            if ($catId) {
                $query->where('product_category_id', $catId);
            } else {
                return response()->json([
                    'success' => true,
                    'message' => 'Productos',
                    'data' => [
                        'items' => [],
                        'pagination' => [
                            'current_page' => 1,
                            'per_page' => 0,
                            'total' => 0,
                            'last_page' => 1,
                        ],
                    ],
                ]);
            }
        }

        if ($minPrice !== null && is_numeric($minPrice)) {
            $query->where('price', '>=', (float) $minPrice);
        }
        if ($maxPrice !== null && is_numeric($maxPrice)) {
            $query->where('price', '<=', (float) $maxPrice);
        }

        if ($sort === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('price', 'desc');
        } else {
            $query->orderByDesc('id'); // newest
        }

        $perPage = (int) $request->query('per_page', 30);
        $perPage = max(1, min(100, $perPage));

        $products = $query->paginate($perPage);

        $items = $products->getCollection()->map(function (Product $p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'brand' => $p->brand,
                'category' => $p->category ? [
                    'id' => $p->category->id,
                    'name' => $p->category->name,
                    'slug' => $p->category->slug,
                ] : null,
                'price' => (float) $p->price,
                'compare_at_price' => $p->compare_at_price ? (float) $p->compare_at_price : null,
                'currency' => $p->currency,
                'has_variants' => (bool) $p->has_variants,

                // ✅ total stock real
                'total_stock' => (int) $p->total_stock,

                // ✅ IMPORTANTE: ahora sí viaja al frontend
                'is_active' => (bool) $p->is_active,

                // ✅ URL usable
                'image' => $this->resolveImage($p->primaryImage?->path),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Productos',
            'data' => [
                'items' => $items,
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                    'last_page' => $products->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * GET /api/products/{slug}
     */
    public function show(string $slug)
    {
        $product = Product::query()
            ->with([
                'category:id,name,slug',
                'images:id,product_id,product_variant_id,path,alt,sort_order,is_primary',
                'primaryImage:id,product_id,path,alt,is_primary',
                'variants:id,product_id,sku,size,color,oz,stock,price_override,is_active,label',
            ])
            ->where('is_active', true)
            ->where('slug', $slug)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado',
                'data' => null,
            ], 404);
        }

        $variants = $product->variants
            ->where('is_active', true)
            ->values()
            ->map(function ($v) use ($product) {
                $finalPrice = $v->price_override !== null ? (float) $v->price_override : (float) $product->price;

                return [
                    'id' => $v->id,
                    'sku' => $v->sku,
                    'size' => $v->size,
                    'color' => $v->color,
                    'oz' => $v->oz,
                    'stock' => (int) $v->stock,
                    'price' => $finalPrice,
                    'label' => $v->label,
                ];
            });

        $images = $product->images->map(function ($img) {
            return [
                'id' => $img->id,
                'path' => $this->resolveImage($img->path),
                'alt' => $img->alt,
                'sort_order' => (int) $img->sort_order,
                'is_primary' => (bool) $img->is_primary,
                'product_variant_id' => $img->product_variant_id,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Producto',
            'data' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'brand' => $product->brand,
                'description' => $product->description,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price ? (float) $product->compare_at_price : null,
                'currency' => $product->currency,
                'has_variants' => (bool) $product->has_variants,
                'total_stock' => (int) $product->total_stock,

                // ✅ imagen principal directa (útil para frontend)
                'image' => $this->resolveImage($product->primaryImage?->path),

                'images' => $images,
                'variants' => $variants,
            ],
        ]);
    }

    /**
     * ✅ ADMIN: POST /api/products  (auth:sanctum)
     * Foto opcional: image
     */
    public function store(Request $request)
{
    $data = $request->validate([
        'product_category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
        'name' => ['required', 'string', 'max:160'],
        'brand' => ['nullable', 'string', 'max:120'],
        'price' => ['required', 'numeric', 'min:0'],
        'compare_at_price' => ['nullable', 'numeric', 'min:0'],
        'is_active' => ['nullable', 'boolean'],

        // ✅ Stock que llega desde el admin (se guarda en columna stock)
        'total_stock' => ['nullable', 'integer', 'min:0'],

        'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
    ]);

    DB::beginTransaction();
    try {
        $slugBase = Str::slug($data['name']);
        $slug = $slugBase;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . Str::lower(Str::random(4));
        }

        $product = Product::create([
            'product_category_id' => $data['product_category_id'] ?? null,
            'name' => $data['name'],
            'slug' => $slug,
            'brand' => $data['brand'] ?? 'El Tigre',
            'description' => null,
            'price' => $data['price'],
            'compare_at_price' => $data['compare_at_price'] ?? null,
            'currency' => 'PEN',

            // ✅ POR AHORA: SIN VARIANTES
            'has_variants' => false,

            // ✅ guardamos stock real
            'stock' => (int) ($data['total_stock'] ?? 0),

            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
        ]);

        // ✅ Imagen opcional (principal)
        if ($request->hasFile('image')) {
            $path = $request->file('image')->storePublicly('products', 'public');

            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                [
                    'product_variant_id' => null,
                    'path' => $path,
                    'alt' => $product->name,
                    'sort_order' => 0,
                    'is_primary' => true,
                ]
            );
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Producto creado',
            'data' => [
                'id' => $product->id,
                'slug' => $product->slug,
                'stock' => (int) $product->stock,
                'total_stock' => (int) $product->total_stock, // accessor
                'is_active' => (bool) $product->is_active,
            ],
        ], 201);
    } catch (\Throwable $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Error al crear producto',
            'error' => $e->getMessage(),
        ], 500);
    }
}

/**
 * ✅ ADMIN: PUT/PATCH /api/products/{product}  (auth:sanctum)
 * Foto opcional: image (si llega, reemplaza la principal)
 */
public function update(Request $request, Product $product)
{
    $data = $request->validate([
        'product_category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
        'name' => ['required', 'string', 'max:160'],
        'brand' => ['nullable', 'string', 'max:120'],
        'price' => ['required', 'numeric', 'min:0'],
        'compare_at_price' => ['nullable', 'numeric', 'min:0'],
        'is_active' => ['nullable', 'boolean'],

        // ✅ Stock que llega desde el admin (se guarda en columna stock)
        'total_stock' => ['nullable', 'integer', 'min:0'],

        'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
    ]);

    DB::beginTransaction();
    try {
        $product->update([
            'product_category_id' => $data['product_category_id'] ?? null,
            'name' => $data['name'],
            'brand' => $data['brand'] ?? $product->brand,
            'price' => $data['price'],
            'compare_at_price' => $data['compare_at_price'] ?? null,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $product->is_active,

            // ✅ CLAVE: forzamos SIN variantes (para que total_stock = stock)
            'has_variants' => false,

            // ✅ actualiza stock real
            'stock' => array_key_exists('total_stock', $data) ? (int) $data['total_stock'] : (int) $product->stock,
        ]);

        if ($request->hasFile('image')) {
            $primary = ProductImage::where('product_id', $product->id)
                ->where('is_primary', true)
                ->first();

            if ($primary && $primary->path && !$this->isExternalOrPublicPath($primary->path)) {
                Storage::disk('public')->delete($primary->path);
            }

            $path = $request->file('image')->storePublicly('products', 'public');

            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                [
                    'product_variant_id' => null,
                    'path' => $path,
                    'alt' => $product->name,
                    'sort_order' => 0,
                    'is_primary' => true,
                ]
            );
        }

        DB::commit();

        $product->refresh(); // ✅ para traer el stock actualizado

        return response()->json([
            'success' => true,
            'message' => 'Producto actualizado',
            'data' => [
                'id' => $product->id,
                'stock' => (int) $product->stock,
                'total_stock' => (int) $product->total_stock,
                'is_active' => (bool) $product->is_active,
            ],
        ]);
    } catch (\Throwable $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Error al actualizar producto',
            'error' => $e->getMessage(),
        ], 500);
    }
}


    /**
     * ✅ ADMIN: DELETE /api/products/{product} (auth:sanctum)
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Producto eliminado',
            'data' => null,
        ]);
    }

    /**
     * Convierte path guardado a URL usable:
     * - http(s) o /store/... => tal cual
     * - products/xxx.jpg => /storage/products/xxx.jpg
     */
    private function resolveImage(?string $path): ?string
    {
        if (!$path) return null;

        if ($this->isExternalOrPublicPath($path)) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }

    private function isExternalOrPublicPath(string $path): bool
    {
        return Str::startsWith($path, ['http://', 'https://', '/']);
    }
}

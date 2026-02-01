<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    /**
     * GET /api/product-categories
     * (público) lista categorías
     * params: q (opcional)
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $query = ProductCategory::query()->orderBy('name');

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('name', 'like', "%{$q}%")
                   ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        $items = $query->get()->map(function (ProductCategory $c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Categorías tienda',
            'data' => $items,
        ]);
    }

    /**
     * POST /api/product-categories  (admin)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140'],
        ]);

        $name = trim($data['name']);
        $slug = trim((string)($data['slug'] ?? ''));

        if ($slug === '') $slug = Str::slug($name);

        // slug único
        $base = $slug;
        $i = 1;
        while (ProductCategory::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        $cat = ProductCategory::create([
            'name' => $name,
            'slug' => $slug,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Categoría creada',
            'data' => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
            ],
        ], 201);
    }

    /**
     * PUT /api/product-categories/{productCategory} (admin)
     */
    public function update(Request $request, ProductCategory $productCategory)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140'],
        ]);

        $name = trim($data['name']);
        $slug = trim((string)($data['slug'] ?? ''));

        if ($slug === '') $slug = Str::slug($name);

        // slug único (excepto la misma)
        $base = $slug;
        $i = 1;
        while (
            ProductCategory::where('slug', $slug)
                ->where('id', '!=', $productCategory->id)
                ->exists()
        ) {
            $slug = $base . '-' . $i;
            $i++;
        }

        $productCategory->update([
            'name' => $name,
            'slug' => $slug,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Categoría actualizada',
            'data' => [
                'id' => $productCategory->id,
                'name' => $productCategory->name,
                'slug' => $productCategory->slug,
            ],
        ]);
    }

    /**
     * DELETE /api/product-categories/{productCategory} (admin)
     */
    public function destroy(ProductCategory $productCategory)
    {
        $productCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada',
            'data' => null,
        ]);
    }
}

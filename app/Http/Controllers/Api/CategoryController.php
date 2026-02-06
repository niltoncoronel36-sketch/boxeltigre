<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryStoreRequest;
use App\Http\Requests\CategoryUpdateRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class CategoryController extends Controller
{
    /**
     * ✅ Público (sin auth)
     * GET /api/public/categories
     *
     * Params:
     * - per_page (1..200) default 50
     * - page default 1
     * - search (name/level)
     * - active (1|0) default 1
     * - sort (recommended|price|name) default recommended
     */
    public function publicIndex(Request $request)
    {
        $perPage = max(1, min(200, (int) $request->integer('per_page', 50)));
        $search  = trim((string) $request->query('search', ''));
        $active  = $request->query('active', '1'); // default: activas
        $sort    = trim((string) $request->query('sort', 'recommended'));

        $q = Category::query();

        // Por defecto SOLO activas
        if ($active === '1' || $active === '0') {
            $q->where('is_active', $active === '1');
        }

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('level', 'like', "%{$search}%");
            });
        }

        // ✅ Orden "pro" para planes:
        // - recommended: mayor mensualidad primero (así el más caro queda destacado)
        // - price: mayor mensualidad primero
        // - name: alfabético
        if ($sort === 'name') {
            $q->orderBy('name')->orderBy('level');
        } else {
            // recommended / price
            $q->orderByRaw('COALESCE(monthly_fee_cents, 0) DESC')
              ->orderBy('name')
              ->orderBy('level');
        }

        return response()->json(
            $q->paginate($perPage)->appends($request->query())
        );
    }

    /**
     * ✅ Admin (con auth:sanctum)
     * GET /api/categories
     */
    public function index(Request $request)
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = trim((string) $request->query('search', ''));
        $active = $request->query('active', null); // '1'|'0'|null

        $q = Category::query();

        if ($active === '1' || $active === '0') {
            $q->where('is_active', $active === '1');
        }

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('level', 'like', "%{$search}%");
            });
        }

        $q->orderBy('name')->orderBy('level');

        return response()->json($q->paginate($perPage)->appends($request->query()));
    }

    public function store(CategoryStoreRequest $request)
    {
        $data = $request->validated();

        // Si level viene vacío, usamos 'general' para que el unique funcione como esperas
        if (array_key_exists('level', $data)) {
            $lvl = trim((string) ($data['level'] ?? ''));
            $data['level'] = $lvl !== '' ? $lvl : 'general';
        } else {
            $data['level'] = 'general';
        }

        try {
            $cat = Category::create($data);
            return response()->json(['data' => $cat], 201);
        } catch (QueryException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'Ya existe una categoría con ese nombre y nivel.',
                    'errors' => ['name' => ['Duplicado (name + level).']],
                ], 422);
            }
            throw $e;
        }
    }

    public function show(Category $category)
    {
        return response()->json(['data' => $category]);
    }

    public function update(CategoryUpdateRequest $request, Category $category)
    {
        $data = $request->validated();

        if (array_key_exists('level', $data)) {
            $lvl = trim((string) ($data['level'] ?? ''));
            $data['level'] = $lvl !== '' ? $lvl : 'general';
        }

        try {
            $category->fill($data)->save();
            return response()->json(['data' => $category]);
        } catch (QueryException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'Ya existe una categoría con ese nombre y nivel.',
                    'errors' => ['name' => ['Duplicado (name + level).']],
                ], 422);
            }
            throw $e;
        }
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['ok' => true]);
    }
}

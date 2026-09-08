<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of categories with product counts.
     */
    public function index(): JsonResponse
    {
        $categories = Category::withCount('products')
            ->orderBy('name')
            ->get();

        return $this->successResponse($categories, 'Daftar kategori berhasil diambil.');
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()?->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')
                    ->where(fn ($q) => $storeId ? $q->where('store_id', $storeId) : $q)
                    ->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        // Handle unique slug fallback
        $originalSlug = $validated['slug'];
        $count = 1;
        while (Category::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = "{$originalSlug}-{$count}";
            $count++;
        }

        $category = Category::create($validated);

        return $this->successResponse($category, 'Kategori berhasil dibuat.', 201);
    }

    /**
     * Display the specified category with its products.
     */
    public function show(string $id): JsonResponse
    {
        $category = Category::with(['products' => function ($query) {
            $query->where('is_active', true)->orderBy('name');
        }])->find($id);

        if (! $category) {
            return $this->errorResponse('Kategori tidak ditemukan.', 404);
        }

        return $this->successResponse($category, 'Detail kategori berhasil diambil.');
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return $this->errorResponse('Kategori tidak ditemukan.', 404);
        }

        $storeId = $request->user()?->store_id ?? $category->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')
                    ->ignore($category->id)
                    ->where(fn ($q) => $storeId ? $q->where('store_id', $storeId) : $q)
                    ->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return $this->successResponse($category, 'Kategori berhasil diperbarui.');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $category = Category::withCount('products')->find($id);

        if (! $category) {
            return $this->errorResponse('Kategori tidak ditemukan.', 404);
        }

        if ($category->products_count > 0) {
            $action = $request->input('action');

            if ($action === 'reassign') {
                $targetCategoryId = $request->input('target_category_id');
                if (! $targetCategoryId) {
                    return $this->errorResponse('Pilih kategori tujuan pemindahan produk.', 422);
                }

                if ($targetCategoryId === $category->id) {
                    return $this->errorResponse('Kategori tujuan tidak boleh sama dengan kategori yang akan dihapus.', 422);
                }

                $targetCategory = Category::find($targetCategoryId);
                if (! $targetCategory) {
                    return $this->errorResponse('Kategori tujuan tidak ditemukan.', 404);
                }

                // Pindahkan seluruh produk ke kategori tujuan
                $category->products()->update(['category_id' => $targetCategoryId]);
            } elseif ($action === 'uncategorize') {
                // Lepaskan seluruh produk menjadi tanpa kategori
                $category->products()->update(['category_id' => null]);
            } else {
                return $this->errorResponse(
                    "Kategori \"{$category->name}\" masih menaungi {$category->products_count} produk. Harap tentukan tindakan pemindahan produk.",
                    422,
                    [
                        'products_count' => $category->products_count,
                        'requires_action' => true,
                    ]
                );
            }
        }

        $category->delete();

        return $this->successResponse(null, 'Kategori berhasil dihapus.');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug'],
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

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug,'.$category->id],
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
    public function destroy(string $id): JsonResponse
    {
        $category = Category::withCount('products')->find($id);

        if (! $category) {
            return $this->errorResponse('Kategori tidak ditemukan.', 404);
        }

        if ($category->products_count > 0) {
            return $this->errorResponse('Kategori tidak dapat dihapus karena masih memiliki produk terkait.', 422);
        }

        $category->delete();

        return $this->successResponse(null, 'Kategori berhasil dihapus.');
    }
}

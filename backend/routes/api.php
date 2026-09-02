<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DiscountController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StockOpnameController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\StoreSettingController;
use App\Http\Controllers\Api\TaxAndFeeController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - KasirKita POS
|--------------------------------------------------------------------------
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'KasirKita POS API is running smoothly.',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Protected Business Routes
Route::middleware('auth:sanctum')->group(function () {
    // Units API (Read by all)
    Route::get('/units', [UnitController::class, 'index']);
    Route::get('/units/{id}', [UnitController::class, 'show']);

    // Categories API (Read by all)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    // Products & Inventory API (Read by all)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/products/{id}/stock-movements', [ProductController::class, 'stockMovements']);

    // Customer API (Accessible by Cashier & Owner)
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::get('/customers/{id}/transactions', [CustomerController::class, 'transactions']);

    // Point of Sales (POS) API (Sales operational for all staff)
    Route::prefix('pos')->group(function () {
        Route::post('/checkout', [PosController::class, 'checkout']);
        Route::get('/transactions', [PosController::class, 'index']);
        Route::get('/transactions/{id}', [PosController::class, 'show']);
    });

    // Discounts & Vouchers API (Read & Check Voucher for all staff)
    Route::get('/discounts', [DiscountController::class, 'index']);
    Route::get('/discounts/{id}', [DiscountController::class, 'show']);
    Route::post('/discounts/check-voucher', [DiscountController::class, 'checkVoucher']);

    // Taxes & Service Fees API (Read for all staff)
    Route::get('/taxes-and-fees', [TaxAndFeeController::class, 'index']);
    Route::get('/taxes-and-fees/{id}', [TaxAndFeeController::class, 'show']);

    // Store Settings API (Read for all staff)
    Route::get('/settings/store', [StoreSettingController::class, 'getStore']);

    // Owner-Only Administrative & Financial Routes
    Route::middleware('role:owner')->group(function () {
        // Store Settings update
        Route::put('/settings/store', [StoreSettingController::class, 'updateStore']);

        // Taxes & Fees management
        Route::post('/taxes-and-fees', [TaxAndFeeController::class, 'store']);
        Route::put('/taxes-and-fees/{id}', [TaxAndFeeController::class, 'update']);
        Route::delete('/taxes-and-fees/{id}', [TaxAndFeeController::class, 'destroy']);
        Route::patch('/taxes-and-fees/{id}/toggle-status', [TaxAndFeeController::class, 'toggleStatus']);

        // Discount management
        Route::post('/discounts', [DiscountController::class, 'store']);
        Route::put('/discounts/{id}', [DiscountController::class, 'update']);
        Route::delete('/discounts/{id}', [DiscountController::class, 'destroy']);
        Route::patch('/discounts/{id}/toggle-status', [DiscountController::class, 'toggleStatus']);

        // User & Staff management
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

        // Supplier management
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
        Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
        Route::get('/suppliers/{id}/history', [SupplierController::class, 'history']);

        // Customer deletion
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
        // Unit management
        Route::post('/units', [UnitController::class, 'store']);
        Route::put('/units/{id}', [UnitController::class, 'update']);
        Route::delete('/units/{id}', [UnitController::class, 'destroy']);

        // Category management
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Product management & Restock
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::post('/products/{id}/restock', [ProductController::class, 'restock']);

        // Stock Opname API
        Route::get('/stock-opnames', [StockOpnameController::class, 'index']);
        Route::post('/stock-opnames', [StockOpnameController::class, 'store']);
        Route::get('/stock-opnames/{id}', [StockOpnameController::class, 'show']);
        Route::post('/stock-opnames/{id}/complete', [StockOpnameController::class, 'complete']);

        // POS Void / Cancel Transaction
        Route::post('/pos/transactions/{id}/cancel', [PosController::class, 'cancel']);

        // Finance & Reports API
        Route::prefix('finance')->group(function () {
            Route::get('/dashboard', [FinanceController::class, 'dashboard']);
            Route::get('/trends', [FinanceController::class, 'trends']);
            Route::get('/cash-flows', [FinanceController::class, 'cashFlows']);
            Route::post('/cash-flows', [FinanceController::class, 'storeCashFlow']);
            Route::get('/export', [FinanceController::class, 'exportCsv']);
        });
    });
});

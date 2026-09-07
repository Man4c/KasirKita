<?php

namespace App\Scopes;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class StoreScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Never apply to User model to prevent auth resolution recursion loops
        if ($model instanceof User) {
            return;
        }

        // Only apply store isolation if user is authenticated and associated with a store
        if (auth()->check()) {
            $user = auth()->user();

            if (! empty($user->store_id)) {
                $table = $model->getTable();
                $storeId = $user->store_id;

                // For shared models like Unit where store_id NULL denotes global default
                if (method_exists($model, 'isSharedTenantModel') && $model->isSharedTenantModel()) {
                    $builder->where(function (Builder $query) use ($table, $storeId) {
                        $query->where("{$table}.store_id", $storeId)
                            ->orWhereNull("{$table}.store_id");
                    });
                } else {
                    $builder->where("{$table}.store_id", $storeId);
                }
            }
        }
    }
}

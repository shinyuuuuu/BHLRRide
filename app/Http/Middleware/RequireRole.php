<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Lets a request through only if the logged-in account has one of the given roles. */
class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $account = $request->user();

        if (! $account || ! in_array($account->role, $roles, true)) {
            return response()->json(['message' => 'You do not have access to this.'], 403);
        }

        return $next($request);
    }
}

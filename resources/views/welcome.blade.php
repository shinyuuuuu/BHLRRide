<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BHLRRide | Car and motorcycle rental in Bohol</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:600,700|inter:400,500,600" rel="stylesheet" />

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-[#F2F6F5] text-[#0B2A33]" style="font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;">

    {{-- Top bar --}}
    <header class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <a href="{{ url('/') }}" class="text-xl font-bold" style="font-family: 'Bricolage Grotesque', sans-serif;">
            BHLRRide
        </a>

        @if (Route::has('login'))
            <nav class="flex items-center gap-3 text-sm font-medium">
                @auth
                    <a href="{{ url('/dashboard') }}" class="rounded-md bg-[#0B2A33] px-4 py-2 text-white hover:bg-[#0E7C86]">
                        Go to dashboard
                    </a>
                @else
                    <a href="{{ route('login') }}" class="px-3 py-2 hover:text-[#0E7C86]">Log in</a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="rounded-md bg-[#0B2A33] px-4 py-2 text-white hover:bg-[#0E7C86]">
                            Create account
                        </a>
                    @endif
                @endauth
            </nav>
        @endif
    </header>

    {{-- Hero --}}
    <main>
        <section class="mx-auto max-w-5xl px-6 pb-16 pt-12 sm:pt-20">
            <h1 class="max-w-2xl text-4xl font-bold leading-tight sm:text-6xl" style="font-family: 'Bricolage Grotesque', sans-serif;">
                Rent a car or motorcycle in Bohol, without the Messenger back-and-forth.
            </h1>
            <p class="mt-6 max-w-xl text-lg text-[#3E5A63]">
                Browse available vehicles, pick your dates, and send a booking request to the rental shop in one place.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
                @auth
                    <a href="{{ url('/dashboard') }}" class="rounded-md bg-[#0E7C86] px-6 py-3 font-semibold text-white hover:bg-[#0B2A33]">
                        Go to dashboard
                    </a>
                @else
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="rounded-md bg-[#0E7C86] px-6 py-3 font-semibold text-white hover:bg-[#0B2A33]">
                            Create an account
                        </a>
                    @endif
                    <a href="{{ route('login') }}" class="rounded-md border border-[#0B2A33] px-6 py-3 font-semibold hover:bg-[#0B2A33] hover:text-white">
                        Log in
                    </a>
                @endauth
            </div>
        </section>

        {{-- Vehicle types --}}
        <section class="border-y border-[#D5E0DE] bg-white">
            <div class="mx-auto grid max-w-5xl gap-px bg-[#D5E0DE] sm:grid-cols-2">
                <div class="bg-white px-6 py-10">
                    <h2 class="text-2xl font-semibold" style="font-family: 'Bricolage Grotesque', sans-serif;">Cars</h2>
                    <p class="mt-2 text-[#3E5A63]">For families and groups touring the island, from the Chocolate Hills to the coast.</p>
                </div>
                <div class="bg-white px-6 py-10">
                    <h2 class="text-2xl font-semibold" style="font-family: 'Bricolage Grotesque', sans-serif;">Motorcycles</h2>
                    <p class="mt-2 text-[#3E5A63]">For solo riders and couples who want to go at their own pace.</p>
                </div>
            </div>
        </section>

        {{-- How it works --}}
        <section class="mx-auto max-w-5xl px-6 py-16">
            <h2 class="text-2xl font-semibold" style="font-family: 'Bricolage Grotesque', sans-serif;">How renting works</h2>
            <ol class="mt-8 grid gap-8 sm:grid-cols-3">
                <li>
                    <p class="font-semibold text-[#0E7C86]">1. Choose a vehicle</p>
                    <p class="mt-1 text-[#3E5A63]">See what is available for your dates and compare daily rates.</p>
                </li>
                <li>
                    <p class="font-semibold text-[#0E7C86]">2. Send a booking request</p>
                    <p class="mt-1 text-[#3E5A63]">Upload your driver's license and a valid ID so the shop can verify you.</p>
                </li>
                <li>
                    <p class="font-semibold text-[#0E7C86]">3. Pick it up</p>
                    <p class="mt-1 text-[#3E5A63]">Once the shop approves your request, collect the vehicle and ride.</p>
                </li>
            </ol>
        </section>
    </main>

    <footer class="border-t border-[#D5E0DE] py-6 text-center text-sm text-[#3E5A63]">
        &copy; {{ date('Y') }} BHLRRide. Car and motorcycle rental management for Bohol.
    </footer>
</body>
</html>
<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateUserCommand extends Command
{
    protected $signature = 'user:create
                            {email? : Correo electrónico del usuario}
                            {--name= : Nombre completo del usuario}
                            {--password= : Contraseña de acceso}';

    protected $description = 'Crea o actualiza un usuario con acceso al portal de NutriAnalytics';

    public function handle(): int
    {
        $email = $this->argument('email') ?: $this->ask('Correo electrónico del usuario');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('El correo electrónico ingresado no tiene un formato válido.');
            return Command::FAILURE;
        }

        $name = $this->option('name') ?: $this->ask('Nombre del usuario', 'Director General');
        $password = $this->option('password') ?: $this->secret('Contraseña (mínimo 8 caracteres)');

        if (strlen((string) $password) < 8) {
            $this->error('La contraseña debe tener al menos 8 caracteres.');
            return Command::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            if ($this->confirm("El usuario {$email} ya existe. ¿Deseas actualizar su contraseña y nombre?", true)) {
                $user->update([
                    'name' => $name,
                    'password' => Hash::make($password),
                ]);
                $this->info("✅ Usuario {$email} actualizado con éxito.");
                return Command::SUCCESS;
            }
            return Command::SUCCESS;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        $this->info("🎉 Usuario creado con éxito:");
        $this->line("   • Nombre: {$name}");
        $this->line("   • Email:  {$email}");

        return Command::SUCCESS;
    }
}

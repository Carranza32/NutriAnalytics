import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { ShieldCheck } from 'lucide-react';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Iniciar Sesión • NutriAnalytics" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                    Usuario o Correo Electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="text"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    className="focus-visible:ring-emerald-500"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                        Contraseña
                                    </Label>
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    className="focus-visible:ring-emerald-500"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                />
                                <Label htmlFor="remember" className="text-sm text-neutral-600 dark:text-neutral-300 font-normal cursor-pointer">
                                    Recordar este dispositivo
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="mr-2" />}
                                Ingresar al Portal
                            </Button>
                        </div>

                        <div className="mt-2 rounded-lg border border-black/[0.05] bg-neutral-50/70 p-3 text-center text-xs text-neutral-500 dark:border-white/[0.06] dark:bg-neutral-800/40 dark:text-neutral-400 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Acceso restringido a personal directivo y gerencial</span>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'NutriAnalytics • Portal Ejecutivo',
    description: 'Ingresa tus credenciales corporativas para acceder',
};

'use client';

import { useMemo, useState } from 'react';
import { Button, Input, InputGroup, Label } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import StatusAlert from '@/components/shared/status-alert';
import {
  getPasswordGuidance,
  getSignUpErrorMessage,
  MIN_SIGNUP_PASSWORD_LENGTH,
} from '@/lib/auth/signup-guidance';
import {
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

type Props = {
  nextPath: string;
};

export function SignUpForm({ nextPath }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const passwordGuidance = useMemo(() => getPasswordGuidance(password), [password]);

  const emailRedirectTo = () => `${window.location.origin}${nextPath}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !passwordGuidance.isValid) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: emailRedirectTo(),
        },
      });

      if (error) {
        setErrorMessage(getSignUpErrorMessage(error));
        return;
      }

      if (!data.session) {
        setConfirmationEmail(normalizedEmail);
        return;
      }

      window.location.replace(nextPath);
    } catch (error) {
      setErrorMessage(getSignUpErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!confirmationEmail || isResending) return;

    setErrorMessage(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      const { error } = await createClient().auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: {
          emailRedirectTo: emailRedirectTo(),
        },
      });

      if (error) {
        setErrorMessage(
          getSignUpErrorMessage(error, 'Unable to resend the confirmation email right now.'),
        );
        return;
      }

      setResendMessage('A new confirmation email is on its way.');
    } catch (error) {
      setErrorMessage(
        getSignUpErrorMessage(error, 'Unable to resend the confirmation email right now.'),
      );
    } finally {
      setIsResending(false);
    }
  };

  if (confirmationEmail) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <EnvelopeIcon className="size-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-default-600">
            We sent a confirmation link to{' '}
            <strong className="break-all font-semibold text-default-900">
              {confirmationEmail}
            </strong>
            .
          </p>
          <p className="text-sm text-default-500">
            Open the link to finish creating your account. Check your spam folder if it does not
            arrive.
          </p>
        </div>

        {errorMessage ? <StatusAlert status="danger">{errorMessage}</StatusAlert> : null}
        {resendMessage ? <StatusAlert status="success">{resendMessage}</StatusAlert> : null}

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            className="w-full"
            isPending={isResending}
            onPress={handleResend}
          >
            {isResending ? 'Sending...' : 'Resend confirmation email'}
          </Button>
          <Button
            variant="tertiary"
            className="w-full"
            isDisabled={isResending}
            onPress={() => {
              setConfirmationEmail(null);
              setPassword('');
              setErrorMessage(null);
              setResendMessage(null);
            }}
          >
            Change email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="form-field">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          disabled={isSubmitting}
          className="w-full"
          autoFocus
        />
      </div>
      <div className="form-field">
        <Label htmlFor="password">Password</Label>
        <InputGroup fullWidth>
          <InputGroup.Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            required
            minLength={MIN_SIGNUP_PASSWORD_LENGTH}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-describedby="password-guidance"
            aria-invalid={password.length > 0 && !passwordGuidance.isValid}
          />
          <InputGroup.Suffix>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              isIconOnly
              className="size-8 min-w-8"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword(current => !current)}
            >
              {showPassword ? (
                <EyeSlashIcon className="size-4" aria-hidden="true" />
              ) : (
                <EyeIcon className="size-4" aria-hidden="true" />
              )}
            </Button>
          </InputGroup.Suffix>
        </InputGroup>

        <div id="password-guidance" className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-default-500">Password strength</span>
            <span
              className={
                passwordGuidance.strength === 'strong'
                  ? 'font-medium text-success'
                  : passwordGuidance.strength === 'fair'
                    ? 'font-medium text-blue-600 dark:text-blue-400'
                    : 'font-medium text-default-500'
              }
            >
              {passwordGuidance.strengthLabel}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full ${
                  index < passwordGuidance.strengthScore
                    ? passwordGuidance.strength === 'strong'
                      ? 'bg-success'
                      : passwordGuidance.strength === 'fair'
                        ? 'bg-blue-500'
                        : 'bg-warning'
                    : 'bg-default-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-default-500">
            Use at least {MIN_SIGNUP_PASSWORD_LENGTH} characters. Longer passwords with a number or
            symbol are stronger.
          </p>
          {password.length > 0 && !passwordGuidance.isValid ? (
            <p className="flex items-center gap-1.5 text-xs text-danger" role="status">
              <ExclamationCircleIcon className="size-4 shrink-0" aria-hidden="true" />
              Add {MIN_SIGNUP_PASSWORD_LENGTH - password.length} more{' '}
              {MIN_SIGNUP_PASSWORD_LENGTH - password.length === 1 ? 'character' : 'characters'}.
            </p>
          ) : null}
        </div>
      </div>
      {errorMessage ? <StatusAlert status="danger">{errorMessage}</StatusAlert> : null}
      <Button
        type="submit"
        variant="primary"
        className="mt-1 w-full"
        isPending={isSubmitting}
        isDisabled={!passwordGuidance.isValid}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}

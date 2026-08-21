import logging
from typing import Any, Dict, Optional, Tuple
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from ai.models import UserProfile

User = get_user_model()
logger = logging.getLogger('silverhands.auth')


class AuthException(Exception):
    """Custom exception for authentication and verification errors."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register_user(
    username: str,
    email: str,
    password: str,
    role: str = 'user',
    phone: str = '',
    preferred_language: str = 'en',
    host_uri: str = 'http://127.0.0.1:8000'
) -> Tuple[User, UserProfile, str]:
    """
    Registers a new user with unverified email status, creates UserProfile,
    and sends verification email with activation token link.
    """
    cleaned_username = (username or '').strip()
    cleaned_email = (email or '').strip().lower()

    if not cleaned_username:
        raise AuthException("Username is required.", status_code=400)
    if not cleaned_email:
        raise AuthException("Email address is required.", status_code=400)
    if not password or len(password) < 6:
        raise AuthException("Password must be at least 6 characters long.", status_code=400)

    if User.objects.filter(username=cleaned_username).exists():
        raise AuthException("A user with this username already exists.", status_code=400)
    if User.objects.filter(email=cleaned_email).exists():
        raise AuthException("A user with this email address already exists.", status_code=400)

    role_val = 'admin' if role.lower() == 'admin' else 'user'

    # Create user as active=True in Django auth, but enforce is_email_verified=False in profile
    user = User.objects.create_user(
        username=cleaned_username,
        email=cleaned_email,
        password=password,
        is_staff=(role_val == 'admin')
    )

    profile = UserProfile.objects.create(
        user=user,
        role=role_val,
        is_email_verified=False,
        phone=phone,
        preferred_language=preferred_language
    )

    token = profile.generate_verification_token()

    # Send verification email
    verify_url = f"{host_uri.rstrip('/')}/api/auth/verify-email/?token={token}"
    _send_activation_email(user, verify_url)

    return user, profile, verify_url


def verify_email_token(token: str) -> UserProfile:
    """
    Verifies user email token, activating the account.
    """
    if not token or not token.strip():
        raise AuthException("Verification token is missing.", status_code=400)

    try:
        profile = UserProfile.objects.get(verification_token=token.strip())
    except UserProfile.DoesNotExist:
        raise AuthException("Invalid or expired verification token.", status_code=400)

    profile.is_email_verified = True
    profile.verification_token = None
    profile.save(update_fields=['is_email_verified', 'verification_token'])

    user = profile.user
    user.is_active = True
    user.save(update_fields=['is_active'])

    return profile


def authenticate_user_with_jwt(username_or_email: str, password: str) -> Dict[str, Any]:
    """
    Authenticates user, verifies email confirmation status, and returns JWT tokens.
    """
    identifier = (username_or_email or '').strip()
    if not identifier or not password:
        raise AuthException("Username/email and password are required.", status_code=400)

    # Check if user passed email instead of username
    user = None
    if '@' in identifier:
        try:
            matched_user = User.objects.get(email__iexact=identifier)
            user = authenticate(username=matched_user.username, password=password)
        except User.DoesNotExist:
            user = None
    else:
        user = authenticate(username=identifier, password=password)

    if not user:
        raise AuthException("Invalid username/email or password.", status_code=401)

    # Ensure profile exists
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'role': 'admin' if user.is_staff else 'user', 'is_email_verified': user.is_superuser}
    )

    # Mandatory Email Verification Check
    if not profile.is_email_verified and not user.is_superuser:
        raise AuthException(
            "Your email address has not been verified yet. Please check your inbox for the verification link.",
            status_code=403
        )

    refresh = RefreshToken.for_user(user)
    # Add custom claims to token payload
    refresh['role'] = profile.role
    refresh['username'] = user.username
    refresh['email'] = user.email

    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": profile.role,
            "is_email_verified": profile.is_email_verified,
            "is_staff": user.is_staff
        }
    }


def _send_activation_email(user: User, verify_url: str):
    """Sends registration email with verification link."""
    subject = "Verify your email address - SilverHands"
    message = (
        f"Hello {user.username},\n\n"
        f"Welcome to SilverHands! Please verify your email address to activate your account and access all services.\n\n"
        f"Click the link below to verify your email:\n"
        f"{verify_url}\n\n"
        f"If you did not create an account on SilverHands, you can safely ignore this email.\n\n"
        f"Warm regards,\n"
        f"The SilverHands Team"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@silverhands.in')
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=True
        )
        logger.info(f"Verification email sent to {user.email} (Link: {verify_url})")
    except Exception as e:
        logger.warning(f"Could not send email via SMTP: {e}")

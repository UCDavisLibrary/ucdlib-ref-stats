import os
import json
import base64
from flask_appbuilder.security.manager import AUTH_OAUTH
from superset.security import SupersetSecurityManager

SECRET_KEY = os.environ['SUPERSET_SECRET_KEY']
SQLALCHEMY_DATABASE_URI = (
    f"{os.environ.get('DATABASE_DIALECT', 'postgresql+psycopg2')}://"
    f"{os.environ.get('DATABASE_USER', 'postgres')}:{os.environ.get('DATABASE_PASSWORD', 'localhost')}"
    f"@{os.environ.get('DATABASE_HOST', 'db')}:{os.environ.get('DATABASE_PORT', '5432')}"
    f"/{os.environ.get('DATABASE_DB', 'superset')}"
)

CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': 'redis://redis:6379/0',
}
DATA_CACHE_CONFIG = {**CACHE_CONFIG, 'CACHE_KEY_PREFIX': 'superset_data_'}
FILTER_STATE_CACHE_CONFIG = {**CACHE_CONFIG, 'CACHE_KEY_PREFIX': 'superset_filter_'}
EXPLORE_FORM_DATA_CACHE_CONFIG = {**CACHE_CONFIG, 'CACHE_KEY_PREFIX': 'superset_explore_'}

AUTH_TYPE = AUTH_OAUTH
AUTH_USER_REGISTRATION = True
# Fallback role for users who pass the auth_user_oauth gate but have no mapping.
# In practice, auth_user_oauth blocks anyone without a mapped role before this is used.
AUTH_USER_REGISTRATION_ROLE = 'Gamma'
AUTH_ROLES_SYNC_AT_LOGIN = True

FEATURE_FLAGS = {
    # Allow us to use the user's username in sql queries, e.g. {{ current_user.username }}.
    "ENABLE_TEMPLATE_PROCESSING": True,
}

ENABLE_PROXY_FIX = True
# x_prefix=1 tells ProxyFix to read X-Forwarded-Prefix from Apache so Flask
# generates URLs with the correct path prefix when behind a reverse proxy.
# Harmless in local dev when those headers are absent.
PROXY_FIX_CONFIG = {"x_for": 1, "x_proto": 1, "x_host": 1, "x_prefix": 1}

# Add custom time grains for academic quarter and academic year. 
# Used for bucketing time series data
# There is a little bit of error because we are using fixed dates due to implementation limitations
# fall - sept 25 | winter - jan 1 | spring - mar 25 | summer - june 22
TIME_GRAIN_ADDONS = {
    "academic_quarter": "Academic Quarter",
    "academic_year": "Academic Year",
    "fiscal_year": "Fiscal Year",
}
TIME_GRAIN_ADDON_EXPRESSIONS = {
    "postgresql": {
        "academic_quarter": """
            CASE
                WHEN {col} >= make_date(extract(year from {col})::int, 9, 25)::timestamp
                    THEN make_date(extract(year from {col})::int, 9, 25)::timestamp
                WHEN {col} >= make_date(extract(year from {col})::int, 6, 22)::timestamp
                    THEN make_date(extract(year from {col})::int, 6, 22)::timestamp
                WHEN {col} >= make_date(extract(year from {col})::int, 3, 25)::timestamp
                    THEN make_date(extract(year from {col})::int, 3, 25)::timestamp
                WHEN {col} >= make_date(extract(year from {col})::int, 1, 1)::timestamp
                    THEN make_date(extract(year from {col})::int, 1, 1)::timestamp
                ELSE make_date(extract(year from {col})::int - 1, 9, 25)::timestamp
            END
        """,
        "academic_year": """
            CASE
                WHEN {col} >= make_date(extract(year from {col})::int, 9, 25)::timestamp
                    THEN make_date(extract(year from {col})::int, 9, 25)::timestamp
                ELSE make_date(extract(year from {col})::int - 1, 9, 25)::timestamp
            END
        """,
        "fiscal_year": """
            date_trunc('year', ({col} - interval '6 months'))
            + interval '6 months'
        """,
    }
}

# Map Keycloak role names to Superset roles.
# role_keys is populated by KeycloakSecurityManager.oauth_user_info below.
AUTH_ROLES_MAPPING = {
    'admin-access': ['Admin'],
    'refstats-superset-alpha': ['Alpha'],
    'basic-access': ['Gamma'],
}

OAUTH_PROVIDERS = [{
    'name': 'cas',
    'icon': 'fa-key',
    'token_key': 'access_token',
    'remote_app': {
        'client_id': os.environ['SUPERSET_OIDC_CLIENT_ID'],
        'client_secret': os.environ['SUPERSET_OIDC_CLIENT_SECRET'],
        'server_metadata_url': os.environ['SUPERSET_OIDC_DISCOVERY_URL'],
        'client_kwargs': {'scope': 'openid email profile roles'},
    },
}]


def _decode_jwt_claims(token_str):
    """Base64-decode the payload of a JWT without verifying the signature."""
    payload = token_str.split('.')[1]
    payload += '=' * (4 - len(payload) % 4)
    return json.loads(base64.b64decode(payload))


class KeycloakSecurityManager(SupersetSecurityManager):
    def oauth_user_info(self, provider, response=None):
        """
        @description Extract user identity and roles from the Keycloak access token.
        Decodes the JWT directly so that realm_access and resource_access roles are
        available without requiring extra Keycloak protocol mappers on the userinfo endpoint.
        @param {str} provider - OAuth provider name
        @param response - OAuth token response containing access_token
        @returns {dict} User info dict with username, email, first_name, last_name, role_keys
        """
        if provider == 'cas':
            claims = _decode_jwt_claims(response['access_token'])
            client_id = os.environ.get('SUPERSET_OIDC_CLIENT_ID', '')
            all_roles = []
            all_roles += claims.get('roles') or []
            all_roles += claims.get('realm_access', {}).get('roles', [])
            all_roles += claims.get('resource_access', {}).get(client_id, {}).get('roles', [])
            return {
                'username': claims.get('preferred_username'),
                'email': claims.get('email', ''),
                'first_name': claims.get('given_name', ''),
                'last_name': claims.get('family_name', ''),
                'role_keys': list(set(all_roles)),
            }
        return super().oauth_user_info(provider, response)

    def auth_user_oauth(self, userinfo):
        """
        @description Block login for users with no recognized Keycloak role.
        Returns None to deny login if the user has no role in AUTH_ROLES_MAPPING.
        @param {dict} userinfo - User info dict returned by oauth_user_info
        @returns User object on success, None to deny login
        """
        role_keys = userinfo.get('role_keys', [])
        allowed = self.appbuilder.app.config.get('AUTH_ROLES_MAPPING', {})
        if not any(role in allowed for role in role_keys):
            return None
        return super().auth_user_oauth(userinfo)


CUSTOM_SECURITY_MANAGER = KeycloakSecurityManager

import {
    APIGatewayProxyHandlerV2,
    APIGatewayRequestSimpleAuthorizerHandlerV2WithContext,
} from "aws-lambda";
import { createSigner, createVerifier } from "fast-jwt";
const { OAuth2Client } = require('google-auth-library');

import https from "https";

const secretKey = process.env.JWT_SECRET_KEY!;
const oneWeekMillis = 7 * 24 * 60 * 60 * 1000;
const signToken = createSigner({
    key: secretKey,
    expiresIn: oneWeekMillis,
});
const verifyToken = createVerifier({ key: secretKey });

const cookieName = "login";
const adminEmail = process.env.ADMIN_EMAIL;
const clientId = process.env.GOOGLE_CLIENT_ID;

export const loginGoogle: APIGatewayProxyHandlerV2 = async (event) => {
    const { token } = event.queryStringParameters ?? {};
    if (!token) {
        return { statusCode: 400 };
    }

    const response = await fetchGoogleUserinfo(token);
    if (response.error) {
        return { statusCode: 401 };
    }
    const { email } = response;
    const jwt = signToken({ email, admin: adminEmail === email });
    const expires = new Date(Date.now() + oneWeekMillis).toUTCString();
    return {
        statusCode: 200,
        headers: {
            "Set-Cookie": `${cookieName}=${jwt}; Path=/; Expires=${expires}; Secure; HttpOnly`,
        },
    };
};

async function fetchGoogleUserinfo(
    token: string
): Promise<{ email: string; error?: string }> {
    const oAuth2Client =  new OAuth2Client();
    const decodedToken = await oAuth2Client.verifyIdToken({
        idToken: token,
        audience: clientId
    });
    const payload = decodedToken.getPayload();
    return payload;
}

export const logout: APIGatewayProxyHandlerV2 = async (event) => {
    const epoch = new Date(0).toUTCString();
    return {
        statusCode: 200,
        headers: {
            "Set-Cookie": `${cookieName}=; Path=/; Expires=${epoch}`,
        },
    };
};

interface AuthorizationContext {
    email: string | null;
    admin: boolean;
}

export const authorize: APIGatewayRequestSimpleAuthorizerHandlerV2WithContext<
    AuthorizationContext
> = async (event) => {
    try {
        const token = parseTokenFromCookie(event.cookies ?? []);
        const { email, admin } = verifyToken(token) as AuthorizationContext;
        return { isAuthorized: admin, context: { email, admin } };
    } catch (error) {
        return { isAuthorized: false, context: { email: null, admin: false } };
    }
};

function parseTokenFromCookie(cookies: string[]): string {
    const cookiePrefix = `${cookieName}=`;
    return (
        cookies
            .filter((cookie) => cookie.includes(cookiePrefix))
            .flatMap((cookie) => cookie.split(/;\s*/g))
            .filter((part) => part.startsWith(cookiePrefix))[0]
            ?.substring(cookiePrefix.length) ?? ""
    );
}

export const grant: APIGatewayProxyHandlerV2<AuthorizationContext> = async (
    event
) => {
    try {
        return verifyToken(parseTokenFromCookie(event.cookies ?? []));
    } catch (error) {
        return { email: null, admin: false };
    }
};
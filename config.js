const port = 3000;
const baseURL = `http://localhost:${port}`;
module.exports = {
    // The secret for the encryption of the jsonwebtoken
    JWTsecret: 'mysecret',
    baseURL: baseURL,
    port: port,
    // The credentials and information for OAuth2
    oauth2Credentials: {
        client_id: "301229724153-uqr45k3dpt7ivu1mmj9d5cv2e3hjaq5m.apps.googleusercontent.com",
        project_id: "Henno cinema", // The name of your project
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "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",
        redirect_uris: [
            `https://localhost:3000/auth_callback`
        ],
        scopes: [
            'https://www.googleapis.com/auth/youtube.readonly'
        ]
    }
};
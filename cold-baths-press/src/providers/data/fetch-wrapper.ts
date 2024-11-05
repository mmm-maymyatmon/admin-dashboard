import { GraphQLFormattedError } from 'graphql';

type Error = {
    message: string;
    statusCode: string | number; // Ensure consistency with status code types
}

const customFetch = async (url: string, options: RequestInit) => {
    const accessToken = localStorage.getItem("access_token");

    const headers = options.headers as Record<string, string>; 

    return await fetch(url, {
        ...options,
        headers: {
            ...headers,
            Authorization: headers?.Authorization || `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Apollo-Require-Preflight": "true",
        },
    });
};

const processGraphQLErrors = (body: Record<"errors", GraphQLFormattedError[] | undefined>): Error | null => {
    if (!body || Object.keys(body).length === 0) {
        return {
            message: 'Unknown Error',
            statusCode: "INTERNAL_SERVER_ERROR",
        };
    }
    
    if ("errors" in body) {
        const errors = body.errors;
        const messages = errors?.map((error) => error?.message)?.join(", ") || "No messages available";
        const code = errors?.[0]?.extensions?.code || 500; // Default to 500 if no code provided
        
        return {
            message: messages,
            statusCode: code,
        };
    }

    return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
    const response = await customFetch(url, options);
    
    if (!response.ok) {
        // Handle HTTP error response
        const errorBody = await response.json();
        const error = processGraphQLErrors(errorBody);
        if (error) {
            return error; 
        }
    }

    return response; // Return the original response if no error
};

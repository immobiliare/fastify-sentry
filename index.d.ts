import {
    FastifyPluginCallback,
} from 'fastify';
import Sentry, { Hub, NodeOptions } from '@sentry/node';

import { shouldHandleError, errorResponse, getTransactionName, extractRequestData, extractUserData } from './utils';

type FastifySentryPlugin = FastifyPluginCallback<fastifySentry.FastifySentryOptions>

declare namespace fastifySentry {
    export interface FastifySentryOptions extends NodeOptions {
        /** Set the plugin error handler */
        setErrorHandler?: boolean
        /** Called inside the error handler, it should return `true` of `false`depending on the fact we want to send the error to Sentry or not */
        shouldHandleError?: typeof shouldHandleError
        /**  Custom hook to respond the errored request */
        errorResponse?: typeof errorResponse
        /** Custom function to build the transaction name from the request */
        getTransactionName?: typeof getTransactionName
        /** Custom function to extract the request data */
        extractRequestData?: typeof extractRequestData
        /** Custom function to extract the user data from the request */
        extractUserData?: typeof extractUserData
        /** Skip Sentry.init call (useful in serverless integrations, see https://github.com/immobiliare/fastify-sentry/issues/621) */
        skipInit?: boolean
    }
    export const fastifySentry: FastifySentryPlugin
    export { fastifySentry as default }
}

declare function fastifySentry(...params: Parameters<FastifySentryPlugin>): ReturnType<FastifySentryPlugin>
export = fastifySentry;

declare module 'fastify' {
    interface FastifyInstance {
        Sentry: typeof Sentry;
    }
    interface FastifyReply {
        /** The event id generated by Sentry.captureException */
        sentryEventId: string
        /** The request transaction (available if tracing is enabled) */
        sentryTransaction: ReturnType<Hub['startTransaction']> | null
    }
}

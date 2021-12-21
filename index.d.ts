import {
    FastifyError,
    FastifyRequest,
    FastifyReply,
    FastifyPluginCallback,
    FastifyPluginAsync
} from 'fastify';
import Sentry from '@sentry/node';

export interface SentryPluginOptions extends Sentry.NodeOptions {
    allowedStatusCodes?: number[];
    onErrorFactory?: (options: {
        environment: string;
        allowedStatusCodes: number[];
    }) => (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void | Promise<void>;
}

export const sentryPluginCallback: FastifyPluginCallback<SentryPluginOptions>;
export const sentryPluginAsync: FastifyPluginAsync<SentryPluginOptions>;

export default sentryPluginCallback;

declare module 'fastify' {
    interface FastifyInstance {
        Sentry: typeof Sentry;
    }
}

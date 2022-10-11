import { FastifyRequest } from "fastify"

export enum RequestKeys {
    'headers',
    'method',
    'protocol',
    'url',
    'cookies',
    'query_string',
    'data'
}

export type RequestData = {
    headers?: FastifyRequest['headers'] | any,
    method?: FastifyRequest['method'] | any,
    protocol?: FastifyRequest['protocol'] | any,
    cookies?: Record<string, string>,
    query_string?: FastifyRequest['query'] | any,
    data?: string
} & Record<string, any>

export type UserData = {
    id?: string | number,
    username: string,
    email?: string
} & Record<string, any>

export function tryToExtractBody (request: FastifyRequest): string

export function extractRequestData(request: FastifyRequest, keys: RequestKeys): RequestData

export function extractUserData(request: FastifyRequest): UserData

export function getTransactionName(request: FastifyRequest): string

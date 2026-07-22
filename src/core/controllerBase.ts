/**
 * Express Controller & Decorator Utilities
 * -----------------------------------------
 * This file provides decorators to simplify the declaration of Express routes and controller-level settings,
 * including route method decorators (Get, Post, etc.), and a base Controller class that auto-registers routes.
 */

import { Request, RequestHandler, Response, Router } from 'express';
import { RouteAccessLevel, RouteDefinition, UserAccessLevel } from '../types/typeCore';
import 'reflect-metadata';
import { checkAuth } from '~/middlewares/auth';

/**
 * Extended Express request/response interfaces
 */
export interface AppRequest<T = any, Y = any> extends Request<any, any, T, Y> {}
export interface AppParams<P = any, T = any> extends Request<P, any, T> {}
export interface AppQuery<T = any> extends Request<any, any, any, T> {}
export interface AppResponse<T = any> extends Response<T> {}

export const ROUTES_METADATA_KEY = Symbol('routes');
export const CONTROLLER_CONFIG_KEY = Symbol('controller_config');

/**
 * @description Decorator to define route metadata
 * @param method HTTP verb
 * @param path Route path
 * @param authLevel Required access level (default: ADMIN)
 * @param middlewares Additional middlewares
 */
export function Route<C = any>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, authLevel: RouteAccessLevel<C> = UserAccessLevel.ADMIN, ...middlewares: RequestHandler[]): (target: any, propertyKey: string) => void {
    return function (target: any, propertyKey: string): void {
        const routes: RouteDefinition[] = Reflect.getOwnMetadata(ROUTES_METADATA_KEY, target) || [];
        routes.push({
            method,
            path,
            handlerName: propertyKey,
            accessLevel: authLevel,
            middlewares,
        });
        Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target);
    };
}

/**
 * Shorthand decorators for route methods
 */
export const Get = <C = any>(path: string, accessLevel?: RouteAccessLevel<C>, ...middlewares: RequestHandler[]): ((target: any, propertyKey: string) => void) => Route('get', path, accessLevel ?? UserAccessLevel.ADMIN, ...middlewares);
export const Post = <C = any>(path: string, accessLevel?: RouteAccessLevel<C>, ...middlewares: RequestHandler[]): ((target: any, propertyKey: string) => void) => Route('post', path, accessLevel ?? UserAccessLevel.ADMIN, ...middlewares);
export const Put = <C = any>(path: string, accessLevel?: RouteAccessLevel<C>, ...middlewares: RequestHandler[]): ((target: any, propertyKey: string) => void) => Route('put', path, accessLevel ?? UserAccessLevel.ADMIN, ...middlewares);
export const Patch = <C = any>(path: string, accessLevel?: RouteAccessLevel<C>, ...middlewares: RequestHandler[]): ((target: any, propertyKey: string) => void) => Route('patch', path, accessLevel ?? UserAccessLevel.ADMIN, ...middlewares);
export const Delete = <C = any>(path: string, accessLevel?: RouteAccessLevel<C>, ...middlewares: RequestHandler[]): ((target: any, propertyKey: string) => void) => Route('delete', path, accessLevel ?? UserAccessLevel.ADMIN, ...middlewares);

/**
 * @description Decorator to define default controller-level config (access level and global middlewares)
 */
export interface ControllerConfigOptions {
    accessLevel?: UserAccessLevel;
    baseRoute?: string;
    middlewares?: RequestHandler[];
}

/**
 * @param config Controller-level options (accessLevel, global middlewares)
 */
export function ControllerConfig(config: ControllerConfigOptions): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(CONTROLLER_CONFIG_KEY, config, target);
    };
}

/**
 * @class ControllerBase
 * @description Base controller class that registers all decorated routes automatically.
 */
class ControllerBase {
    protected readonly Route = Router();

    constructor() {
        const proto = Object.getPrototypeOf(this);
        const routes: RouteDefinition[] = [];

        let currentPrototype = proto;

        while (currentPrototype && currentPrototype !== ControllerBase.prototype) {
            const currentRoutes: RouteDefinition[] = Reflect.getOwnMetadata(ROUTES_METADATA_KEY, currentPrototype) ?? [];
            /*
             * Les routes du contrôleur enfant sont enregistrées avant
             * les routes génériques de TableController.
             */
            routes.push(...currentRoutes);

            currentPrototype = Object.getPrototypeOf(currentPrototype);
        }

        const controllerConfig: ControllerConfigOptions = Reflect.getMetadata(CONTROLLER_CONFIG_KEY, proto.constructor) || {};

        for (const { method, path, handlerName, accessLevel, middlewares } of routes) {
            const configuredAccessLevel = accessLevel ?? controllerConfig.accessLevel ?? UserAccessLevel.ADMIN;

            const authMiddleware: RequestHandler = async (req, res, next): Promise<void> => {
                try {
                    const finalAccessLevel = typeof configuredAccessLevel === 'function' ? await configuredAccessLevel(this, req) : configuredAccessLevel;

                    await checkAuth(req, res, next, finalAccessLevel);
                } catch (error) {
                    next(error);
                }
            };

            const allMiddlewares: RequestHandler[] = [authMiddleware, ...(controllerConfig.middlewares || []), ...(middlewares || [])];

            const handler = (this as any)[handlerName];

            if (typeof handler !== 'function') {
                throw new TypeError(`La méthode "${handlerName}" est introuvable dans ${this.constructor.name}`);
            }

            this.Route[method](path, ...allMiddlewares, handler.bind(this));
        }
    }

    private getRouteDefinitions(): RouteDefinition[] {
        const prototypes: object[] = [];

        let prototype = Object.getPrototypeOf(this);
        while (prototype && prototype !== Object.prototype) {
            prototypes.unshift(prototype);
            prototype = Object.getPrototypeOf(prototype);
        }
        return prototypes.flatMap((currentPrototype) => Reflect.getOwnMetadata(ROUTES_METADATA_KEY, currentPrototype) ?? []);
    }

    /**
     * @returns {Router} The Express router with all auto-registered routes.
     */
    public get router(): Router {
        return this.Route;
    }
}

export default ControllerBase;

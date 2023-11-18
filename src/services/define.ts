import { ObjectType } from 'typeorm';
import { Factory } from './factory';

export const factories: Record<string, Factory> = {};

export type DefineCallback = () => Factory;

/**
 * Usage:
 * define(UserEntity, () => {
 *      const factory = new Factory();
 *      factory.trait('withPosts', async (user) => {
 *              const posts = await factory(PostEntity).createMany(3, { user });
 *              user.posts = posts;
 *      });
 *      factory.trait('admin', async (user) => {
 *              user.admin = true;
 *      });
 *
 *      factory.build(async (options) => {
 *              const user = new UserEntity();
 *              user.name = faker.name.findName();
 *              user.email = faker.internet.email();
 *
 *              user.posts = await factory(PostEntity).createMany(3, { user });
 *
 *              return user;
 *      })
 *
 *     return factory;
 * })
 */
export function define<Entity>(entity: ObjectType<Entity>, callback: DefineCallback): void {
    factories[entity.name] = callback();
}

import { ObjectType } from 'typeorm';
import { Factory } from './factory';

export const factories: Record<string, Factory> = {};

export type DefineCallback = (factory: Factory) => void;

/**
 * Usage:
 * define(UserEntity, (factory: Factory) => {
 *      factory.trait('withPosts', async (user) => {
 *              const posts = await factory(PostEntity).createMany(3, { user });
 *              user.posts = posts;
 *      });
 *      factory.trait('admin', async (user) => {
 *              user.admin = true;
 *      });
 *
 *      factory.associationMany('posts', Post, 3, {
 *        title: faker.lorem.sentence,
 *        content: faker.lorem.paragraph,
 *      }, 'user');
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
 * })
 */
export function define<Entity>(entity: ObjectType<Entity>, callback: DefineCallback): void {
    const factory = new Factory();
    callback(factory);

    factories[entity.name] = factory;
}

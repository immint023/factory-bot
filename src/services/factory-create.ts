import { BaseEntity, ObjectType } from 'typeorm';
import { factories } from './define';
import { FactoryBuilder } from './factory';

/**
 * Usage:
 *
 * factory(UserEntity).setTraits('withPosts', 'admin').saveOne({ name: 'John' });
 * */
export function factory<T extends BaseEntity>(entity: ObjectType<T>): FactoryBuilder<T> {
    const factory = factories[entity.name];

    return new FactoryBuilder<T>(factory);
}

import { BaseEntity, ObjectType } from 'typeorm';
import { FactoryNotRegisteredError } from '../errors/factory-not-registered';
import { factories } from './define';
import { FactoryBuilder } from './factory';

/**
 * Usage:
 *
 * factory(UserEntity).withTraits('withPosts', 'admin').saveOne({ name: 'John' });
 * */
export function factory<T extends BaseEntity>(entity: ObjectType<T>): FactoryBuilder<T> {
    const factory = factories[entity.name];

    if (!factory) {
        throw new FactoryNotRegisteredError(entity.name);
    }

    return new FactoryBuilder<T>(factory);
}

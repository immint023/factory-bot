import { BaseEntity, ObjectType } from 'typeorm';
import { factory } from './factory-create';

type AfterSaveCallback = (entity?: any) => Promise<void> | void;

type TraitCallbackReturn = {
    afterSave: AfterSaveCallback;
};

type TraitCallback = (entity?: any) => Promise<TraitCallbackReturn> | TraitCallbackReturn | Promise<void> | void;

type AssociationManyData = {
    entity: ObjectType<any>;
    count: number;
    options: Record<string, any>;
    relation: string;
};

type AssociationOneData = {
    entity: ObjectType<any>;
    options: Record<string, any>;
    relation: string;
};

export class Factory {
    public readonly traits: Record<string, TraitCallback> = {};
    public buildCallback: () => Promise<any>;
    public afterSaveCallback: (entity: any) => Promise<void> | void;
    public associationManyData: Record<string, AssociationManyData> = {};
    public associationOneData: Record<string, AssociationOneData> = {};

    trait(name: string, callback: TraitCallback): void {
        this.traits[name] = callback;
    }

    build(callback: () => Promise<any> | any): void {
        this.buildCallback = callback;
    }

    associationMany(
        name: string,
        relation: string,
        entity: ObjectType<any>,
        count: number,
        options: Record<string, any> = {}
    ): void {
        this.associationManyData[name] = {
            entity,
            count,
            options,
            relation
        };
    }

    associationOne(name: string, relation: string, entity: ObjectType<any>, options: Record<string, any> = {}): void {
        this.associationOneData[name] = {
            entity,
            options,
            relation
        };
    }

    afterSave(callback: (entity: any) => Promise<void> | void): void {
        this.afterSaveCallback = callback;
    }
}

export class FactoryBuilder<T extends BaseEntity> {
    private traits: string[] = [];

    constructor(private factory: Factory) {}

    withTraits(...traits: string[]): this {
        this.traits = traits;

        return this;
    }

    selectedTraits(): TraitCallback[] {
        return this.traits.map((trait) => this.factory.traits[trait]);
    }

    async saveOne(options: Record<string, any> = {}): Promise<T> {
        const entity = (await this.factory.buildCallback()) as T;

        for (const [key, value] of Object.entries(options)) {
            entity[key] = value;
        }
        await entity.save();

        const afterSaveTraitCallbacks: AfterSaveCallback[] = [];
        for (const trait of this.selectedTraits()) {
            const traitResponse = (await trait(entity)) as TraitCallbackReturn;

            if (traitResponse?.afterSave) {
                afterSaveTraitCallbacks.push(traitResponse.afterSave);
            }
        }

        await entity.save();

        for (const callback of afterSaveTraitCallbacks) {
            await callback(entity);
        }

        // NOTE: build associations for save many
        for (const [association, data] of Object.entries(this.factory.associationManyData)) {
            // NOTE: if property is already set, skip
            if (entity[association]) {
                continue;
            }

            const models = await factory(data.entity).saveMany(data.count, {
                ...data.options,
                [data.relation]: entity
            });

            entity[association] = models;
            await entity.save();
        }

        // NOTE: build associations for save one
        for (const [association, data] of Object.entries(this.factory.associationOneData)) {
            // NOTE: if property is already set, skip
            if (entity[association]) {
                continue;
            }

            const model = await factory(data.entity).saveOne({
                ...data.options,
                [data.relation]: entity
            });

            entity[association] = model;
            await entity.save();
        }

        return entity;
    }

    async saveMany(count: number, options: Record<string, any> = {}): Promise<T[]> {
        const models = [] as T[];

        for (let i = 0; i < count; i++) {
            models.push(await this.saveOne(options));
        }

        return models;
    }
}

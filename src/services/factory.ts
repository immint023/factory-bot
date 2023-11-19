import { BaseEntity } from 'typeorm';

type TraitCallbackReturn = {
    afterSave: () => Promise<void> | void;
};

type TraitCallback = (entity: any) => Promise<TraitCallbackReturn> | TraitCallbackReturn | Promise<void> | void;

export class Factory {
    public readonly traits: Record<string, TraitCallback> = {};
    public buildCallback: (options: Record<string, any>) => Promise<any>;
    public afterSaveCallback: (entity: any) => Promise<void> | void;

    trait(name: string, callback: TraitCallback): void {
        this.traits[name] = callback;
    }

    build(callback: (options: Record<string, any>) => Promise<any> | any): void {
        this.buildCallback = callback;
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
        const entity = (await this.factory.buildCallback({
            ...options
        })) as T;

        for (const trait of this.selectedTraits()) {
            const traitResponse = (await trait(entity)) as TraitCallbackReturn;

            if (traitResponse?.afterSave) {
                await traitResponse.afterSave();
            }
        }

        await entity.save();

        return entity;
    }

    async saveMany(count: number, options: Record<string, any> = {}): Promise<T[]> {
        const users = [] as T[];

        for (let i = 0; i < count; i++) {
            users.push(await this.saveOne(options));
        }

        return users;
    }
}

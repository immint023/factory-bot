export class FactoryNotRegisteredError extends Error {
    constructor(name: string) {
        super(`Factory for "${name}" is not registered`);
    }
}

# factory-bot

> The factory lib to create seed data for testing easily


## Install

```bash
npm install @hodfords/factory-bot
```

## Usage
### Define factory
```typescript
// user.factory.ts

 define(UserEntity, (factory: Factory) => {
    factory.trait('withPosts', async (user: UserEntity) => {
        user.posts = await factoryBuilder(PostEntity).saveMany(3, { title: 'Post title', body: 'Post body' });
    });

    factory.trait('withAdmin', (user: UserEntity) => {
        user.role = 'admin';
    });

    factory.build((options: Record<string, any>) => {
        const user = new UserEntity();

        user.id = options.id || 1;
        user.name = options.name || 'John Doe';
        user.email = options.email || 'example@gmail.com';

        return user;
    });
});
```

### Create data
```typescript
const user = await factoryBuilder(UserEntity).
    withTraits('withAdmin').
    saveOne();
```

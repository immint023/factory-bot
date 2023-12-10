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

 define(UserEntity, (f: Factory) => {
    f.trait('withPosts', async (user: UserEntity) => {
        user.posts = await factory(PostEntity).saveMany(3, { title: 'Post title', body: 'Post body' });
    });

    f.trait('withAdmin', (user: UserEntity) => {
        user.role = 'admin';
    });

    f.build((options: Record<string, any>) => {
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
const user = await factory(UserEntity).
    withTraits('withAdmin').
    saveOne();
```

import { BaseEntity, Column, DataSource, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { define } from '../src/services/define';
import { Factory } from '../src/services/factory';
import { factoryBuilder } from '../src/services/factory-create';

@Entity()
class UserEntity extends BaseEntity {
    @PrimaryColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    role: string;

    @OneToMany(() => PostEntity, (post) => post.user)
    posts: PostEntity[];
}

@Entity()
class PostEntity extends BaseEntity {
    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    body: string;

    @Column({ nullable: true })
    userId: number;

    @ManyToOne(() => UserEntity, (user) => user.posts)
    user: UserEntity;
}

describe('#factory', () => {
    let dataSource: DataSource;

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            entities: [UserEntity, PostEntity],
            synchronize: true,
            logging: false
        });

        await dataSource.initialize();

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

        define(PostEntity, (factory: Factory) => {
            factory.build((options: Record<string, any>) => {
                const post = new PostEntity();

                post.id = options.id || 1;
                post.title = options.title || 'Post title';
                post.body = options.body || 'Post body';
                post.userId = options.userId;

                return post;
            });
        });
    });

    describe('with standard usage', () => {
        it('should create a new entity', async () => {
            const user = await factoryBuilder(UserEntity).saveOne();

            expect(user).toBeInstanceOf(UserEntity);
            expect(user.name).toBe('John Doe');
            expect(user.email).toBe('example@gmail.com');
            expect(user.posts).toBeUndefined();
        });
    });

    describe('with traits', () => {
        describe('withPosts', () => {
            it('should create a new entity with traits', async () => {
                const user = await factoryBuilder(UserEntity).withTraits('withPosts').saveOne();

                expect(user).toBeInstanceOf(UserEntity);
                expect(user.name).toBe('John Doe');
                expect(user.email).toBe('example@gmail.com');

                expect(user.posts).toHaveLength(3);
            });
        });

        describe('withAdmin', () => {
            it('should create a new entity with traits and options', async () => {
                const user = await factoryBuilder(UserEntity).withTraits('withAdmin').saveOne();
                expect(user.role).toBe('admin');
            });
        });

        describe('with options', () => {
            it('should create a new entity with options', async () => {
                const user = await factoryBuilder(UserEntity).saveOne({
                    name: 'Minh Ngo',
                    email: 'test'
                });
                const post = await factoryBuilder(PostEntity).saveOne({
                    title: 'Post title',
                    body: 'Post body',
                    userId: user.id
                });

                expect(user.name).toBe('Minh Ngo');
                expect(user.email).toBe('test');
                expect(post.title).toBe('Post title');
                expect(post.body).toBe('Post body');
                expect(post.userId).toBe(user.id);
            });
        });
    });
});

import { BaseEntity, Column, DataSource, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { define } from '../src/services/define';
import { Factory } from '../src/services/factory';
import { faker } from '@faker-js/faker';
import { factory } from '../src/services/factory-create';

@Entity()
class UserEntity extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    role: string;

    @OneToMany(() => PostEntity, (post) => post.user)
    posts: PostEntity[];

    @OneToMany(() => ArticleEntity, (article) => article.user)
    articles: ArticleEntity[];
}

@Entity()
class PostEntity extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    title: string;

    @Column()
    body: string;

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => UserEntity, (user) => user.posts)
    user: UserEntity;
}

@Entity()
class ArticleEntity extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    title: string;

    @Column()
    body: string;

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => UserEntity, (user) => user.articles)
    user: UserEntity;
}

describe('#factory', () => {
    let dataSource: DataSource;

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            entities: [UserEntity, PostEntity, ArticleEntity],
            synchronize: true,
            logging: false
        });

        await dataSource.initialize();

        define(UserEntity, (f: Factory) => {
            f.associationMany('articles', 'articles', ArticleEntity, 3);

            f.trait('withAdmin', (user: UserEntity) => {
                user.role = 'admin';
            });

            f.trait('withPosts', async (user: UserEntity) => {
                const posts = await factory(PostEntity).saveMany(3, { user });
                user.posts = posts;

                await user.save();
            });

            f.build(() => {
                const user = new UserEntity();

                user.id = faker.string.uuid();
                user.name = 'John Doe';
                user.email = 'example@gmail.com';

                return user;
            });

            f.afterSave(async (user: UserEntity) => {
                user.role = 'admin';

                await user.save();
            });
        });

        define(PostEntity, (f: Factory) => {
            f.associationOne('user', 'user', UserEntity);

            f.build(() => {
                const post = new PostEntity();

                post.id = faker.string.uuid();
                post.title = 'Post title';
                post.body = 'Post body';

                return post;
            });
        });

        define(ArticleEntity, (f: Factory) => {
            f.build(() => {
                const article = new ArticleEntity();

                article.id = faker.string.uuid();
                article.title = 'Post title';
                article.body = 'Post body';

                return article;
            });
        });
    });

    describe('with afterSave', () => {
        it('should handle afterSave callback', async () => {
            const user = await factory(UserEntity).saveOne();

            expect(user.role).toBe('admin');
        });
    });

    describe('with saveMany', () => {
        it('should create many entities', async () => {
            const users = await factory(UserEntity).saveMany(3);

            expect(users).toHaveLength(3);
        });
    });

    describe('with standard usage', () => {
        it('should create a new entity', async () => {
            const user = await factory(UserEntity).withTraits('withPosts').saveOne();

            expect(user).toBeInstanceOf(UserEntity);
            expect(user.name).toBe('John Doe');
            expect(user.email).toBe('example@gmail.com');
            expect(user.posts).toHaveLength(3);
            expect(user.posts[0].userId).toBe(user.id);
        });
    });

    describe('with association', () => {
        describe('with one', () => {
            it('should create a new entity with association', async () => {
                const post = await factory(PostEntity).saveOne();

                expect(post).toBeInstanceOf(PostEntity);
                expect(post.user).toBeInstanceOf(UserEntity);
            });
        });
        describe('with many', () => {
            it('should create a new entity with association', async () => {
                const user = await factory(UserEntity).saveOne();

                const articles = await ArticleEntity.count({
                    where: {
                        userId: user.id
                    }
                });

                expect(articles).toBe(3);
            });

            describe('when association is already set', () => {
                it('should not override the association', async () => {
                    const article = await factory(ArticleEntity).saveOne();
                    const user = await factory(UserEntity).saveOne({
                        articles: [article]
                    });

                    expect(user.articles).toHaveLength(1);
                });
            });
        });
    });

    describe('with traits', () => {
        describe('withPosts', () => {
            it('should create a new entity with traits', async () => {
                const user = await factory(UserEntity).withTraits('withPosts').saveOne();

                expect(user).toBeInstanceOf(UserEntity);
                expect(user.name).toBe('John Doe');
                expect(user.email).toBe('example@gmail.com');

                const reloadedUser = await UserEntity.findOne({
                    where: {
                        id: user.id
                    },
                    relations: ['posts']
                });

                expect(reloadedUser.posts).toHaveLength(3);
            });
        });

        describe('withAdmin', () => {
            it('should create a new entity with traits and options', async () => {
                const user = await factory(UserEntity).withTraits('withAdmin').saveOne();
                expect(user.role).toBe('admin');
            });
        });

        describe('with options', () => {
            it('should create a new entity with options', async () => {
                const user = await factory(UserEntity).saveOne({
                    name: 'Minh Ngo',
                    email: 'test'
                });
                const post = await factory(PostEntity).saveOne({
                    title: 'Post title',
                    body: 'Post body',
                    user
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

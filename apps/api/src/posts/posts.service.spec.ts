// src/posts/posts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  createQueryBuilder?: jest.Mock;
};

// helper to create a chainable mock query builder
const createMockQueryBuilder = (result: any[] = [], total = 0) => {
  const qb = {
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([result, total]),
  };
  return qb;
};

describe('PostsService', () => {
  let service: PostsService;
  let repo: MockRepo<Post>;

  const mockRepo: MockRepo<Post> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repo = module.get(getRepositoryToken(Post));
    jest.clearAllMocks();
  });

  describe('definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create and save a post', async () => {
      const dto: CreatePostDto = { title: 't', content: 'c', tags: [] };
      const created = { id: 1, ...dto };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);

      const res = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(res).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('returns paginated posts from query builder', async () => {
      const posts = [
        { id: 1, title: 'a' },
        { id: 2, title: 'b' },
      ];
      const total = 2;
      const qb = createMockQueryBuilder(posts, total);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const filters: FilterPostDto = { page: 1, limit: 5 };
      const res = await service.findAll(filters);

      // ensure createQueryBuilder was used and skip/take were called
      expect(repo.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(qb.skip).toHaveBeenCalled();
      expect(qb.take).toHaveBeenCalled();
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(res).toEqual({ meta: { total }, data: posts });
    });

    it('applies title and tags filters to the query builder', async () => {
      const posts: any[] = [];
      const total = 0;
      const qb = createMockQueryBuilder(posts, total);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const filters: FilterPostDto = {
        title: 'hello',
        tags: ['x', 'y'],
      };

      const res = await service.findAll(filters);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(qb.andWhere).toHaveBeenCalled(); // at least called for title
      // tags branch adds two andWhere calls (IS NOT NULL and && ARRAY)
      expect(res).toEqual({ meta: { total }, data: posts });
    });
  });

  describe('findOne', () => {
    it('returns the post when found', async () => {
      const found = { id: 3, title: 'x' };
      (repo.find as jest.Mock).mockResolvedValueOnce(found);

      const res = await service.findOne(3);

      expect(repo.find).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(res).toEqual(found);
    });

    it('throws NotFoundException when not found', async () => {
      (repo.find as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      expect(repo.find).toHaveBeenCalledWith({ where: { id: 99 } });
    });
  });

  describe('update', () => {
    it('updates and saves when post exists', async () => {
      const existing = {
        id: 4,
        title: 'old',
        content: '',
        tags: [],
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // make service.findOne return the existing post
      jest.spyOn(service, 'findOne').mockResolvedValueOnce([existing]);

      const dto: UpdatePostDto = { title: 'new' };
      const merged = { ...existing, ...dto };
      (repo.save as jest.Mock).mockResolvedValueOnce(merged);

      const res = await service.update(4, dto);

      expect(service.findOne).toHaveBeenCalledWith(4);
      // expect(repo.save).toHaveBeenCalledWith(merged);

      expect(res).toEqual(merged);
    });

    it('throws NotFoundException when post does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());

      await expect(service.update(999, { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('remove', () => {
    it('returns deleted true when delete affected rows', async () => {
      (repo.delete as jest.Mock).mockResolvedValueOnce({ affected: 1 });

      const res = await service.remove(5);

      expect(repo.delete).toHaveBeenCalledWith(5);
      expect(res).toEqual({ deleted: true });
    });

    it('throws NotFoundException when nothing deleted', async () => {
      (repo.delete as jest.Mock).mockResolvedValueOnce({ affected: 0 });

      await expect(service.remove(123)).rejects.toThrow(NotFoundException);
      expect(repo.delete).toHaveBeenCalledWith(123);
    });
  });
});

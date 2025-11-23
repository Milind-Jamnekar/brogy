// src/posts/posts.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostDto } from './dto/create-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

// minimal mock implementations for service methods used by controller
const mockPostsService = {
  create: jest.fn(),
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: typeof mockPostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and return created post', async () => {
      const dto: CreatePostDto = { title: 'hello', content: 'world', tags: [] };
      const created = { id: 1, ...dto };
      postsService.create.mockResolvedValueOnce(created);

      const res = await controller.create(dto);

      expect(postsService.create).toHaveBeenCalledWith(dto);
      expect(res).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query and return posts', async () => {
      const query: FilterPostDto = { title: 'x' };
      const returned = [{ id: 1, title: 'x' }];
      postsService.findAll.mockResolvedValueOnce(returned);

      const res = await controller.findAll(query);

      expect(postsService.findAll).toHaveBeenCalledWith(query);
      expect(res).toBe(returned);
    });

    it('should work with empty query', async () => {
      const returned = [];
      postsService.findAll.mockResolvedValueOnce(returned);

      const res = await controller.findAll({} as FilterPostDto);

      expect(postsService.findAll).toHaveBeenCalledWith({});
      expect(res).toBe(returned);
    });
  });

  describe('findOne', () => {
    it('should convert id to number, call service.findOne and return result', async () => {
      postsService.findOne.mockResolvedValueOnce({
        id: 2,
        title: 't',
      });

      const res = await controller.findOne('2');

      expect(postsService.findOne).toHaveBeenCalledWith(2);
      expect(res).toEqual({ id: 2, title: 't' });
    });
  });

  describe('update', () => {
    it('should convert id to number and call service.update with id and dto', async () => {
      const dto: UpdatePostDto = { title: 'updated' };
      const updated = { id: 3, ...dto };
      postsService.update.mockResolvedValueOnce(updated);

      const res = await controller.update('3', dto);

      expect(postsService.update).toHaveBeenCalledWith(3, dto);
      expect(res).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should convert id to number and call service.remove and return result', async () => {
      postsService.remove.mockResolvedValueOnce({
        deleted: true,
      });

      const res = await controller.remove('5');

      expect(postsService.remove).toHaveBeenCalledWith(5);
      expect(res).toEqual({ deleted: true });
    });
  });
});
